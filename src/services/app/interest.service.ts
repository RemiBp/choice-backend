import { InterestType } from "../../enums/interestStatus.enum";
import { InviteStatus } from "../../enums/inviteStatus.enum";
import { BadRequestError } from "../../errors/badRequest.error";
import { ForbiddenError } from "../../errors/forbidden.error";
import { NotFoundError } from "../../errors/notFound.error";
import {
    BookingRepository,
    EventBookingRepository,
    EventRepository,
    InterestInviteRepository,
    InterestRepository,
    ProducerRepository,
    SlotRepository,
    UserRepository,
} from "../../repositories";
import dayjs from "dayjs";
import { AcceptInterestInviteInput, CreateInterestInput, DeclineInterestInviteInput, EditSlotInput, ReserveInterestInput, SuggestNewTimeInput } from "../../validators/app/interest.validation";
import { createBooking } from "./booking.service";
import { In } from "typeorm";
import { sendAdminNotification } from "../../utils/sendAdminNotification";
import { NotificationRepository } from "../../repositories";
import { NotificationTypeEnums } from "../../enums/notification.type.enum";
import User from "../../models/User";
import { NotificationStatusCode } from "../../enums/NotificationStatusCode.enum";

export const createInterest = async (userId: number, data: CreateInterestInput) => {
    const { type, producerId, eventId, slotId, suggestedTime, message, invitedUserIds = [] } = data;

    let targetId: number | null = null;

    // Fetch creator (for notification sender info)
    const creator = await UserRepository.findOne({ where: { id: userId } });
    if (!creator) throw new NotFoundError("Creator not found");

    // PRODUCER TYPE
    if (type === InterestType.PRODUCER) {
        if (!producerId) throw new Error("producerId is required for Producer type");
        const producer = await ProducerRepository.findOne({ where: { id: producerId } });
        if (!producer) throw new NotFoundError("Producer not found");
        targetId = producer.id;

        let slotTime: string | null = null;

        if (slotId) {
            const slot = await SlotRepository.findOne({ where: { id: slotId } });
            if (!slot) throw new NotFoundError("Slot not found");

            const baseDate = suggestedTime ? new Date(suggestedTime) : new Date();
            const datePart = baseDate.toISOString().split("T")[0];
            let timePart = slot.startTime;
            if (timePart.length === 5) timePart += ":00";
            const fullTimeString = `${datePart}T${timePart}Z`;
            slotTime = new Date(fullTimeString).toISOString();
        }

        // Create interest
        const interest = InterestRepository.create({
            userId,
            type,
            producerId: targetId,
            eventId: null,
            slotId: slotId ?? null,
            suggestedTime: slotId ? slotTime : suggestedTime ?? null,
            message: message ?? null,
        });

        const savedInterest = await InterestRepository.save(interest);

        // Handle Invites + Notifications
        if (invitedUserIds.length > 0) {
            const validUsers = await UserRepository.find({
                where: { id: In(invitedUserIds) },
                select: ["id", "deviceId", "fullName", "profileImageUrl"],
            });

            const invites = validUsers.map((u: any) => ({
                interestId: savedInterest.id,
                invitedUserId: u.id,
            }));
            await InterestInviteRepository.insert(invites);

            // Create and send notifications
            for (const invitedUser of validUsers) {
                const notificationData = {
                    sender: { id: creator.id } as User,
                    receiver: { id: invitedUser.id } as User,
                    notificationId: NotificationStatusCode.INTEREST_INVITE,
                    type: NotificationTypeEnums.INTEREST_INVITE,
                    title: "You’ve been invited!",
                    body: `${creator.fullName} invited you to join an interest.`,
                    purpose: NotificationTypeEnums.INTEREST_INVITE,
                };

                const notification = NotificationRepository.create(notificationData);
                await NotificationRepository.save(notification);

                // Send FCM notification (if deviceId present)
                if (invitedUser.deviceId) {
                    const notificationPayload = {
                        notificationId: String(NotificationStatusCode.INTEREST_INVITE),
                        interestId: String(savedInterest.id),
                        type: NotificationTypeEnums.INTEREST_INVITE,
                        userId: String(creator.id),
                        profilePicture: String(creator.profileImageUrl || ""),
                        name: creator.fullName,
                    };

                    await sendAdminNotification(
                        invitedUser.deviceId,
                        "You’ve been invited!",
                        `${creator.fullName} invited you to join an interest.`,
                        notificationPayload
                    );
                }
            }
        }

        return savedInterest;
    }

    // EVENT TYPE
    if (type === InterestType.EVENT) {
        if (!eventId) throw new Error("eventId is required for Event type");
        const event = await EventRepository.findOne({ where: { id: eventId } });
        if (!event) throw new NotFoundError("Event not found");
        targetId = event.id;

        const interest = InterestRepository.create({
            userId,
            type,
            eventId: targetId,
            producerId: null,
            suggestedTime: suggestedTime ?? null,
            message: message ?? null,
        });

        const savedInterest = await InterestRepository.save(interest);

        if (invitedUserIds.length > 0) {
            const validUsers = await UserRepository.find({
                where: { id: In(invitedUserIds) },
                select: ["id", "deviceId", "fullName", "profileImageUrl"],
            });

            const invites = validUsers.map((u: any) => ({
                interestId: savedInterest.id,
                invitedUserId: u.id,
            }));
            await InterestInviteRepository.insert(invites);

            //Create and send notifications
            for (const invitedUser of validUsers) {
                const notificationData = {
                    sender: { id: creator.id } as User,
                    receiver: { id: invitedUser.id } as User,
                    notificationId: NotificationStatusCode.INTEREST_INVITE,
                    type: NotificationTypeEnums.INTEREST_INVITE,
                    title: "You’ve been invited!",
                    body: `${creator.fullName} invited you to join an event interest.`,
                    purpose: NotificationTypeEnums.INTEREST_INVITE,
                };

                const notification = NotificationRepository.create(notificationData);
                await NotificationRepository.save(notification);

                if (invitedUser.deviceId) {
                    const notificationPayload = {
                        notificationId: String(NotificationStatusCode.INTEREST_INVITE),
                        interestId: String(savedInterest.id),
                        type: NotificationTypeEnums.INTEREST_INVITE,
                        userId: String(creator.id),
                        profilePicture: String(creator.profileImageUrl || ""),
                        name: creator.fullName,
                    };

                    await sendAdminNotification(
                        invitedUser.deviceId,
                        "You’ve been invited!",
                        `${creator.fullName} invited you to join an event interest.`,
                        notificationPayload
                    );
                }
            }
        }

        return savedInterest;
    }

    throw new Error("Invalid interest type");
};

