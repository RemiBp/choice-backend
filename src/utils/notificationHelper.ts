import { NotificationTypeEnums } from "../enums/notification.type.enum";
import { NotificationStatusCode } from "../enums/NotificationStatusCode.enum";
import { NotificationRepository } from "../repositories";
import { sendAdminNotification } from "./sendAdminNotification";

export interface SendNotificationOptions {
    senderId: number;
    receiverId: number;
    notificationCode: NotificationStatusCode;
    jobId?: number;
    title: string;
    body: string;
    type: NotificationTypeEnums;
    purpose?: NotificationTypeEnums;
    restaurantName?: string;
    profilePicture?: string;
    fcmToken?: string | null;
    extraPayload?: Record<string, string>;
}

export const sendNotification = async (options: SendNotificationOptions) => {
    const {
        senderId,
        receiverId,
        notificationCode,
        jobId,
        title,
        body,
        type,
        purpose,
        restaurantName,
        profilePicture,
        fcmToken,
        extraPayload = {},
    } = options;

    //  Save to DB
    const notificationData = {
        sender: { id: senderId },
        receiver: { id: receiverId },
        notificationId: notificationCode,
        jobId,
        title,
        body,
        type,
        purpose: purpose || type,
        restaurantName,
    };

    const notification = NotificationRepository.create(notificationData);
    await NotificationRepository.save(notification);

    // Send FCM push
    if (fcmToken) {
        const payload = {
            notificationId: String(notificationCode),
            type,
            jobId: jobId ? String(jobId) : "",
            userId: String(receiverId),
            name: restaurantName || "",
            profilePicture: profilePicture || "",
            ...extraPayload,
        };

        await sendAdminNotification(fcmToken, title, body, payload);
    }
};
