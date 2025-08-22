import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import Producer from "./Producer";

@Entity('RestaurantRatings')
@Index('IDX_RestaurantRating_producerId', ['producerId'], { unique: true })
export default class RestaurantRating {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    producerId: number;

    @ManyToOne(() => Producer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'producerId' })
    producer: Producer;

    // ---- Human Ratings ----
    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    service: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    place: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    portions: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ambiance: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    overall: number; // average of all criteria

    // ---- AI Ratings ----
    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_service: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_place: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_portions: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_ambiance: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_overall: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
