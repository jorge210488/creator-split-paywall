import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from "typeorm";

@Entity("processed_events")
@Index(["txHash", "logIndex"], { unique: true })
export class ProcessedEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tx_hash", length: 66 })
  @Index()
  txHash: string;

  @Column({ type: "int", name: "log_index" })
  logIndex: number;

  @Column({ type: "int", name: "block_number" })
  @Index()
  blockNumber: number;

  @Column({ name: "event_name", length: 100 })
  eventName: string;

  @Column({ type: "jsonb", nullable: true })
  eventData: any;

  @CreateDateColumn({ name: "processed_at" })
  processedAt: Date;
}
