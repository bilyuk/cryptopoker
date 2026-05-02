import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type {
  FailEscrowTransferRequest,
  FinalizeEscrowTransferRequest,
  QueueEscrowTransferRequest,
  RegisterRoomSettlementDelegationRequest,
  RecordHandSettlementRequest,
  RevokeRoomSettlementDelegationRequest,
  RoomCloseoutReconciliationRequest,
  ValidateEscrowPayoutAuthorizationRequest,
} from "@cryptopoker/contracts";
import { EscrowService } from "./escrow.service.js";

@Controller("escrow")
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Get("/foundation")
  getEscrowFoundation() {
    return {
      escrow: this.escrowService.getFoundationPlan(),
    };
  }

  @Post("/settlements/hands")
  recordHandSettlement(@Body() body: RecordHandSettlementRequest) {
    return this.escrowService.recordHandSettlement(body);
  }

  @Post("/payouts/queue")
  queuePayout(@Body() body: QueueEscrowTransferRequest) {
    return { transfer: this.escrowService.queuePayout(body) };
  }

  @Post("/refunds/queue")
  queueRefund(@Body() body: QueueEscrowTransferRequest) {
    return { transfer: this.escrowService.queueRefund(body) };
  }

  @Post("/transfers/finalize")
  finalizeTransfer(@Body() body: FinalizeEscrowTransferRequest) {
    return { transfer: this.escrowService.markTransferPaid(body) };
  }

  @Post("/transfers/fail")
  failTransfer(@Body() body: FailEscrowTransferRequest) {
    return { transfer: this.escrowService.markTransferFailed(body) };
  }

  @Get("/:roomId/ledger")
  ledger(@Param("roomId") roomId: string) {
    return {
      ledger: this.escrowService.listLedger(roomId),
      balances: this.escrowService.listBalances(roomId),
      transfers: this.escrowService.listTransfers(roomId),
    };
  }

  @Post("/rooms/:roomId/reconcile-closeout")
  reconcileCloseout(@Param("roomId") roomId: string, @Body() body: Omit<RoomCloseoutReconciliationRequest, "roomId">) {
    return {
      reconciliation: this.escrowService.reconcileRoomCloseout({ roomId, onchainBalanceByPlayer: body.onchainBalanceByPlayer }),
    };
  }

  @Post("/rooms/:roomId/delegations/register")
  registerRoomSettlementDelegation(@Param("roomId") roomId: string, @Body() body: Omit<RegisterRoomSettlementDelegationRequest, "roomId">) {
    return {
      delegation: this.escrowService.registerRoomSettlementDelegation({ roomId, ...body }),
    };
  }

  @Post("/rooms/:roomId/delegations/revoke")
  revokeRoomSettlementDelegation(@Param("roomId") roomId: string, @Body() body: Omit<RevokeRoomSettlementDelegationRequest, "roomId">) {
    return {
      delegation: this.escrowService.revokeRoomSettlementDelegation({ roomId, ...body }),
    };
  }

  @Post("/payouts/authorize")
  authorizePayout(@Body() body: ValidateEscrowPayoutAuthorizationRequest) {
    return {
      authorization: this.escrowService.validatePayoutAuthorization(body),
    };
  }
}
