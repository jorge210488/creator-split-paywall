import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export enum WebhookStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  RETRYING = "retrying",
}

@Entity("webhook_deliveries")
export class WebhookDelivery {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 500 })
  url: string;

  @Column({ type: "text" })
  payload: string;

  @Column({ type: "enum", enum: WebhookStatus, default: WebhookStatus.PENDING })
  status: WebhookStatus;

  @Column({ type: "int", default: 0 })
  attempts: number;

  @Column({ type: "text", nullable: true })
  lastError: string;

  @Column({ type: "int", nullable: true })
  responseStatus: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ type: "timestamp", name: "delivered_at", nullable: true })
  deliveredAt: Date | null;
}
