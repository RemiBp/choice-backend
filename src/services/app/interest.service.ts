import { InterestStatus, InterestType } from "../../enums/interestStatus.enum";
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
import { AcceptInterestInviteInput, CreateInterestInput, DeclineInterestInviteInput, EditSlotInput, ReserveInterestInput, SuggestNewTimeInput, RespondToInviteSchema, RespondToInviteInput } from '../../validators/app/interest.validation';
import { createBooking } from "./booking.service";
import { In } from "typeorm";
import { NotificationTypeEnums } from "../../enums/notification.type.enum";
import { NotificationStatusCode } from "../../enums/NotificationStatusCode.enum";
import InterestInvite from "../../models/InterestInvite";
import PostgresDataSource from "../../data-source";
import { BookingStatusEnums } from "../../enums/bookingStatus.enum";
import { sendNotification } from "../../utils/notificationHelper";

export const createInterest = async (userId: number, data: CreateInterestInput) => {
    const { type, producerId, eventId, slotId, suggestedTime, message, invitedUserIds = [] } = data;
    let targetId: number | null = null;

    // Fetch creator (for notification sender info)
    const creator = await UserRepository.findOne({ where: { id: userId } });
    if (!creator) throw new NotFoundError("Creator not found");

    // PRODUCER TYPE INTEREST
    if (type === InterestType.PRODUCER) {
        if (!producerId) throw new Error("producerId is required for Producer type");

        // Use QueryBuilder to fetch only the id column
        const producer = await ProducerRepository.createQueryBuilder("producer")
            .select(["producer.id"]) // only select the id
            .where("producer.id = :id", { id: producerId })
            .getOne();

        if (!producer) throw new NotFoundError("Producer not found");

        targetId = producer.id;

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

            // Send Notifications using helper
            await Promise.all(
                validUsers.map((invitedUser: any) =>
                    sendNotification({
                        senderId: creator.id,
                        receiverId: invitedUser.id,
                        notificationCode: NotificationStatusCode.INTEREST_INVITE,
                        type: NotificationTypeEnums.INTEREST_INVITE,
                        title: "You’ve been invited!",
                        body: `${creator.fullName} invited you to join an interest.`,
                        restaurantName: creator.fullName,
                        profilePicture: creator.profileImageUrl || "",
                        fcmToken: invitedUser.deviceId,
                        extraPayload: {
                            interestId: String(savedInterest.id),
                        },
                    })
                )
            );
        }

        return savedInterest;
    }

    // EVENT TYPE INTEREST
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

            // Send Notifications using helper
            await Promise.all(
                validUsers.map((invitedUser: any) =>
                    sendNotification({
                        senderId: creator.id,
                        receiverId: invitedUser.id,
                        notificationCode: NotificationStatusCode.INTEREST_INVITE,
                        type: NotificationTypeEnums.INTEREST_INVITE,
                        title: "You’ve been invited!",
                        body: `${creator.fullName} invited you to join an event interest.`,
                        restaurantName: creator.fullName,
                        profilePicture: creator.profileImageUrl || "",
                        fcmToken: invitedUser.deviceId,
                        extraPayload: {
                            interestId: String(savedInterest.id),
                        },
                    })
                )
            );
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
        ],
    });

    if (!interest) throw new NotFoundError("Interest not found");

    // Authorization: creator or invited user
    let isAuthorized = interest.userId === userId;

    if (!isAuthorized && Array.isArray(interest.invites)) {
        for (const invite of interest.invites as InterestInvite[]) {
            if (invite.invitedUserId === userId) {
                isAuthorized = true;
                break;
            }
        }
    }

    if (!isAuthorized) {
        throw new ForbiddenError("You are not authorized to view this interest");
    }

    return interest;
};

