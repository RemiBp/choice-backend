import {
    EventBookingRepository,
    EventRepository,
    EventTypeRepository,
    LeisureRepository,
    ProducerRepository,
} from '../../repositories';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { CreateEventInput } from '../../validators/producer/event.validation';
import { EventStatus } from '../../enums/eventStatus.enum';

export const getEventTypes = async () => {
    const eventTypes = await EventTypeRepository.find({
        order: { name: "ASC" },
    });
    return eventTypes;
};

export const createEvent = async (userId: number, data: CreateEventInput) => {
    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) {
        throw new NotFoundError("Producer not found");
    }

    if (producer.type !== "leisure" && producer.type !== "restaurant") {
        throw new BadRequestError("Only leisure and restaurant producers can create events");
    }

    let leisureId: number | null = null;
    let eventTypeId: number | null = null;

    if (producer.type === "leisure") {
        if (!data.eventTypeId) {
            throw new BadRequestError("Event type is required for Leisure events");
        }

        const leisure = await LeisureRepository.findOne({
            where: { producerId: producer.id },
        });
        if (!leisure) {
            throw new NotFoundError("Leisure record not found for this producer");
        }
        leisureId = leisure.id;

        const eventType = await EventTypeRepository.findOne({
            where: { id: data.eventTypeId },
        });
        if (!eventType) {
            throw new NotFoundError("Invalid Event Type provided");
        }
        eventTypeId = eventType.id;
    }

    const newEvent = await EventRepository.save({
        ...data,
        producer: { id: producer.id },
        leisure: leisureId ? { id: leisureId } : null,
        eventType: eventTypeId ? { id: eventTypeId } : null,
    });

    return newEvent;
};

export const getAllEvents = async (userId: number, status?: EventStatus) => {
    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) throw new NotFoundError("Producer not found");

    const whereClause: any = {
        producer: { id: producer.id },
    };

    if (status) whereClause.status = status;

    return EventRepository.find({
        where: whereClause,
        relations: ["producer", "leisure", "eventType"],
    });
};

export const getEventById = async (userId: number, eventId: number) => {
    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) throw new NotFoundError("Producer not found");

    const event = await EventRepository.findOne({
        where: { id: eventId, producer: { id: producer.id }, isDeleted: false },
        relations: ["producer", "leisure", "eventType"],
    });

    if (!event) throw new NotFoundError("Event not found");

    const { total } = await EventBookingRepository
        .createQueryBuilder("booking")
        .select("SUM(booking.numberOfPersons)", "total")
        .where("booking.eventId = :eventId AND booking.isCancelled = false", { eventId })
        .getRawOne();

    return {
        ...event,
        totalParticipants: Number(total) || 0,
    };
};

export const updateEvent = async (userId: number, eventId: number, data: Partial<CreateEventInput>) => {
    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) {
        throw new NotFoundError("Producer not found");
    }

    const event = await EventRepository.findOne({
        where: {
            id: eventId,
            producer: { id: producer.id },
        },
        relations: ["producer"],
    });

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    Object.assign(event, data);

    await EventRepository.save(event);

    return event;
};

export const deleteEvent = async (userId: number, eventId: number) => {

    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) {
        throw new NotFoundError("Producer not found");
    }

    const event = await EventRepository.findOne({
        where: {
            id: eventId,
            producer: { id: producer.id },
        },
        relations: ["producer"],
    });

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    await EventRepository.remove(event);

    return {
        success: true,
        eventId: event.id,
    };
};

export * as EventService from './event.service';