export const getProducerSlots = async (producerId: number) => {
    try {
        const slots = await SlotRepository.createQueryBuilder('slot')
            .innerJoin('slot.user', 'user')
            .where('user.id = :producerId', { producerId })
            .orderBy(
                `
        CASE 
          WHEN slot.day = 'Monday' THEN 1
          WHEN slot.day = 'Tuesday' THEN 2
          WHEN slot.day = 'Wednesday' THEN 3
          WHEN slot.day = 'Thursday' THEN 4
          WHEN slot.day = 'Friday' THEN 5
          WHEN slot.day = 'Saturday' THEN 6
          WHEN slot.day = 'Sunday' THEN 7
          ELSE 8
        END
      `,
                'ASC'
            )
            .addOrderBy('slot.startTime', 'ASC')
            .getMany();

        const groupedSlots = slots.reduce((acc: Record<string, typeof slots>, slot: any) => {
            const { day } = slot;
            if (!acc[day]) acc[day] = [];
            acc[day].push(slot);
            return acc;
        }, {});

        const response = {
            data: Object.entries(groupedSlots).map(([day, slots]) => ({
                day,
                slots,
            })),
        };

        return response;
    } catch (error) {
        console.error('Error in getProducerSlots', { error }, 'ProfileService');
        throw error;
    }
};

export const getInvited = async (userId: number) => {
    const interests = await InterestRepository.createQueryBuilder("interest")
        .leftJoinAndSelect("interest.producer", "producer")
        .leftJoinAndSelect("interest.event", "event")
        .leftJoinAndSelect("interest.slot", "slot")
        .leftJoinAndSelect("interest.invites", "invites")
        .leftJoinAndSelect("invites.invitedUser", "invitedUser")
        .where("invites.invitedUserId = :userId", { userId })
        .orderBy("interest.createdAt", "DESC")
        .getMany();

    return interests;
};

