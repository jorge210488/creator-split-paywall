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

@Entity("subscriptions")
@Index(["wallet", "activatedAt"])
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.subscriptions, { eager: true })
  @JoinColumn({ name: "wallet_id" })
  wallet: Wallet;

  @Column({ type: "bigint", name: "expiry_timestamp" })
  expiryTimestamp: string; // Unix timestamp in seconds

  @Column({ type: "timestamp", name: "activated_at" })
  @Index()
  activatedAt: Date;

  @Column({ type: "decimal", precision: 78, scale: 0 })
  amountPaid: string; // Wei amount as string

  @Column({ name: "tx_hash", length: 66 })
  @Index()
  txHash: string;

  @Column({ type: "int", name: "block_number" })
  blockNumber: number;

  @Column({ type: "int", name: "log_index" })
  logIndex: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
