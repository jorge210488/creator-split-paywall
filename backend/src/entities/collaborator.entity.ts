import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("collaborators")
export class Collaborator {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 42 })
  walletAddress: string;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ type: "int" })
  shares: number; // From PaymentSplitter

  @Column({ type: "boolean", default: true })
  active: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
