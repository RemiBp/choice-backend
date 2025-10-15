import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from "typeorm";
import User from "./User";
import Producer from "./Producer";
import Event from "./Event";
import InterestInvite from "./InterestInvite";
import { InterestStatus, InterestType } from "../enums/interestStatus.enum";

@Entity("Interest")
export default class Interest {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.interests, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column()
    userId: number;

    @ManyToOne(() => Producer, (producer) => producer.interests, {
        onDelete: "CASCADE",
        nullable: true,
    })
    @JoinColumn({ name: "producerId" })
    producer?: Producer;

    @Column({ nullable: true })
    producerId?: number;

    @ManyToOne(() => Event, (event) => event.interests, {
        onDelete: "CASCADE",
        nullable: true,
    })
    @JoinColumn({ name: "eventId" })
    event?: Event;

    @Column({ nullable: true })
    eventId?: number;

    @Column({ type: "timestamptz", nullable: true })
    suggestedTime?: Date;

    @Column({ type: "text", nullable: true })
    message?: string;

    @Column({
        type: "enum",
        enum: InterestType,
    })
    type: InterestType;

    @Column({
        type: "enum",
        enum: InterestStatus,
        default: InterestStatus.PENDING,
    })
    status: InterestStatus;

    @OneToMany(() => InterestInvite, (invite) => invite.interest)
    invites: InterestInvite[];

    @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
    createdAt: Date;

    @UpdateDateColumn({
        type: "timestamptz",
        default: () => "NOW()",
        onUpdate: "NOW()",
    })
    updatedAt: Date;
}
