import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from "typeorm";

export enum AnomalyType {
  SUSPICIOUS_PATTERN = "suspicious_pattern",
  UNUSUAL_VOLUME = "unusual_volume",
  RAPID_SUBSCRIPTION = "rapid_subscription",
  OTHER = "other",
}

export enum AnomalySeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

@Entity("anomalies")
export class Anomaly {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: AnomalyType })
  type: AnomalyType;

  @Column({
    type: "enum",
    enum: AnomalySeverity,
    default: AnomalySeverity.MEDIUM,
  })
  severity: AnomalySeverity;

  @Column({ length: 42, nullable: true })
  @Index()
  walletAddress: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: any;

  @Column({ type: "boolean", default: false })
  resolved: boolean;

  @CreateDateColumn({ name: "detected_at" })
  detectedAt: Date;

  @Column({ type: "timestamp", name: "resolved_at", nullable: true })
  resolvedAt: Date | null;
}
