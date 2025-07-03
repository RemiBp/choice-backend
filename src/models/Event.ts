import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import Producer from './Producer';

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
    location: string;

    @Column({ nullable: true })
    experienceType: string;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    pricePerGuest: number;

    @Column({ nullable: true })
    maxCapacity: number;

    @Column('text', { array: true, nullable: true })
    eventImages: string[];

    @ManyToOne(() => Producer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'producerId' })
    producer: Producer;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'NOW()', onUpdate: 'NOW()' })
    updatedAt: Date;
}
