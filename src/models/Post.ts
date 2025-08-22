import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import User from './User';
import Producer from './Producer';
import { PostType, PostStatus } from '../enums/post.enum';
import ServiceRating from './ServiceRatings';
import EventRating from './EventRating';

@Entity('Posts')
export default class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: PostType,
    })
    type: PostType;

    @Column({
        type: 'enum',
        enum: PostStatus,
        default: PostStatus.DRAFT,
    })
    status: PostStatus;

    @Column({ type: 'timestamptz', nullable: true })
    publishDate: Date;

    @Column('text')
    description: string;

    @Column({ nullable: true })
    coverImage: string;

    @Column({ nullable: true })
    link: string;

    @Column({ default: 0 })
    likesCount: number;

    @Column({ default: 0 })
    shareCount: number;

    @Column({ default: 0 })
    commentCount: number;

    @Column('decimal', { precision: 3, scale: 2, nullable: true })
    overallAvgRating: number;

    @Column({ nullable: true })
    userId: number;

    @Column({ nullable: true })
    producerId: number;

    @OneToMany(() => ServiceRating, rating => rating.post)
    serviceRatings: ServiceRating[];

    @OneToMany(() => EventRating, rating => rating.post)
    eventRatings: EventRating[];

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Producer, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'producerId' })
    producer: Producer;

    @OneToMany('PostLike', 'post', { cascade: true })
    likes: any[];

    @OneToMany('PostComment', 'post', { cascade: true })
    comments: any[];

    @OneToMany('PostShare', 'post', { cascade: true })
    shares: any[];

    @OneToMany('PostTag', 'post', { cascade: true })
    postTags: any[];

    @OneToMany('PostEmotion', 'post', { cascade: true })
    emotions: any[];

    @OneToMany('PostRating', 'post', { cascade: true })
    ratings: any[];

    @OneToMany('PostImage', 'post', { cascade: true })
    images: any[];

    @OneToOne('PostStatistics', 'post', { cascade: true })
    statistics: any;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamptz', nullable: true })
    deletedAt: Date;

    @Index()
    @Column({ default: false })
    isDeleted: boolean;
}