export const acceptInterestInvite = async (userId: number, data: AcceptInterestInviteInput) => {
    const { interestId } = data;

    const invite = await InterestInviteRepository.findOne({
        where: { invitedUserId: userId, interestId },
        relations: ["interest"],
    });

    if (!invite) throw new NotFoundError("Invite not found for this user.");

    // Prevent re-accept or accept after decline/suggest
    if (
        [InviteStatus.ACCEPTED, InviteStatus.DECLINED, InviteStatus.SUGGESTED_NEW_TIME].includes(invite.status)
    ) {
        throw new Error(`You cannot accept an invite that is already ${invite.status.toLowerCase()}.`);
    }

    invite.status = InviteStatus.ACCEPTED;
    invite.respondedAt = new Date();
    await InterestInviteRepository.save(invite);

    // Notify the creator
    const interest = invite.interest;
    if (interest) {
        const creator = await UserRepository.findOne({ where: { id: interest.userId } });
        const accepter = await UserRepository.findOne({ where: { id: userId } });

        if (creator && accepter) {
            await sendNotification({
                senderId: accepter.id,
                receiverId: creator.id,
                notificationCode: NotificationStatusCode.INTEREST_ACCEPTED,
                type: NotificationTypeEnums.INTEREST_ACCEPTED,
                title: "Invite Accepted",
                body: `${accepter.fullName || ""} accepted your interest invite.`,
                restaurantName: accepter.fullName || "",
                profilePicture: accepter.profileImageUrl || "",
                fcmToken: creator.deviceId,
                extraPayload: {
                    interestId: String(interest.id),
                },
            });
        }
    }

    // Check if all invites are accepted
    const allInvites = await InterestInviteRepository.find({ where: { interestId } });
    const allAccepted = allInvites.every((i: any) => i.status === InviteStatus.ACCEPTED);

    if (allAccepted && invite.interest) {
        invite.interest.status = "Confirmed";
        await InterestRepository.save(invite.interest);

        // Notify all participants that interest is confirmed
        const participants = await InterestInviteRepository.find({
            where: { interestId },
            relations: ["invitedUser"],
        });

        await Promise.all(
            participants.map((participant: any) => {
                const user = participant.invitedUser;
                if (!user) return null;

                return sendNotification({
                    senderId: invite.interest!.userId,
                    receiverId: user.id,
                    notificationCode: NotificationStatusCode.INTEREST_CONFIRMED,
                    type: NotificationTypeEnums.INTEREST_CONFIRMED,
                    title: "Interest Confirmed",
                    body: "All users have accepted. Your interest is now confirmed!",
                    restaurantName: invite.interest!.type || "",
                    profilePicture: "",
                    fcmToken: user.deviceId,
                    extraPayload: {
                        interestId: String(interestId),
                    },
                });
            })
        );
    }

    return invite;
};