export const invitedDetails = async (userId: number, interestId: number) => {
    const interest = await InterestRepository.findOne({
        where: { id: interestId },
        relations: [
            "producer",
            "event",
            "slot",
            "invites",
            "invites.invitedUser",
        ],
    });

    if (!interest) throw new NotFoundError("Interest not found");

    return interest;
};

export const acceptInterestInvite = async (userId: number, data: AcceptInterestInviteInput) => {
    try {
        const { interestId } = data;

        const invite = await InterestInviteRepository.findOne({
            where: { invitedUserId: userId, interestId },
            relations: ["interest"],
        });

        if (!invite) throw new NotFoundError("Invite not found for this user.");

        // Prevent re-accept or accept after decline/suggest
        if ([InviteStatus.ACCEPTED, InviteStatus.DECLINED, InviteStatus.SUGGESTED_NEW_TIME].includes(invite.status)) {
            throw new Error(`You cannot accept an invite that is already ${invite.status.toLowerCase()}.`);
        }

        invite.status = InviteStatus.ACCEPTED;
        invite.respondedAt = new Date();
        await InterestInviteRepository.save(invite);

        // Notify creator that someone accepted their invite
        const interest = invite.interest;
        if (interest) {
            const creator = await UserRepository.findOne({ where: { id: interest.userId } });
            const accepter = await UserRepository.findOne({ where: { id: userId } });

            if (creator && accepter) {
                const notificationData = {
                    sender: { id: accepter.id } as User,
                    receiver: { id: creator.id } as User,
                    notificationId: NotificationStatusCode.INTEREST_ACCEPTED,
                    type: NotificationTypeEnums.INTEREST_ACCEPTED,
                    title: "Invite Accepted",
                    body: `${accepter.fullName || "Someone"} accepted your interest invite.`,
                    purpose: NotificationTypeEnums.INTEREST_ACCEPTED,
                };

                const notification = NotificationRepository.create(notificationData);
                await NotificationRepository.save(notification);

                if (creator.deviceId) {
                    const notificationPayload = {
                        notificationId: String(NotificationStatusCode.INTEREST_ACCEPTED),
                        interestId: String(interest.id),
                        type: NotificationTypeEnums.INTEREST_ACCEPTED,
                        userId: String(accepter.id),
                        profilePicture: String(accepter.profileImageUrl || ""),
                        name: accepter.fullName || "Someone",
                    };

                    await sendAdminNotification(
                        creator.deviceId,
                        "Invite Accepted",
                        `${accepter.fullName || "Someone"} accepted your interest invite.`,
                        notificationPayload
                    );
                }
            }
        }

        // If all invited users have accepted → mark interest confirmed
        const allInvites = await InterestInviteRepository.find({ where: { interestId } });
        const allAccepted = allInvites.every((i: any) => i.status === InviteStatus.ACCEPTED);

        if (allAccepted && invite.interest) {
            invite.interest.status = "Confirmed";
            await InterestRepository.save(invite.interest);

            // Optional: Notify all participants that interest is confirmed
            const participants = await InterestInviteRepository.find({
                where: { interestId },
                relations: ["invitedUser"],
            });

            for (const participant of participants) {
                const user = participant.invitedUser;
                if (user?.deviceId) {
                    await sendAdminNotification(
                        user.deviceId,
                        "Interest Confirmed",
                        "All users have accepted — your interest is now confirmed!",
                        {
                            notificationId: String(NotificationStatusCode.INTEREST_CONFIRMED),
                            interestId: String(interestId),
                            type: NotificationTypeEnums.INTEREST_CONFIRMED,
                        }
                    );
                }
            }
        }

        return invite;
    } catch (error: any) {
        console.error("Error in acceptInterestInvite:", error);
        return {
            success: false,
            message: error.message || "Something went wrong while accepting invite.",
        };
    }
};

