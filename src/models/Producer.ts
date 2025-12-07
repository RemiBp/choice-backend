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
    Point,
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
import MenuCategory from './MenuCategory';
import ProducerDocument from './ProducerDocument';
import ProducerOffer from './ProducerOffer';
import CuisineType from './CuisineType';
import Interest from './Interest';

@Entity('Producers')
export default class Producer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    userId: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    companyEmail?: string;

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

    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    @Index({ spatial: true })
    locationPoint: Point;

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
    totalSeats: number;

    @Column({ nullable: true })
    noOfTables: number;

    @Column({ nullable: true })
    maxPartySize: number;

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

    @OneToMany(() => ProducerDocument, (doc) => doc.producer)
    documents: ProducerDocument[];

    @OneToMany(() => Photo, photo => photo.producer)
    photos: Photo[];

    @OneToMany(() => MenuCategory, MenuCategory => MenuCategory.producer)
    menuCategory: MenuCategory[];

    @OneToOne(() => AIAnalysis, analysis => analysis.producer)
    aiAnalysis: AIAnalysis;

    @OneToOne(() => GlobalRating, rating => rating.producer)
    globalRating: GlobalRating;

    @OneToOne(() => OpeningHours, hours => hours.producer)
    openingHours: OpeningHours;

    @OneToMany(() => Event, event => event.producer)
    events: Event[];

    @OneToMany(() => ProducerOffer, offer => offer.producer)
    offers: ProducerOffer[];

    @OneToMany(() => Interest, (interest) => interest.producer)
    interests: Interest[];

    // Social Module Relations
    @OneToMany(() => Post, post => post.producer, { cascade: true })
    posts: Post[];

    @OneToMany(() => Follow, (follow) => follow.producer, { cascade: true })
    followers: Follow[];

    @ManyToOne(() => CuisineType, cuisineType => cuisineType.producer)
    cuisineType: CuisineType;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    slotDuration: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
