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
import WellnessServiceType from "./WellnessServiceTypes";
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
  serviceTypeId: number;

  @ManyToOne(() => Post, (post) => post.serviceRatings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "postId" })
  post: Post;

  @ManyToOne(() => User, (user) => user.serviceRatings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => WellnessServiceType, (serviceType) => serviceType.ratings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "serviceTypeId" })
  serviceType: WellnessServiceType;

  // --- Actual rating values ---
  @Column("jsonb")
  ratings: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
