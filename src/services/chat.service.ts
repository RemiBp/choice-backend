// src/service/chat.service.ts
import { In } from "typeorm";
import Chat from "../models/Chat"; 
import Message from "../models/Message"; 
import User from "../models/User"; 
import ChatMember from "../models/ChatMember"; 
import { ChatRepository, MessageRepository, UserRepository, ChatMemberRepository } from "../repositories";

class ChatService {
    // 🔹 Create a new chat or reuse existing 1-to-1/group chat
    async createChatOrSaveMessage(senderId: number, msgData: any): Promise<Chat> {
        const { message, chatMembers, chatName, category } = msgData;

        // Ensure sender is included
        if (!chatMembers.includes(senderId)) {
            chatMembers.push(senderId);
        }

        const isGroupChat = !!msgData.chatName || chatMembers.length > 2;

        // 🔍 Try finding existing 1-to-1 chat (only for non-group)
        if (!isGroupChat) {
            const existingChat = await ChatRepository.createQueryBuilder("chat")
                .leftJoin("chat.members", "member")
                .where("chat.isGroupChat = false")
                .andWhere("member.userId IN (:...members)", { members: chatMembers })
                .groupBy("chat.id")
                .having("COUNT(DISTINCT member.userId) = :count", { count: chatMembers.length })
                .getOne();

            if (existingChat) {
                const newMessage = MessageRepository.create({
                    content: message.content,
                    fileUrl: message.fileUrl,
                    messageType: message.messageType,
                    senderId,
                    chat: existingChat,
                });
                await MessageRepository.save(newMessage);
                existingChat.lastMessage = newMessage;
                return await ChatRepository.save(existingChat);
            }
        }

        // ✏️ Create new chat
        const newChat = ChatRepository.create({
            name: isGroupChat ? chatName : null,
            isGroupChat,
            creatorId: senderId,
            category,
        });
        await ChatRepository.save(newChat);

        // 💬 Create first message
        const newMessage = MessageRepository.create({
            content: message.content,
            fileUrl: message.fileUrl,
            messageType: message.messageType,
            senderId,
            chatId: newChat.id,
            chat: newChat,
        });
        await MessageRepository.save(newMessage);
        newChat.lastMessage = newMessage;
        newChat.lastMessageId = newMessage.id;

        // 👥 Create chat members
        const members = chatMembers.map((userId: number) =>
            ChatMemberRepository.create({
                chatId: newChat.id,
                userId,
                isAdmin: userId === senderId,
            })
        );
        await ChatMemberRepository.save(members);
        const savedChat = await ChatRepository.save(newChat);
        return savedChat;

    }

    // 🔹 Send new message to existing chat
    async saveNewMessage(senderId: number, msgData: any): Promise<{ user: User; chat: Chat; message: Message }> {
        const { chatId, message } = msgData;

        const chat = await ChatRepository.findOne({
            where: { id: chatId },
            relations: ["members"],
        });
        if (!chat) throw new Error("Chat not found");

        const user = await UserRepository.findOne({ where: { id: senderId } });
        if (!user) throw new Error("Sender not found");

        const isMember = chat.members.some((m: any) => m.userId === senderId);
        if (!isMember) throw new Error("User is not a member of the chat");

        const newMessage = MessageRepository.create({
            content: message.content,
            fileUrl: message.fileUrl,
            messageType: message.messageType,
            senderId,
            chat,
        });
        await MessageRepository.save(newMessage);

        // Update last message reference in chat
        chat.lastMessage = newMessage;
        chat.lastMessageId = newMessage.id;

        await ChatRepository.save(chat);

        return { user, chat, message: newMessage };
    }

    // 🔹 Get all chats for a user
    async getChats(userId: number): Promise<Chat[]> {
        const memberLinks = await ChatMemberRepository.find({
            where: { userId },
            relations: ["chat"],
        });

        const chatIds = memberLinks.map((m: { chat: { id: any; }; }) => m.chat.id);

        const chats = await ChatRepository.find({
            where: { id: In(chatIds) },
            relations: ["lastMessage", "members"],
            order: { createdAt: "DESC" },
        });

        return chats;
    }

    // 🔹 Paginated messages of a chat
    async getMessagesOfChatPaginated(userId: number, chatId: number, page = 1, limit = 20): Promise<Message[]> {
        const offset = (page - 1) * limit;

        const isMember = await ChatMemberRepository.findOne({
            where: { userId, chatId },
        });
        if (!isMember) throw new Error("Unauthorized access to chat messages");

        const [messages] = await MessageRepository.findAndCount({
            where: { chatId },
            relations: ["sender"],
            order: { createdAt: "DESC" },
            skip: offset,
            take: limit,
        });

        return messages;
    }
}

export default new ChatService();