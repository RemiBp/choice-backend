import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from "typeorm";
import User from "./User";

@Entity("Blocks")
export default class Block {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.blockedUsers)
    @JoinColumn({ name: "blockerId" })
    blocker: User;

    @Column()
    blockerId: number;

    @ManyToOne(() => User, (user) => user.blockedBy)
    @JoinColumn({ name: "blockedUserId" })
    blockedUser: User;

    @Column()
    blockedUserId: number;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date;
}
