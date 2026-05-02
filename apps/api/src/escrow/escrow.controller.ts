import { Controller, Get } from "@nestjs/common";
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
}
