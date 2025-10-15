import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import User from "./User";
import Post from "./Post";
import PostComment from "./PostComment";
import { ReportStatus, ReportReason } from "../enums/report.enum";

@Entity("Reports")
export default class Report {
  @PrimaryGeneratedColumn()
  id: number;


  @ManyToOne(() => User, (user) => user.reportsMade, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reporterId" })
  reporter: User;

  @Column()
  reporterId: number;

  @ManyToOne(() => User, (user) => user.reportsReceived, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "reportedUserId" })
  reportedUser?: User;

  @Column({ nullable: true })
  reportedUserId?: number;

  @ManyToOne(() => Post, (post) => post.reports, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "reportedPostId" })
  reportedPost?: Post;

  @Column({ nullable: true })
  reportedPostId?: number;

  @ManyToOne(() => PostComment, (comment) => comment.reports, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "reportedCommentId" })
  reportedComment?: PostComment;

  @Column({ nullable: true })
  reportedCommentId?: number;

  @Column({
    type: "enum",
    enum: ReportReason,
  })
  reason: ReportReason;

  @Column({ type: "text", nullable: true })
  details?: string;

  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
