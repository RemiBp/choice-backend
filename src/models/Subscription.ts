import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { SubscriptionPlan } from "../enums/SubscriptionPlan.enum";
import { SubscriptionStatus } from "../enums/SubscriptionStatus.enum";
import { OwnerType } from "../enums/OwnerType.enum";
import Transaction from "./Transaction";

@Entity("subscriptions")
export default class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ownerId: number; // ID of user or producer

    @Column({ type: "enum", enum: OwnerType })
    ownerType: OwnerType; // 'user' | 'producer'

    @Column({ type: "enum", enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
    plan: SubscriptionPlan;

    @Column({ type: "enum", enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
    status: SubscriptionStatus;

    @Column({ type: "timestamp", nullable: true })
    startDate: Date | null;

    @Column({ type: "timestamp", nullable: true })
    endDate: Date | null;

    @Column({ default: false })
    autoRenew: boolean;

    @Column({ type: "varchar", length: 50, nullable: true })
    provider: string | null; // e.g. "GooglePlay", "AppStore", "Stripe"

    @Column({ type: "varchar", length: 255, nullable: true })
    providerSubscriptionId: string | null; // external subscription id or token

    @OneToMany(() => Transaction, (tx) => tx.subscription)
    transactions: Transaction[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
