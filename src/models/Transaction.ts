import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from "typeorm";
import Subscription from "./Subscription";
import { SubscriptionPlan } from "../enums/SubscriptionPlan.enum";
import { TransactionStatus, TransactionType } from "../enums/Transaction.enums";

@Entity("transactions")
export default class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Subscription, (sub) => sub.transactions, { onDelete: "CASCADE" })
    subscription: Subscription;

    @Column({ type: "enum", enum: TransactionType })
    type: TransactionType;

    @Column({ type: "enum", enum: TransactionStatus })
    status: TransactionStatus;

    @Column({ type: "enum", enum: SubscriptionPlan })
    plan: SubscriptionPlan;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    currency: string;

    @Column({ nullable: true })
    providerTransactionId: string;

    @Column({ nullable: true })
    message: string;

    @CreateDateColumn()
    createdAt: Date;
}
