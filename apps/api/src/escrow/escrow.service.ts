import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type EscrowLedgerEntryDto,
  type EscrowPlayerLedgerBalanceDto,
  type EscrowTransferQueueRecordDto,
  type FailEscrowTransferRequest,
  type FinalizeEscrowTransferRequest,
  type QueueEscrowTransferRequest,
  type RecordHandSettlementRequest,
  type RoomCloseoutReconciliationRequest,
  type RoomCloseoutReconciliationResultDto,
} from "@cryptopoker/contracts";
import { LobbyStore } from "../lobby/lobby.store.js";
import { ESCROW_FOUNDATION_PLAN, type EscrowFoundationPlan } from "./escrow.types.js";

type TransferType = "payout" | "refund";

type TransferState = EscrowTransferQueueRecordDto["state"];

@Injectable()
export class EscrowService {
  private readonly ledgerByRoom = new Map<string, EscrowLedgerEntryDto[]>();
  private readonly balancesByRoom = new Map<string, Map<string, EscrowPlayerLedgerBalanceDto>>();
  private readonly handSettlementLedgerEntryIdByHand = new Map<string, string>();
  private readonly transferById = new Map<string, EscrowTransferQueueRecordDto>();
  private readonly transferIdByIdempotencyKey = new Map<string, string>();
  private readonly processedEscrowEvents = new Set<string>();
  private readonly processedTxHashes = new Set<string>();

  constructor(private readonly lobbyStore: LobbyStore) {}

  getFoundationPlan(): EscrowFoundationPlan {
    return ESCROW_FOUNDATION_PLAN;
  }

  recordHandSettlement(request: RecordHandSettlementRequest): {
    idempotent: boolean;
    ledgerEntry: EscrowLedgerEntryDto;
    balances: EscrowPlayerLedgerBalanceDto[];
  } {
    const existingLedgerId = this.handSettlementLedgerEntryIdByHand.get(request.handId);
    if (existingLedgerId) {
      const existingEntry = this.findLedgerEntryById(existingLedgerId);
      if (!existingEntry) {
        throw new BadRequestException({ code: "HAND_SETTLEMENT_CORRUPT", message: "Recorded settlement ledger entry could not be found." });
      }
      return {
        idempotent: true,
        ledgerEntry: existingEntry,
        balances: this.listBalances(request.roomId),
      };
    }

    if (!request.deltas.length) {
      throw new BadRequestException({ code: "HAND_SETTLEMENT_REQUIRED", message: "At least one settlement delta is required." });
    }

    const totalDelta = request.deltas.reduce((sum: number, item: { delta: number }) => sum + item.delta, 0);
    if (!isZero(totalDelta)) {
      throw new BadRequestException({ code: "HAND_SETTLEMENT_IMBALANCED", message: "Settlement deltas must sum to zero for each Hand." });
    }

    for (const item of request.deltas) {
      const playerBalance = this.ensurePlayerBalance(request.roomId, item.playerId);
      playerBalance.settlementDelta = roundMoney(playerBalance.settlementDelta + item.delta);
      playerBalance.withdrawableBalance = roundMoney(playerBalance.startingBalance + playerBalance.settlementDelta - playerBalance.inPlayAllocation);
    }

    const referenceId = request.handId;
    const ledgerEntry = this.appendLedgerEntry({
      roomId: request.roomId,
      playerId: "room",
      entryType: "settlement",
      referenceType: "hand",
      referenceId,
      amountDelta: roundMoney(totalDelta),
      status: "confirmed",
      metadata: {
        handId: request.handId,
        deltas: request.deltas,
      },
    });
    this.handSettlementLedgerEntryIdByHand.set(request.handId, ledgerEntry.id);
    this.lobbyStore.applyPendingTopUps(request.roomId);

    return {
      idempotent: false,
      ledgerEntry,
      balances: this.listBalances(request.roomId),
    };
  }

  queuePayout(request: QueueEscrowTransferRequest): EscrowTransferQueueRecordDto {
    return this.queueTransfer("payout", request);
  }

  queueRefund(request: QueueEscrowTransferRequest): EscrowTransferQueueRecordDto {
    return this.queueTransfer("refund", request);
  }

