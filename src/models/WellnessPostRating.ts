import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import User from "./User";
import Post from "./Post";

@Entity('WellnessPostRatings')
@Index('IDX_WellnessPostRating_user_post', ['userId', 'postId'], { unique: true })
export default class WellnessPostRating {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    postId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Post;

    @Column('decimal', { precision: 2, scale: 1 })
    careQuality: number;

    @Column('decimal', { precision: 2, scale: 1 })
    cleanliness: number;

    @Column('decimal', { precision: 2, scale: 1 })
    welcome: number;

    @Column('decimal', { precision: 2, scale: 1 })
    valueForMoney: number;

    @Column('decimal', { precision: 2, scale: 1 })
    atmosphere: number;

    @Column('decimal', { precision: 2, scale: 1 })
    staffExperience: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
