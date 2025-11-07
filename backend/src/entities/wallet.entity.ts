import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Subscription } from "./subscription.entity";
import { Payment } from "./payment.entity";

@Entity("wallets")
export class Wallet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 42 })
  @Index()
  address: string; // Lowercase normalized address

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.wallet)
  subscriptions: Subscription[];

  @OneToMany(() => Payment, (payment) => payment.wallet)
  payments: Payment[];
}
