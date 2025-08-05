import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import User from './User';
import Producer from './Producer';

@Entity('Follows')
export default class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @Column()
  followerId: number;

  @ManyToOne(() => Producer, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producerId' })
  producer: Producer;

  @Column({ nullable: true })
  producerId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followedUserId' })
  followedUser: User;

  @Column({ nullable: true })
  followedUserId: number;

  @CreateDateColumn()
  createdAt: Date;
}