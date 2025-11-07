import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export enum ConfigChangeType {
  PRICE_UPDATED = "price_updated",
  DURATION_UPDATED = "duration_updated",
}

@Entity("config_changes")
@Index(["changeType", "timestamp"])
export class ConfigChange {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ConfigChangeType,
  })
  changeType: ConfigChangeType;

  @Column({ type: "varchar", length: 255 })
  oldValue: string;

  @Column({ type: "varchar", length: 255 })
  newValue: string;

  @Column({ type: "varchar", length: 66 })
  @Index()
  txHash: string;

  @Column({ type: "int" })
  blockNumber: number;

  @Column({ type: "int" })
  logIndex: number;

  @CreateDateColumn()
  timestamp: Date;
}
