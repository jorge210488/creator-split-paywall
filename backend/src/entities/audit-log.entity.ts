import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from "typeorm";

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  READ = "read",
}

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  @Index()
  entityType: string; // e.g., 'Subscription', 'Payment'

  @Column({ length: 100 })
  entityId: string;

  @Column({ type: "enum", enum: AuditAction })
  action: AuditAction;

  @Column({ length: 42, nullable: true })
  actorAddress: string;

  @Column({ type: "jsonb", nullable: true })
  changes: any;

  @Column({ length: 100, nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