export const declineInterestInvite = async (userId: number, data: DeclineInterestInviteInput) => {
    try {
        const { interestId, reason } = data;

        if (!interestId || !userId) throw new Error("Invalid input: interestId and userId are required.");

        const invite = await InterestInviteRepository.findOne({
            where: { invitedUserId: userId, interestId },
            relations: ["interest"],
        });

        if (!invite) throw new NotFoundError("Invite not found for this user.");

        // Prevent decline after accept or already declined
        if ([InviteStatus.DECLINED, InviteStatus.ACCEPTED].includes(invite.status)) {
            throw new Error(`You cannot decline an invite that is already ${invite.status.toLowerCase()}.`);
        }

        invite.status = InviteStatus.DECLINED;
        invite.declineReason = reason ?? null;
        invite.respondedAt = new Date();
        await InterestInviteRepository.save(invite);

        // Notify the creator that someone declined
        const interest = invite.interest;
        if (interest) {
            const creator = await UserRepository.findOne({ where: { id: interest.userId } });
            const decliner = await UserRepository.findOne({ where: { id: userId } });

            if (creator && decliner) {
                const notificationData = {
                    sender: { id: decliner.id } as User,
                    receiver: { id: creator.id } as User,
                    notificationId: NotificationStatusCode.INTEREST_DECLINED,
                    type: NotificationTypeEnums.INTEREST_DECLINED,
                    title: "Invite Declined",
                    body: `${decliner.fullName || "Someone"} declined your interest invite.`,
                    purpose: NotificationTypeEnums.INTEREST_DECLINED,
                };

                const notification = NotificationRepository.create(notificationData);
                await NotificationRepository.save(notification);

                if (creator.deviceId) {
                    const notificationPayload = {
                        notificationId: String(NotificationStatusCode.INTEREST_DECLINED),
                        interestId: String(interest.id),
                        type: NotificationTypeEnums.INTEREST_DECLINED,
                        userId: String(decliner.id),
                        profilePicture: String(decliner.profileImageUrl || ""),
                        name: decliner.fullName || "Someone",
                    };

                    await sendAdminNotification(
                        creator.deviceId,
                        "Invite Declined",
                        `${decliner.fullName || "Someone"} declined your interest invite.`,
                        notificationPayload
                    );
                }
            }
        }

        // If all declined → mark main interest as Declined
        const allInvites = await InterestInviteRepository.find({ where: { interestId } });
        const allDeclined = allInvites.every((i: any) => i.status === InviteStatus.DECLINED);

        if (allDeclined) {
            const interest = await InterestRepository.findOne({ where: { id: interestId } });
            if (interest) {
                interest.status = "Declined";
                await InterestRepository.save(interest);

                // Optional: notify everyone that the interest has been declined
                const participants = await InterestInviteRepository.find({
                    where: { interestId },
                    relations: ["invitedUser"],
                });

                for (const participant of participants) {
                    const user = participant.invitedUser;
                    if (user?.deviceId) {
                        await sendAdminNotification(
                            user.deviceId,
                            "Interest Declined",
                            "All users have declined — this interest has been closed.",
                            {
                                notificationId: String(NotificationStatusCode.INTEREST_DECLINED),
                                interestId: String(interestId),
                                type: NotificationTypeEnums.INTEREST_DECLINED,
                            }
                        );
                    }
                }
            }
        }

        return invite;
    } catch (error: any) {
        console.error("Error in declineInterestInvite:", error);
        return {
            success: false,
            message: error.message || "Something went wrong while declining invite.",
        };
    }
};

