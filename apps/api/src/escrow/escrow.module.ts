import { Module } from "@nestjs/common";
import { LobbyModule } from "../lobby/lobby.module.js";
import { EscrowController } from "./escrow.controller.js";
import { EscrowService } from "./escrow.service.js";

@Module({
  imports: [LobbyModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
