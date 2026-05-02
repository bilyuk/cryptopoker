import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Schema proposal for durable escrow reconciliation across API and chain events.
@Entity({ name: "escrow_ledger_entries" })
@Index("idx_escrow_ledger_room_player", ["roomId", "playerId"])
@Index("idx_escrow_ledger_reference", ["referenceType", "referenceId"], { unique: true })
@Index("idx_escrow_ledger_chain_tx", ["chainTxHash"])
export class EscrowLedgerEntryEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 64 })
  roomId!: string;

  @Column({ type: "varchar", length: 64 })
  playerId!: string;

  @Column({ type: "varchar", length: 32 })
  entryType!: "funding" | "allocation" | "settlement" | "payout" | "refund" | "reconciliation";

  @Column({ type: "varchar", length: 32 })
  referenceType!: "funding-intent" | "deposit" | "hand" | "payout" | "refund" | "replay";

  @Column({ type: "varchar", length: 128 })
  referenceId!: string;

  @Column({ type: "numeric", precision: 18, scale: 6 })
  amountDelta!: string;

  @Column({ type: "numeric", precision: 18, scale: 6 })
  roomLiabilityAfter!: string;

  @Column({ type: "varchar", length: 16 })
  status!: "pending" | "confirmed" | "failed";

  @Column({ type: "varchar", length: 64, nullable: true })
  chainTxHash!: string | null;

  @Column({ type: "bigint", nullable: true })
  chainBlockNumber!: string | null;

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
