import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type EscrowDelegationDomainDto,
  type EscrowLedgerEntryDto,
  type EscrowPlayerLedgerBalanceDto,
  type EscrowTransferQueueRecordDto,
  type FailEscrowTransferRequest,
  type FinalizeEscrowTransferRequest,
  type QueueEscrowTransferRequest,
  type RegisterRoomSettlementDelegationRequest,
  type RecordHandSettlementRequest,
  type RevokeRoomSettlementDelegationRequest,
  type RoomSettlementDelegationRecordDto,
  type RoomCloseoutReconciliationRequest,
  type RoomCloseoutReconciliationResultDto,
  type ValidateEscrowPayoutAuthorizationRequest,
} from "@cryptopoker/contracts";
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
  private readonly roomDelegationByRoom = new Map<string, RoomSettlementDelegationRecordDto>();

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

  registerRoomSettlementDelegation(request: RegisterRoomSettlementDelegationRequest): RoomSettlementDelegationRecordDto {
    const hostWalletAddress = normalizeWalletAddress(request.hostWalletAddress);
    const signerWalletAddress = normalizeWalletAddress(request.signerWalletAddress);
    const delegateWalletAddress = normalizeWalletAddress(request.delegateWalletAddress);
    const contractAddress = normalizeWalletAddress(request.contractAddress);
    const ttlHours = request.ttlHours ?? 24;

    if (ttlHours <= 0) {
      throw new BadRequestException({ code: "DELEGATION_TTL_INVALID", message: "Delegation TTL must be greater than zero hours." });
    }
    if (hostWalletAddress !== signerWalletAddress) {
      throw new BadRequestException({ code: "DELEGATION_SIGNER_INVALID", message: "Delegation must be signed by the Room Host wallet." });
    }
    this.assertDelegationDomain(request.signatureDomain, request.chainId, contractAddress);

    const now = request.issuedAt ? new Date(request.issuedAt) : new Date();
    if (Number.isNaN(now.getTime())) {
      throw new BadRequestException({ code: "DELEGATION_ISSUED_AT_INVALID", message: "Delegation issuedAt must be a valid ISO datetime." });
    }

    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException({ code: "DELEGATION_EXPIRED", message: "Delegation expiry must be in the future." });
    }

    const record: RoomSettlementDelegationRecordDto = {
      roomId: request.roomId,
      hostWalletAddress,
      delegateWalletAddress,
      contractAddress,
      chainId: request.chainId,
      signerWalletAddress,
      signatureDomain: request.signatureDomain,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revokedAt: null,
      revokeReason: null,
    };
    this.roomDelegationByRoom.set(request.roomId, record);
    return { ...record };
  }

  revokeRoomSettlementDelegation(request: RevokeRoomSettlementDelegationRequest): RoomSettlementDelegationRecordDto {
    const current = this.roomDelegationByRoom.get(request.roomId);
    if (!current) {
      throw new NotFoundException({ code: "DELEGATION_NOT_FOUND", message: "No active Room Settlement Key delegation exists for this Room." });
    }

    const hostWalletAddress = normalizeWalletAddress(request.hostWalletAddress);
    const signerWalletAddress = normalizeWalletAddress(request.signerWalletAddress);
    if (current.hostWalletAddress !== hostWalletAddress || current.hostWalletAddress !== signerWalletAddress) {
      throw new BadRequestException({ code: "DELEGATION_REVOKE_SIGNER_INVALID", message: "Only the Room Host can revoke the delegation." });
    }

    const revokedAt = request.revokedAt ? new Date(request.revokedAt) : new Date();
    if (Number.isNaN(revokedAt.getTime())) {
      throw new BadRequestException({ code: "DELEGATION_REVOKED_AT_INVALID", message: "Delegation revokedAt must be a valid ISO datetime." });
    }

    const updated: RoomSettlementDelegationRecordDto = {
      ...current,
      revokedAt: revokedAt.toISOString(),
      revokeReason: request.reason?.trim() || "Host revoked delegation",
    };
    this.roomDelegationByRoom.set(request.roomId, updated);
    return { ...updated };
  }

  validatePayoutAuthorization(request: ValidateEscrowPayoutAuthorizationRequest): {
    roomId: string;
    authorized: boolean;
    authorizedBy: "host" | "delegate";
  } {
    if (request.amount <= 0) {
      throw new BadRequestException({ code: "PAYOUT_AMOUNT_INVALID", message: "Payout authorization amount must be greater than zero." });
    }
    if (!request.nonce.trim()) {
      throw new BadRequestException({ code: "PAYOUT_NONCE_REQUIRED", message: "Payout authorization nonce is required." });
    }

    const signerWalletAddress = normalizeWalletAddress(request.signerWalletAddress);
    const roomDelegation = this.roomDelegationByRoom.get(request.roomId);
    if (!roomDelegation) {
      throw new BadRequestException({ code: "DELEGATION_NOT_FOUND", message: "No Room Settlement Key delegation exists for this Room." });
    }
    if (signerWalletAddress === roomDelegation.hostWalletAddress) {
      return { roomId: request.roomId, authorized: true, authorizedBy: "host" };
    }

    const isExpired = new Date(roomDelegation.expiresAt).getTime() <= Date.now();
    if (isExpired || roomDelegation.revokedAt) {
      throw new BadRequestException({ code: "DELEGATION_INACTIVE", message: "Room Settlement Key delegation is expired or revoked." });
    }

    const contractAddress = normalizeWalletAddress(request.contractAddress);
    if (roomDelegation.chainId !== request.chainId || roomDelegation.contractAddress !== contractAddress) {
      throw new BadRequestException({ code: "DELEGATION_SCOPE_MISMATCH", message: "Delegation is not valid for this contract or chain." });
    }
    if (signerWalletAddress !== roomDelegation.delegateWalletAddress) {
      throw new BadRequestException({ code: "DELEGATION_SIGNER_INVALID", message: "Payout signer is not the active Room Settlement Key delegate." });
    }

    return { roomId: request.roomId, authorized: true, authorizedBy: "delegate" };
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

  private assertDelegationDomain(domain: EscrowDelegationDomainDto, chainId: number, contractAddress: string): void {
    if (domain.name !== "CryptopokerEscrow" || domain.version !== "1") {
      throw new BadRequestException({ code: "DELEGATION_DOMAIN_INVALID", message: "Delegation EIP-712 domain name/version is invalid." });
    }
    if (domain.chainId !== chainId) {
      throw new BadRequestException({ code: "DELEGATION_DOMAIN_CHAIN_MISMATCH", message: "Delegation EIP-712 domain chainId does not match." });
    }
    if (normalizeWalletAddress(domain.verifyingContract) !== contractAddress) {
      throw new BadRequestException({ code: "DELEGATION_DOMAIN_CONTRACT_MISMATCH", message: "Delegation EIP-712 verifyingContract does not match." });
    }
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function isZero(value: number): boolean {
  return Math.abs(value) < 1e-9;
}

function normalizeWalletAddress(walletAddress: string): string {
  return walletAddress.trim().toLowerCase();
}
