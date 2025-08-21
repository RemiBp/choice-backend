import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
    OneToOne,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import Photo from './Photos';
import AIAnalysis from './AIAnalysis';
import GlobalRating from './GlobalRating';
import OpeningHours from './OpeningHours';
import User from './User';
import { BusinessRole } from '../enums/Producer.enum';
import { ProducerStatus } from '../enums/producerStatus.enum';
import Event from './Event';
import Post from './Post';
import Follow from './Follow';

@Entity('Producers')
export default class Producer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    userId: number;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    details: string;

    @Column({ nullable: true })
    mapsUrl: string;

    @Column({ unique: true })
    @Index()
    placeId: string;

    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    longitude: number;

    @Column('jsonb', { nullable: true })
    rating: {
        average: number;
        count: number;
    };

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    website: string;

    @Column({ nullable: true })
    totalCapacity: number;

    @Column({
        type: 'enum',
        enum: BusinessRole,
    })
    type: BusinessRole;

    @Column({
        type: 'enum',
        enum: ProducerStatus,
        default: ProducerStatus.PENDING,
    })
    status: ProducerStatus;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ nullable: true })
    document1: string;

    @Column({ nullable: true })
    document2: string;

    @Column({ type: 'date', nullable: true })
    document1Expiry: Date;

    @Column({ type: 'date', nullable: true })
    document2Expiry: Date;

    @OneToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => Photo, photo => photo.producer)
    photos: Photo[];

    @OneToOne(() => AIAnalysis, analysis => analysis.producer)
    aiAnalysis: AIAnalysis;

    @OneToOne(() => GlobalRating, rating => rating.producer)
    globalRating: GlobalRating;

    @OneToOne(() => OpeningHours, hours => hours.producer)
    openingHours: OpeningHours;

    @OneToMany(() => Event, event => event.producer)
    events: Event[];

    // Social Module Relations
    @OneToMany(() => Post, post => post.producer, { cascade: true })
    posts: Post[];

    @OneToMany(() => Follow, (follow) => follow.producer, { cascade: true })
    followers: Follow[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
