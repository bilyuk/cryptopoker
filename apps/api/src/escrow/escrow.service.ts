import { Injectable } from "@nestjs/common";
import { ESCROW_FOUNDATION_PLAN, type EscrowFoundationPlan } from "./escrow.types.js";

@Injectable()
export class EscrowService {
  getFoundationPlan(): EscrowFoundationPlan {
    return ESCROW_FOUNDATION_PLAN;
  }
}
