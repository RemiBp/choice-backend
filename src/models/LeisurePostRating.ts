import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import User from "./User";
import Post from "./Post";
import Leisure from "./Leisure";
import { nullable } from "zod";

@Entity('LeisurePostRatings')
@Index('IDX_LeisurePostRating_user_post', ['userId', 'postId'], { unique: true })
export default class LeisurePostRating {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    postId: number;

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Post;

    @Column({ nullable: true })
    leisureId: number;

    @ManyToOne(() => Leisure, { onDelete: "CASCADE" })
    @JoinColumn({ name: "leisureId" })
    leisure: Leisure;

    @Column('decimal', { precision: 2, scale: 1 })
    stageDirection: number;

    @Column('decimal', { precision: 2, scale: 1 })
    actorPerformance: number;

    @Column('decimal', { precision: 2, scale: 1 })
    textQuality: number;

    @Column('decimal', { precision: 2, scale: 1 })
    scenography: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
