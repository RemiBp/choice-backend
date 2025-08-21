import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import User from "./User";
import Post from "./Post";

@Entity('RestaurantPostRatings')
@Index('IDX_RestaurantPostRating_user_post', ['userId', 'postId'], { unique: true })
export default class RestaurantPostRating {
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
    service: number;

    @Column('decimal', { precision: 2, scale: 1 })
    place: number;

    @Column('decimal', { precision: 2, scale: 1 })
    portions: number;

    @Column('decimal', { precision: 2, scale: 1 })
    ambiance: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