  markTransferPaid(request: FinalizeEscrowTransferRequest): EscrowTransferQueueRecordDto {
    if (this.processedEscrowEvents.has(request.eventId) || this.processedTxHashes.has(request.txHash)) {
      const transfer = this.transferById.get(request.transferId);
      if (!transfer) {
        throw new NotFoundException({ code: "ESCROW_TRANSFER_NOT_FOUND", message: "Escrow transfer was not found." });
      }
      return transfer;
    }

    const transfer = this.requireTransfer(request.transferId);
    if (transfer.state === "paid") return transfer;
    if (transfer.state === "failed") {
      throw new BadRequestException({ code: "ESCROW_TRANSFER_FAILED", message: "Failed transfer cannot be marked paid without re-queueing." });
    }

    transfer.state = "paid";
    transfer.settledAt = new Date().toISOString();
    transfer.failureReason = null;

    const playerBalance = this.ensurePlayerBalance(transfer.roomId, transfer.playerId);
    playerBalance.withdrawableBalance = roundMoney(playerBalance.withdrawableBalance - transfer.amount);

    this.appendLedgerEntry({
      roomId: transfer.roomId,
      playerId: transfer.playerId,
      entryType: transfer.transferType,
      referenceType: transfer.transferType,
      referenceId: transfer.referenceId,
      amountDelta: roundMoney(-transfer.amount),
      status: "confirmed",
      chainTxHash: request.txHash,
      chainBlockNumber: request.blockNumber,
      metadata: { transferId: transfer.id, eventId: request.eventId },
    });

    this.processedEscrowEvents.add(request.eventId);
    this.processedTxHashes.add(request.txHash);
    return transfer;
  }

  markTransferFailed(request: FailEscrowTransferRequest): EscrowTransferQueueRecordDto {
    const transfer = this.requireTransfer(request.transferId);
    if (transfer.state === "paid") {
      throw new BadRequestException({ code: "ESCROW_TRANSFER_ALREADY_PAID", message: "Paid transfer cannot be failed." });
    }
    transfer.state = "failed";
    transfer.failureReason = request.reason.trim() || "Unknown failure";
    transfer.settledAt = null;

    this.appendLedgerEntry({
      roomId: transfer.roomId,
      playerId: transfer.playerId,
      entryType: transfer.transferType,
      referenceType: "replay",
      referenceId: `${transfer.referenceId}:failure:${Date.now()}`,
      amountDelta: 0,
      status: "failed",
      metadata: { transferId: transfer.id, reason: transfer.failureReason },
    });

    return transfer;
  }

  listTransfers(roomId: string): EscrowTransferQueueRecordDto[] {
    return Array.from(this.transferById.values()).filter((transfer) => transfer.roomId === roomId);
  }

  listLedger(roomId: string): EscrowLedgerEntryDto[] {
    return this.ledgerByRoom.get(roomId)?.slice() ?? [];
  }

  listBalances(roomId: string): EscrowPlayerLedgerBalanceDto[] {
    return Array.from(this.ensureRoomBalances(roomId).values()).sort((a, b) => a.playerId.localeCompare(b.playerId));
  }

  reconcileRoomCloseout(request: RoomCloseoutReconciliationRequest): RoomCloseoutReconciliationResultDto {
    const balances = this.listBalances(request.roomId);
    const mismatches = balances
      .map((balance) => {
        const onchain = roundMoney(request.onchainBalanceByPlayer[balance.playerId] ?? 0);
        const delta = roundMoney(onchain - balance.withdrawableBalance);
        return {
          playerId: balance.playerId,
          offchainWithdrawable: balance.withdrawableBalance,
          onchainBalance: onchain,
          delta,
        };
      })
      .filter((entry) => !isZero(entry.delta));

    return {
      roomId: request.roomId,
      reconciled: mismatches.length === 0,
      mismatches,
    };
  }

