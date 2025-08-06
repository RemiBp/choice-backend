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
import { FollowStatusEnums } from '../enums/followStatus.enum';

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

  @Column({
    type: 'enum',
    enum: FollowStatusEnums,
    default: FollowStatusEnums.Pending,
  })
  status: FollowStatusEnums;

  @CreateDateColumn()
  createdAt: Date;
}