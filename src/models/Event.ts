import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import Producer from './Producer';
import { EventStatus } from '../enums/eventStatus.enum';
import { ServiceType } from '../enums/serviceType.enum';
import EventRating from './EventRating';
import Leisure from './Leisure';
import EventType from './EventTypes';
import Interest from './Interest';

@Entity('Events')
export default class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    date: string;

    @Column()
    startTime: string;

    @Column()
    endTime: string;

    @Column({ nullable: true })
    venueName: string

    @Column({ nullable: true })
    location: string;

    @Column("decimal", { precision: 9, scale: 6, nullable: true })
    latitude: number;

    @Column("decimal", { precision: 9, scale: 6, nullable: true })
    longitude: number;

    @Column({ type: 'enum', enum: ServiceType, nullable: true })
    serviceType: ServiceType;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    pricePerGuest: number;

    @Column({ nullable: true })
    maxCapacity: number;

    @Column('text', { array: true, nullable: true })
    eventImages: string[];

    @Column({ type: 'enum', enum: EventStatus, nullable: true })
    status: EventStatus;

    @Column({ nullable: true, unique: true })
    slug: string;

    @OneToMany(() => EventRating, rating => rating.event, { cascade: true })
    ratings: EventRating[];

    @ManyToOne(() => Leisure, leisure => leisure.events, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'leisureId' })
    leisure: Leisure;

    @Column({ nullable: true })
    leisureId: number;

    @ManyToOne(() => EventType, type => type.events, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'eventTypeId' })
    eventType: EventType;

    @Column({ nullable: true })
    eventTypeId: number;

    @ManyToOne(() => Producer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'producerId' })
    producer: Producer;

    @OneToMany(() => Interest, (interest) => interest.event)
    interests: Interest[];

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'NOW()', onUpdate: 'NOW()' })
    updatedAt: Date;
}
