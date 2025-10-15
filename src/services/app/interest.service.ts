import { InterestType } from "../../enums/interestStatus.enum";
import { NotFoundError } from "../../errors/notFound.error";
import {
    EventRepository,
    InterestInviteRepository,
    InterestRepository,
    ProducerRepository,
} from "../../repositories";
import { CreateInterestInput } from "../../validators/app/interest.validation";

export const createInterest = async (userId: number, data: CreateInterestInput) => {
    try {
        const { type, producerId, eventId, suggestedTime, message, invitedUserIds } = data;

        let producer = null;
        let event = null;

        if (type === InterestType.PRODUCER) {
            if (!producerId) throw new Error("producerId is required for Producer type");
            producer = await ProducerRepository.findOne({ where: { id: producerId } });
            if (!producer) throw new NotFoundError("Producer not found");
        }

        if (type === InterestType.EVENT) {
            if (!eventId) throw new Error("eventId is required for Event type");
            event = await EventRepository.findOne({ where: { id: eventId } });
            if (!event) throw new NotFoundError("Event not found");
        }

        const interest = InterestRepository.create({
            userId,
            producerId: producer?.id || null,
            eventId: event?.id || null,
            suggestedTime: type === InterestType.PRODUCER ? suggestedTime || null : null,
            message: message || null,
            type,
        });

        const savedInterest = await InterestRepository.save(interest);

        if (invitedUserIds && invitedUserIds.length > 0) {
            for (const invitedUserId of invitedUserIds) {
                await InterestInviteRepository.save({
                    interestId: savedInterest.id,
                    invitedUserId,
                });
            }
        }

        return savedInterest;
    } catch (error) {
        throw error;
    }
};


export * as InterestService from "./interest.service";
