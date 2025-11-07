import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Wallet } from "./wallet.entity";

@Entity("payments")
@Index(["txHash", "logIndex"], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.payments, { eager: true })
  @JoinColumn({ name: "wallet_id" })
  wallet: Wallet;

  @Column({ type: "decimal", precision: 78, scale: 0 })
  amount: string; // Wei amount as string

  @Column({ name: "tx_hash", length: 66 })
  @Index()
  txHash: string;

  @Column({ type: "int", name: "block_number" })
  @Index()
  blockNumber: number;

  @Column({ type: "int", name: "log_index" })
  logIndex: number;

  @Column({ type: "timestamp", name: "timestamp" })
  timestamp: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
