import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import Producer from "./Producer";
import ProducerService from "./Services";

@Entity('Wellness')
@Index('IDX_Wellness_producerId', ['producerId'], { unique: true })
export default class Wellness {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    producerId: number;

    @ManyToOne(() => Producer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'producerId' })
    producer: Producer;

    // ---- Human Ratings ----
    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    careQuality: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    cleanliness: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    welcome: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    valueForMoney: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    atmosphere: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    staffExperience: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    overall: number;

    // ---- AI Ratings ----
    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_careQuality: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_cleanliness: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_welcome: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_valueForMoney: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_atmosphere: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_staffExperience: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_overall: number;

    @OneToMany(() => ProducerService, service => service.wellness, { cascade: true })
    services: ProducerService[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
