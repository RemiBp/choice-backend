import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import User from "./User";
import Interest from "./Interest";

export enum InviteStatus {
  PENDING = "Pending",
  ACCEPTED = "Accepted",
  DECLINED = "Declined",
}

@Entity("InterestInvite")
export default class InterestInvite {
  @PrimaryGeneratedColumn()
  id: number;

  /** The interest this invite belongs to */
  @ManyToOne(() => Interest, (interest) => interest.invites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "interestId" })
  interest: Interest;

  @Column()
  interestId: number;

  /** The invited user */
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invitedUserId" })
  invitedUser: User;

  @Column()
  invitedUserId: number;

  /** Invite response status */
  @Column({
    type: "enum",
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status: InviteStatus;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;
}
