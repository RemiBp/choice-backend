import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import Producer from "./Producer";
import Event from "./Event";

@Entity('Leisure')
@Index('IDX_Leisure_producerId', ['producerId'], { unique: true })
export default class Leisure {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    producerId: number;

    @ManyToOne(() => Producer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'producerId' })
    producer: Producer;

    // ---- Human Ratings ----
    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    stageDirection: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    actorPerformance: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    textQuality: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    scenography: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    overall: number;

    // ---- AI Ratings ----
    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_stageDirection: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_actorPerformance: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_textQuality: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_scenography: number;

    @Column('decimal', { precision: 2, scale: 1, default: 0.0 })
    ai_overall: number;

    @OneToMany(() => Event, event => event.leisure)
    events: Event[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
