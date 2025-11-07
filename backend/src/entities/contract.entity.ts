import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("contracts")
export class Contract {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 42 })
  @Index()
  address: string;

  @Column({ length: 50 })
  network: string; // e.g., 'sepolia', 'mainnet'

  @Column({ type: "int", name: "start_block", nullable: true })
  startBlock: number | null;

  @Column({ type: "int", name: "last_processed_block", default: 0 })
  lastProcessedBlock: number;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
