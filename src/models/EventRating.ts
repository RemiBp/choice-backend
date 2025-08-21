import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import User from './User';
import Post from './Post';
import Event from './Event';

@Entity('EventRatings')
@Unique(['userId', 'eventId', 'criteria'])
export default class EventRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.eventRatings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  postId: number;

  @ManyToOne(() => Post, post => post.eventRatings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, event => event.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  criteria: string;

  @Column('decimal', { precision: 2, scale: 1 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
