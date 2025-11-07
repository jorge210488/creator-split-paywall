import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from "typeorm";

@Entity("payouts")
@Index(["payeeAddress", "timestamp"])
export class Payout {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 42 })
  @Index()
  payeeAddress: string;

  @Column({ type: "decimal", precision: 78, scale: 0 })
  amount: string; // Wei amount as string

  @Column({ name: "tx_hash", length: 66 })
  @Index()
  txHash: string;

  @Column({ type: "int", name: "block_number" })
  blockNumber: number;

  @Column({ type: "int", name: "log_index" })
  logIndex: number;

  @Column({ type: "timestamp" })
  timestamp: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
