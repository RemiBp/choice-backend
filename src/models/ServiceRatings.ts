import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import Post from "./Post";
import User from "./User";
import ProducerService from "./Services";

@Entity("ServiceRatings")
export default class ServiceRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @Column()
  userId: number;

  @Column()
  producerServiceId: number;

  @ManyToOne(() => Post, (post) => post.serviceRatings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "postId" })
  post: Post;

  @ManyToOne(() => User, (user) => user.serviceRatings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => ProducerService, (service) => service.ratings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "producerServiceId" })
  producerService: ProducerService;

  @Column("jsonb")
  ratings: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