export const declineInterestInvite = async (userId: number, data: DeclineInterestInviteInput) => {
    const { interestId, reason } = data;

    // Always check main Interest first
    const interest = await InterestRepository.findOne({
        where: { id: interestId },
        relations: ["user"], // to get creator easily
    });

    if (!interest) throw new NotFoundError("Interest not found.");

    // Then find user's invite
    const invite = await InterestInviteRepository.findOne({
        where: { invitedUserId: userId, interestId },
    });

    // Allow creator themselves to decline/cancel interest directly
    const isCreatorDeclining = interest.userId === userId;

    if (!invite && !isCreatorDeclining) {
        throw new NotFoundError("Invite not found for this user.");
    }

    // If creator declines → close interest
    if (isCreatorDeclining) {
        interest.status = InterestStatus.DECLINED;
        await InterestRepository.save(interest);

        // Notify all participants that creator cancelled
        const participants = await InterestInviteRepository.find({
            where: { interestId },
            relations: ["invitedUser"],
        });

        await Promise.all(
            participants.map((participant: any) =>
                participant.invitedUser
                    ? sendNotification({
                        senderId: userId,
                        receiverId: participant.invitedUser.id,
                        notificationCode: NotificationStatusCode.INTEREST_DECLINED,
                        type: NotificationTypeEnums.INTEREST_DECLINED,
                        title: "Interest Cancelled",
                        body: "The creator has cancelled this interest.",
                        fcmToken: participant.invitedUser.deviceId,
                        extraPayload: { interestId: String(interestId) },
                    })
                    : null
            )
        );

        return { message: "Interest cancelled by creator.", interest };
    }

    // Invited user declines
    if ([InviteStatus.DECLINED, InviteStatus.ACCEPTED].includes(invite.status)) {
        throw new BadRequestError(
            `You cannot decline an invite that is already ${invite.status.toLowerCase()}.`
        );
    }

    invite.status = InviteStatus.DECLINED;
    invite.declineReason = reason ?? null;
    invite.respondedAt = new Date();
    await InterestInviteRepository.save(invite);

    // Notify creator
    const creator = await UserRepository.findOne({ where: { id: interest.userId } });
    const decliner = await UserRepository.findOne({ where: { id: userId } });

    if (creator && decliner) {
        await sendNotification({
            senderId: decliner.id,
            receiverId: creator.id,
            notificationCode: NotificationStatusCode.INTEREST_DECLINED,
            type: NotificationTypeEnums.INTEREST_DECLINED,
            title: "Invite Declined",
            body: `${decliner.fullName || ""} declined your interest invite.`,
            restaurantName: decliner.fullName || "",
            profilePicture: decliner.profileImageUrl || "",
            fcmToken: creator.deviceId,
            extraPayload: { interestId: String(interestId) },
        });
    }

    // Check if all invites are declined
    const allInvites = await InterestInviteRepository.find({ where: { interestId } });
    const multipleInvitesExist = allInvites.length > 1;
    const allDeclined =
        multipleInvitesExist && allInvites.every((i: any) => i.status === InviteStatus.DECLINED);

    if (allDeclined) {
        interest.status = InterestStatus.DECLINED;
        await InterestRepository.save(interest);

        // Notify all participants + creator
        const participants = await InterestInviteRepository.find({
            where: { interestId },
            relations: ["invitedUser"],
        });

        await Promise.all(
            participants.map((participant: any) =>
                participant.invitedUser
                    ? sendNotification({
                        senderId: interest.userId,
                        receiverId: participant.invitedUser.id,
                        notificationCode: NotificationStatusCode.INTEREST_DECLINED,
                        type: NotificationTypeEnums.INTEREST_DECLINED,
                        title: "Interest Declined",
                        body: "All users have declined. This interest has been closed.",
                        fcmToken: participant.invitedUser.deviceId,
                        extraPayload: { interestId: String(interestId) },
                    })
                    : null
            )
        );

        if (creator?.deviceId) {
            await sendNotification({
                senderId: interest.userId,
                receiverId: creator.id,
                notificationCode: NotificationStatusCode.INTEREST_DECLINED,
                type: NotificationTypeEnums.INTEREST_DECLINED,
                title: "Interest Declined",
                body: "All users have declined. Your interest is now closed.",
                fcmToken: creator.deviceId,
                extraPayload: { interestId: String(interestId) },
            });
        }
    }

    return { interest, invite };
};