export const suggestNewTime = async (userId: number, data: SuggestNewTimeInput) => {
    try {
        const { interestId, slotId, suggestedTime, message } = data;

        if (!interestId || !userId) throw new Error("Invalid input: interestId and userId are required.");

        const invite = await InterestInviteRepository.findOne({
            where: { invitedUserId: userId, interestId },
            relations: ["interest", "interest.producer"],
        });

        if (!invite) throw new NotFoundError("Invite not found for this user.");

        const interest = invite.interest;
        if (!interest || !interest.producerId)
            throw new Error("This interest is not linked to a valid producer.");

        // Prevent suggesting new time after accept or decline
        if ([InviteStatus.ACCEPTED, InviteStatus.DECLINED].includes(invite.status)) {
            throw new Error(
                `You cannot suggest a new time for an invite that is already ${invite.status.toLowerCase()}.`
            );
        }

        // Validate slot belongs to same producer
        let selectedSlot = null;
        if (slotId) {
            selectedSlot = await SlotRepository.findOne({
                where: { id: slotId, userId: interest.producerId },
            });
            if (!selectedSlot)
                throw new Error("Invalid slot: slot does not belong to this producer.");
        }

        invite.status = InviteStatus.SUGGESTED_NEW_TIME;
        invite.suggestedSlotId = selectedSlot ? selectedSlot.id : null;
        invite.suggestedTime = suggestedTime ? new Date(suggestedTime) : null;
        invite.suggestedMessage = message ?? null;
        invite.respondedAt = new Date();

        await InterestInviteRepository.save(invite);

        // Notify the creator about the new suggested time
        const creator = await UserRepository.findOne({ where: { id: interest.userId } });
        const suggester = await UserRepository.findOne({ where: { id: userId } });

        if (creator && suggester) {
            const readableTime = suggestedTime
                ? new Date(suggestedTime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                : "a new slot";

            const notificationData = {
                sender: { id: suggester.id } as User,
                receiver: { id: creator.id } as User,
                notificationId: NotificationStatusCode.INTEREST_SUGGESTED_NEW_TIME,
                type: NotificationTypeEnums.INTEREST_SUGGESTED_NEW_TIME,
                title: "New Time Suggested",
                body: `${suggester.fullName || "Someone"} suggested ${readableTime} for your interest.`,
                purpose: NotificationTypeEnums.INTEREST_SUGGESTED_NEW_TIME,
            };

            const notification = NotificationRepository.create(notificationData);
            await NotificationRepository.save(notification);

            if (creator.deviceId) {
                const notificationPayload = {
                    notificationId: String(NotificationStatusCode.INTEREST_SUGGESTED_NEW_TIME),
                    interestId: String(interest.id),
                    type: NotificationTypeEnums.INTEREST_SUGGESTED_NEW_TIME,
                    userId: String(suggester.id),
                    profilePicture: String(suggester.profileImageUrl || ""),
                    name: suggester.fullName || "Someone",
                };

                await sendAdminNotification(
                    creator.deviceId,
                    "New Time Suggested",
                    `${suggester.fullName || "Someone"} suggested ${readableTime} for your interest.`,
                    notificationPayload
                );
            }
        }

        return invite;
    } catch (error: any) {
        console.error("Error in suggestNewTime:", error);
        return {
            success: false,
            message: error.message || "Something went wrong while suggesting new time.",
        };
    }
};

export const getUserInterests = async (userId: number) => {
    const interests = await InterestRepository.find({
        where: { userId },
        relations: [
            "producer",
            "event",
            "slot",
            "invites",
            "invites.invitedUser",
        ],
        order: { createdAt: "DESC" },
    });

    if (!interests.length) return [];

    return interests;
};

export const getInterestDetails = async (userId: number, interestId: number) => {
    const interest = await InterestRepository.findOne({
        where: { id: interestId, userId },
        relations: ["producer", "event", "invites"],
    });
    if (!interest) throw new NotFoundError("Interest not found");

    return interest;
};

export const respondToInvite = async (userId: number, interestId: number, response: string) => {
    const invite = await InterestInviteRepository.findOne({
        where: { interestId, invitedUserId: userId },
    });
    if (!invite) throw new NotFoundError("Invite not found");
    invite.status = response;

    const updatedInvite = await InterestInviteRepository.save(invite);
    return updatedInvite;
};

export const editInterestSlot = async (userId: number, data: EditSlotInput) => {
    const { newSlotId, message, interestId } = data;

    // Find interest
    const interest = await InterestRepository.findOne({ where: { id: interestId } });
    if (!interest) throw new NotFoundError("Interest not found");

    if (interest.userId !== userId)
        throw new ForbiddenError("You are not authorized to update this interest");

    // Find new slot
    const slot = await SlotRepository.findOne({ where: { id: newSlotId } });
    if (!slot) throw new NotFoundError("Selected slot not found");

    // Check if slot is available
    if ((slot as any).isBooked || (slot as any).status === "Reserved") {
        throw new BadRequestError("Selected slot is not available");
    }

    // Free previous slot (if any)
    if (interest.slotId) {
        const oldSlot = await SlotRepository.findOne({ where: { id: interest.slotId } });
        if (oldSlot) {
            (oldSlot as any).isBooked = false;
            (oldSlot as any).status = "Available";
            await SlotRepository.save(oldSlot);
        }
    }

    // Reserve new slot
    (slot as any).isBooked = true;
    (slot as any).status = "Reserved";
    await SlotRepository.save(slot);

    // Update interest record
    interest.slotId = slot.id;
    // since slot.startTime is only "10:00:00" (not a date), we won’t try to convert it to Date
    // we’ll just store null or keep previous suggestedTime
    interest.suggestedTime = null;
    interest.message = message ?? interest.message;
    await InterestRepository.save(interest);

    // Reset invites if needed
    await InterestInviteRepository.update(
        { interestId: interest.id },
        {
            status: "Pending",
            suggestedSlotId: null,
            suggestedTime: null,
            suggestedMessage: null,
        }
    );

    // Return clean response
    return {
        interestId: interest.id,
        newSlot: {
            id: slot.id,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: (slot as any).status ?? "Reserved",
        },
        message: interest.message,
        status: "UPDATED_BY_CREATOR",
    };
};

export const reserveInterest = async (userId: number, data: ReserveInterestInput) => {
    const { interestId, timeZone, guestCount = 1, specialRequest = "", date } = data;

    const interest = await InterestRepository.findOne({
        where: { id: interestId },
        relations: ["producer", "slot", "event"],
    });

    if (!interest) throw new NotFoundError("Interest not found");
    if (interest.userId !== userId)
        throw new ForbiddenError("You are not authorized to reserve this interest");

    if (interest.type === InterestType.PRODUCER) {
        const slot = interest.slot;
        const producer = interest.producer;

        if (!slot || !producer)
            throw new BadRequestError("Missing slot or producer information");

        const restaurantUserId = producer.userId;

        // Normalize slot times safely
        const normalizeTime = (t?: string | null) => {
            if (!t) return null;
            // If HH:MM:SS → HH:MM
            const parts = t.split(":");
            if (parts.length < 2) return null;
            const [h, m] = parts;
            return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
        };

        slot.startTime = normalizeTime(slot.startTime);
        slot.endTime = normalizeTime(slot.endTime);

        if (!slot.startTime || !slot.endTime) {
            console.error("Invalid slot time values:", {
                startTime: slot.startTime,
                endTime: slot.endTime,
            });
            throw new BadRequestError("Invalid slot times for booking");
        }

        // Persist cleaned slot times in DB before booking
        await SlotRepository.update(slot.id, {
            startTime: slot.startTime,
            endTime: slot.endTime,
        });

        console.log("Cleaned & persisted slot times before booking:", {
            startTime: slot.startTime,
            endTime: slot.endTime,
        });

        // Validate date & timezone
        if (!date || isNaN(new Date(date).getTime())) {
            throw new BadRequestError("Please provide a valid date for reservation");
        }
        if (!timeZone) {
            throw new BadRequestError("Time zone is required");
        }

        console.log("Passing safe times to createBooking:", {
            startTime: slot.startTime,
            endTime: slot.endTime,
            date,
            timeZone,
        });

        const bookingPayload = {
            userId,
            restaurantId: restaurantUserId,
            slotId: slot.id,
            guestCount,
            specialRequest,
            timeZone,
            date,
        };

        // Call createBooking (unchanged)
        const response = await createBooking(bookingPayload as any);

        // Mark interest as confirmed
        interest.status = "Confirmed";
        await InterestRepository.save(interest);

        return {
            type: "producer",
            message: "Interest converted into confirmed booking",
            booking: response.booking,
        };
    }

    // EVENT-BASED INTEREST 
    if (interest.type === InterestType.EVENT) {
        const event = interest.event;
        if (!event) throw new BadRequestError("No event linked to this interest");

        const totalPrice = event.pricePerGuest
            ? Number(event.pricePerGuest) * guestCount
            : null;

        const eventBooking = EventBookingRepository.create({
            user: { id: userId } as any,
            event,
            numberOfPersons: guestCount,
            totalPrice,
            internalNotes: specialRequest,
        });

        await EventBookingRepository.save(eventBooking);

        interest.status = "Confirmed";
        await InterestRepository.save(interest);

        return {
            type: "event",
            message: "Event interest reserved successfully",
            booking: {
                id: eventBooking.id,
                eventId: event.id,
                numberOfPersons: eventBooking.numberOfPersons,
                totalPrice: eventBooking.totalPrice,
            },
        };
    }

    throw new BadRequestError("Unknown interest type");
};

export * as InterestService from "./interest.service";
