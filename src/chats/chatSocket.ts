import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "../errors/unauthorized.error";
import ChatService from "../services/chat.service";
import { sendAdminNotification } from "../utils/sendAdminNotification";
import { NotificationTypeEnums } from "../enums/notification.type.enum";
import { NotificationRepository, UserRepository } from "../repositories";
import { PostNotificationCode } from "../enums/post-notification.enum";

interface UserPayload extends JwtPayload {
    id: number;
    email: string;
    roles: string[];
}

interface AuthenticatedSocket extends Socket {
    userId: number;
    email: string;
    roles: string[];
}

export default function chatSocket(server: HttpServer): SocketIOServer {

    const io = new SocketIOServer(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            // credentials: true
        }
    });

    // 🔐 JWT Authentication Middleware
    io.use((socket: Socket, next) => {
        const token = socket.handshake.headers.token as string;
        if (!token) return next(new UnauthorizedError("Token not provided"));

        jwt.verify(token, process.env.JWT_ACCESS_SECRET!, (err, decoded) => {
            if (err || typeof decoded === "string" || !decoded?.id) {
                return next(new UnauthorizedError("Invalid or expired token"));
            }

            const user = decoded as UserPayload;
            (socket as AuthenticatedSocket).userId = user.id;
            (socket as AuthenticatedSocket).email = user.email;
            (socket as AuthenticatedSocket).roles = user.roles;

            next();
        });
    });

    console.log("✅ Socket.IO initialized");

    // 📡 Socket Event Handlers
    io.on("connection", (socket: Socket) => {
        const authSocket = socket as AuthenticatedSocket;

        // User joins their own room
        socket.on("setup", () => {
            socket.join(authSocket.userId.toString());
            socket.emit("connected", `User ${authSocket.userId} connected`);
        });

        // 📩 First Message — create new chat (1-1 or group)
        socket.on("newFirstMessage", async (data: any) => {
            try {
                const parsed = typeof data === "string" ? JSON.parse(data) : data;
                const msgData = parsed?.data || parsed;
                if (!msgData || !msgData.chatMembers || !msgData.message) {
                    throw new Error("Invalid message data");
                }
                if (!Array.isArray(msgData.chatMembers) || msgData.chatMembers.length === 0) {
                    throw new Error("Chat members must be an array with at least one member");
                }
                const chatData = await ChatService.createChatOrSaveMessage(authSocket.userId, msgData);

                const responsePayload = {
                    chatId: chatData.id,
                    message: msgData.message,
                    senderId: authSocket.userId
                };

                const recipients = msgData.chatMembers.filter((id: number) => id !== authSocket.userId);
                recipients.forEach((userId: number) => {
                    io.to(userId.toString()).emit("receiveMessage", responsePayload);
                });

                io.to(authSocket.userId.toString()).emit("chatCreated", responsePayload);
            } catch (err) {
                console.error("❌ Failed to send first message:", err);
                socket.emit("error", {
                    message: "Failed to send first message",
                    details: err instanceof Error ? err.message : err
                });
            }
        });

        // ✉️ Send message to existing chat
        // socket.on("newMessage", async (rawData: any) => {
        //     try {
        //         const msgData = rawData;

        //         const result = await ChatService.saveNewMessage(authSocket.userId, msgData);

        //         const dataToSend = {
        //             id: result.message.id,
        //             chatId: msgData.chatId,
        //             content: result.message.content,
        //             fileUrl: result.message.fileUrl,
        //             messageType: result.message.messageType,
        //             createdAt: result.message.createdAt,
        //             sender: {
        //                 id: result.user.id,
        //                 fullName: result.user.fullName,
        //                 email: result.user.email,
        //                 // avatar: result.user.profileImage
        //             }
        //         };

        //         const recipients = result.chat.members
        //             .filter((member: any) => member.userId !== authSocket.userId)
        //             .map((member: any) => member.userId);

        //         recipients.forEach((userId: number) => {
        //             io.to(userId.toString()).emit("receiveMessage", dataToSend);
        //         });

        //         io.to(authSocket.userId.toString()).emit("messageSent", dataToSend);
        //     } catch (err) {
        //         socket.emit("error", { message: "Failed to send message", details: err });
        //     }
        // });

        socket.on("newMessage", async (rawData: any) => {
            try {
                const msgData = rawData;
                const result = await ChatService.saveNewMessage(authSocket.userId, msgData);

                const dataToSend = {
                    id: result.message.id,
                    chatId: msgData.chatId,
                    content: result.message.content,
                    fileUrl: result.message.fileUrl,
                    messageType: result.message.messageType,
                    createdAt: result.message.createdAt,
                    sender: {
                        id: result.user.id,
                        fullName: result.user.fullName,
                        email: result.user.email,
                    },
                };

                // 👥 Get recipients (exclude sender)
                const recipients = result.chat.members
                    .filter((m: any) => m.userId !== authSocket.userId)
                    .map((m: any) => m.userId);

                // 📡 Emit real-time to all recipients
                recipients.forEach((userId: number) => {
                    io.to(userId.toString()).emit("receiveMessage", dataToSend);
                });

                // 👤 Echo back to sender
                io.to(authSocket.userId.toString()).emit("messageSent", dataToSend);

                // 🔔 Notifications (DB + Push)
                for (const userId of recipients) {
                    const receiver = await UserRepository.findOneBy({ id: userId });
                    if (!receiver) continue;

                    // ✅ Title & Body differ for group vs single
                    const title = result.chat.isGroupChat
                        ? `New message in ${result.chat.name || "Group Chat"}`
                        : `New message from ${result.user.fullName}`;

                    const body = result.message.content || "Sent an attachment";

                    // Save DB notification
                    await NotificationRepository.save({
                        notificationId: PostNotificationCode.NEW_MESSAGE,
                        receiver,
                        sender: result.user,
                        title,
                        body,
                        type: NotificationTypeEnums.CHAT_MESSAGE,
                        purpose: NotificationTypeEnums.CHAT_MESSAGE,
                    });

                    // Push notification via FCM
                    if (receiver.deviceId) {
                        const notificationPayload = {
                            notificationId: String(PostNotificationCode.NEW_MESSAGE),
                            chatId: String(result.chat.id),
                            senderId: String(result.user.id),
                            type: NotificationTypeEnums.CHAT_MESSAGE,
                            createdAt: new Date().toISOString(),
                        };

                        await sendAdminNotification(receiver.deviceId, title, body, notificationPayload);
                    }
                }
            } catch (err) {
                console.error("❌ Failed to send chat message:", err);
                socket.emit("error", { message: "Failed to send message", details: err });
            }
        });


        // 🧾 Fetch paginated messages
        socket.on("getMessages", async (data: any) => {
            try {
                const { chatId, page, limit } = data;
                const messages = await ChatService.getMessagesOfChatPaginated(authSocket.userId, chatId, page, limit);
                socket.emit("messages", messages);
            } catch (err) {
                console.error("❌ Failed to get messages:", err);
                socket.emit("error", { message: "Failed to get messages", details: err });
            }

        });

        // 💬 Fetch all chats
        socket.on("getChats", async () => {
            try {
                const chats = await ChatService.getChats(authSocket.userId);
                socket.emit("chats", chats);
            } catch (err) {
                socket.emit("error", { message: "Failed to get chats", details: err });
            }
        });
    });

    return io;
}