export const suggestNewTime = async (userId: number, data: SuggestNewTimeInput) => {
    const { interestId, slotId, suggestedTime, message } = data;

    if (!interestId || !userId) {
        throw new BadRequestError("Invalid input: interestId and userId are required.");
    }

    const invite = await InterestInviteRepository.findOne({
        where: { invitedUserId: userId, interestId },
        relations: ["interest", "interest.producer"],
    });

    if (!invite) throw new NotFoundError("Invite not found for this user.");

    const interest = invite.interest;
    if (!interest || !interest.producerId)
        throw new BadRequestError("This interest is not linked to a valid producer.");

    // Prevent suggesting new time after accept or decline
    if ([InviteStatus.ACCEPTED, InviteStatus.DECLINED].includes(invite.status)) {
        throw new BadRequestError(
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
            throw new BadRequestError("Invalid slot: slot does not belong to this producer.");
    }

    invite.status = InviteStatus.SUGGESTED_NEW_TIME;
    invite.suggestedSlotId = selectedSlot ? selectedSlot.id : null;
    invite.suggestedTime = suggestedTime ? new Date(suggestedTime) : null;
    invite.suggestedMessage = message ?? null;
    invite.respondedAt = new Date();
    await InterestInviteRepository.save(invite);

    // Notify the creator
    const creator = await UserRepository.findOne({ where: { id: interest.userId } });
    const suggester = await UserRepository.findOne({ where: { id: userId } });

    if (creator && suggester) {
        const readableTime = suggestedTime
            ? new Date(suggestedTime).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
            })
            : "a new slot";

        await sendNotification({
            senderId: suggester.id,
            receiverId: creator.id,
            notificationCode: NotificationStatusCode.INTEREST_SUGGESTED_NEW_TIME,
            type: NotificationTypeEnums.INTEREST_SUGGESTED_NEW_TIME,
            title: "New Time Suggested",
            body: `${suggester.fullName || ""} suggested ${readableTime} for your interest.`,
            restaurantName: suggester.fullName || "",
            profilePicture: suggester.profileImageUrl || "",
            fcmToken: creator.deviceId,
            extraPayload: {
                interestId: String(interest.id),
                suggestedTime: suggestedTime ? String(suggestedTime) : "",
            },
        });
    }

    return invite;
};

export const getUserInterests = async (userId: number) => {
    const interests = await InterestRepository.find({
        where: { userId },
        relations: [
            "producer",
            "event",
            "slot",
            "invites",
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

export const editInterestSlot = async (userId: number, data: EditSlotInput) => {
    const { newSlotId, message, interestId } = data;

    return await PostgresDataSource.transaction(async (manager: any) => {
        const interest = await manager.findOne(InterestRepository.target, { where: { id: interestId } });
        if (!interest) throw new NotFoundError("Interest not found");

        if (interest.userId !== userId)
            throw new ForbiddenError("You are not authorized to update this interest");

        const slot = await manager.findOne(SlotRepository.target, { where: { id: newSlotId } });
        if (!slot) throw new NotFoundError("Selected slot not found");

        // Check if selected slot already has an active booking
        const existingBooking = await manager.findOne(BookingRepository.target, {
            where: {
                day: slot.day,
                slotStartTime: slot.startTime,
                slotEndTime: slot.endTime,
                status: BookingStatusEnums.SCHEDULED,
            },
        });

        if (existingBooking) {
            throw new BadRequestError("Selected slot is already booked");
        }

        // Free previous slot booking (if any)
        if (interest.slotId) {
            const oldSlot = await manager.findOne(SlotRepository.target, { where: { id: interest.slotId } });
            if (oldSlot) {
                // Cancel any booking matching the old slot timing
                await manager
                    .createQueryBuilder()
                    .update(BookingRepository.target)
                    .set({ status: BookingStatusEnums.CANCEL })
                    .where("day = :day", { day: oldSlot.day })
                    .andWhere("slotStartTime = :startTime", { startTime: oldSlot.startTime })
                    .andWhere("slotEndTime = :endTime", { endTime: oldSlot.endTime })
                    .execute();
            }
        }

        // Update interest record
        interest.slotId = slot.id;
        interest.suggestedTime = null;
        interest.message = message ?? interest.message;
        await manager.save(InterestRepository.target, interest);

        // Reset invites
        await manager.update(
            InterestInviteRepository.target,
            { interestId: interest.id },
            {
                status: "Pending",
                suggestedSlotId: null,
                suggestedTime: null,
                suggestedMessage: null,
            }
        );

        return {
            interestId: interest.id,
            newSlot: {
                id: slot.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
            },
            message: interest.message,
            status: "UPDATED_BY_CREATOR",
        };
    });
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