  private queueTransfer(type: TransferType, request: QueueEscrowTransferRequest): EscrowTransferQueueRecordDto {
    const knownTransferId = this.transferIdByIdempotencyKey.get(request.idempotencyKey);
    if (knownTransferId) {
      return this.requireTransfer(knownTransferId);
    }

    if (request.amount <= 0) {
      throw new BadRequestException({ code: "ESCROW_TRANSFER_AMOUNT_INVALID", message: "Transfer amount must be greater than zero." });
    }

    const playerBalance = this.ensurePlayerBalance(request.roomId, request.playerId);
    if (playerBalance.withdrawableBalance < request.amount) {
      throw new BadRequestException({ code: "ESCROW_TRANSFER_BALANCE_LOW", message: "Withdrawable balance is too low for this transfer." });
    }

    const transfer: EscrowTransferQueueRecordDto = {
      id: randomUUID(),
      roomId: request.roomId,
      playerId: request.playerId,
      amount: roundMoney(request.amount),
      transferType: type,
      state: "queued",
      idempotencyKey: request.idempotencyKey,
      referenceId: `${type}:${request.roomId}:${request.playerId}:${request.idempotencyKey}`,
      destinationAddress: request.payoutAddress ?? request.refundAddress ?? "0xoperator-routing",
      failureReason: null,
      queuedAt: new Date().toISOString(),
      settledAt: null,
    };

    this.transferById.set(transfer.id, transfer);
    this.transferIdByIdempotencyKey.set(request.idempotencyKey, transfer.id);

    this.appendLedgerEntry({
      roomId: request.roomId,
      playerId: request.playerId,
      entryType: type,
      referenceType: type,
      referenceId: transfer.referenceId,
      amountDelta: 0,
      status: "pending",
      metadata: { transferId: transfer.id, state: "queued" satisfies TransferState },
    });

    return transfer;
  }

  private ensureRoomBalances(roomId: string): Map<string, EscrowPlayerLedgerBalanceDto> {
    let roomBalances = this.balancesByRoom.get(roomId);
    if (!roomBalances) {
      roomBalances = new Map<string, EscrowPlayerLedgerBalanceDto>();
      this.balancesByRoom.set(roomId, roomBalances);
    }
    return roomBalances;
  }

  private ensurePlayerBalance(roomId: string, playerId: string): EscrowPlayerLedgerBalanceDto {
    const roomBalances = this.ensureRoomBalances(roomId);
    let playerBalance = roomBalances.get(playerId);
    if (!playerBalance) {
      playerBalance = {
        roomId,
        playerId,
        startingBalance: 0,
        inPlayAllocation: 0,
        settlementDelta: 0,
        withdrawableBalance: 0,
      };
      roomBalances.set(playerId, playerBalance);
    }
    return playerBalance;
  }

  private appendLedgerEntry(input: {
    roomId: string;
    playerId: string;
    entryType: EscrowLedgerEntryDto["entryType"];
    referenceType: EscrowLedgerEntryDto["referenceType"];
    referenceId: string;
    amountDelta: number;
    status: EscrowLedgerEntryDto["status"];
    chainTxHash?: string;
    chainBlockNumber?: number;
    metadata: Record<string, unknown>;
  }): EscrowLedgerEntryDto {
    const roomLedger = this.ledgerByRoom.get(input.roomId) ?? [];
    const liabilityBefore = roomLedger.length ? roomLedger[roomLedger.length - 1].roomLiabilityAfter : 0;
    const roomLiabilityAfter = roundMoney(liabilityBefore + input.amountDelta);

    const entry: EscrowLedgerEntryDto = {
      id: randomUUID(),
      roomId: input.roomId,
      playerId: input.playerId,
      entryType: input.entryType,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      amountDelta: roundMoney(input.amountDelta),
      roomLiabilityAfter,
      status: input.status,
      chainTxHash: input.chainTxHash ?? null,
      chainBlockNumber: input.chainBlockNumber ?? null,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };

    roomLedger.push(entry);
    this.ledgerByRoom.set(input.roomId, roomLedger);
    return entry;
  }

  private requireTransfer(transferId: string): EscrowTransferQueueRecordDto {
    const transfer = this.transferById.get(transferId);
    if (!transfer) {
      throw new NotFoundException({ code: "ESCROW_TRANSFER_NOT_FOUND", message: "Escrow transfer was not found." });
    }
    return transfer;
  }

  private findLedgerEntryById(entryId: string): EscrowLedgerEntryDto | undefined {
    for (const roomLedger of this.ledgerByRoom.values()) {
      const entry = roomLedger.find((candidate) => candidate.id === entryId);
      if (entry) return entry;
    }
    return undefined;
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function isZero(value: number): boolean {
  return Math.abs(value) < 1e-9;
}
