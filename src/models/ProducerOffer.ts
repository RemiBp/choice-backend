import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import Producer from './Producer';
import { OfferStatus } from '../enums/offer.enum';
import { DayOfWeekEnum, TimeOfDayEnum } from '../enums/OfferEnums';

@Entity('ProducerOffer')
export default class ProducerOffer {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Producer, producer => producer.offers, { onDelete: "CASCADE" })
    @JoinColumn({ name: "producerId" })
    producer: Producer;

    @Column()
    producerId: number;

    @Column()
    title: string;

    @Column()
    message: string;

    @Column({ type: 'int', nullable: true })
    discountPercent: number;

    @Column({ type: 'int', nullable: true })
    validityMinutes: number;

    @Column({ type: 'int', nullable: true })
    maxRecipients: number;

    @Column({ type: 'int', nullable: true })
    radiusMeters: number;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({
        type: "enum",
        enum: TimeOfDayEnum,
        default: TimeOfDayEnum.ALL_DAY,
    })
    timeOfDay: TimeOfDayEnum;

    @Column({
        type: "enum",
        enum: DayOfWeekEnum,
        array: true,
        default: [DayOfWeekEnum.EVERYDAY],
    })
    daysOfWeek: DayOfWeekEnum[];

    @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.DRAFT })
    status: OfferStatus;

    @Column({ type: 'boolean', default: false })
    isTemplate: boolean;

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt: Date;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'NOW()', onUpdate: 'NOW()' })
    updatedAt: Date;
}
