import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatCategoryEnum } from "../enums/chatCategory.enum";
import User from "./User";
import Message from "./Message";
import ChatMember from "./ChatMember";

@Entity("chats")
export default class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string; // Only for group chats

  @Column({ default: false })
  isGroupChat: boolean;

  @Column({
    type: "enum",
    enum: ChatCategoryEnum,
    default: ChatCategoryEnum.FRIENDS,
  })
  category: ChatCategoryEnum;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  creatorId: number;

  @ManyToOne(() => User, (user) => user.createdChats)
  @JoinColumn({ name: "creatorId" })
  creator: User;

  @Column({ nullable: true })
  lastMessageId: number;

  @OneToOne(() => Message, { cascade: true, nullable: true })
  @JoinColumn({ name: "lastMessageId" })
  lastMessage: Message;

  @OneToMany(() => ChatMember, (chatMember) => chatMember.chat, {
    cascade: ["insert"],
  })
  members: ChatMember[];

  @OneToMany(() => Message, (message) => message.chat, {
    cascade: ["insert"],
  })
  messages: Message[];
}