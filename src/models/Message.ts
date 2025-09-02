import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Chat from "./Chat";
import User from "./User";
import { MessageTypeEnums } from "../enums/chat.enum";

@Entity("messages")
export default class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    chatId: number;

    @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "chatId" })
    chat: Chat;

    @Column()
    senderId: number;

    @ManyToOne(() => User, (user) => user.messages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "senderId" })
    sender: User;

    @Column("text")
    content: string;

    @Column({ nullable: true })
    fileUrl: string;

    @Column({
        type: "enum",
        enum: MessageTypeEnums,
    })
    messageType: MessageTypeEnums;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ default: false })
    isRead: boolean;
}