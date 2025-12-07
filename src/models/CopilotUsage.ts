import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import User from "./User";


@Entity("copilot_usage")
export default class CopilotUsage {
    @PrimaryGeneratedColumn()
    id!: number;

    // Relation to the User who used the Copilot
    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;

    // Total queries made (all-time)
    @Column({ type: "int", default: 0 })
    totalQueries!: number;

    // Queries made in the current month
    @Column({ type: "int", default: 0 })
    monthlyQueries!: number;

    // When monthly usage was last reset
    @Column({ type: "timestamp", nullable: true })
    lastResetAt!: Date | null;

    // Audit timestamps
    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
