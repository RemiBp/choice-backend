import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import Chat from "./Chat";
import User from "./User";

@Entity("chat_members")
export default class ChatMember {
  @PrimaryColumn()
  chatId: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => Chat, (chat) => chat.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chatId" })
  chat: Chat;

  @ManyToOne(() => User, (user) => user.chatMemberships, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  joinedAt: Date;
}