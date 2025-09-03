import {
    EventBookingRepository,
    EventRepository,
    EventTypeRepository,
    LeisureRepository,
    ProducerRepository,
    UserRepository,
} from '../../repositories';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { CreateEventInput, GetAllEventsInput } from '../../validators/producer/event.validation';
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

export const getMyEvents = async (userId: number, status?: EventStatus) => {
    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) throw new NotFoundError("Producer not found");

    const whereClause: any = { producer: { id: producer.id } };
    if (status) whereClause.status = status;

    return EventRepository.find({
        where: whereClause,
        relations: ["producer", "leisure", "eventType"],
    });
};

export const getAllEvents = async ({ status, category, type, lat, lng, radius }: GetAllEventsInput) => {
    const qb = EventRepository.createQueryBuilder("event")
        .leftJoinAndSelect("event.producer", "producer")
        .leftJoinAndSelect("event.leisure", "leisure");

    if (status) {
        qb.andWhere("event.status = :status", { status });
    }

    if (category) {
        qb.andWhere("event.category = :category", { category });
    }

    if (lat && lng && radius) {
        qb.andWhere("event.latitude IS NOT NULL AND event.longitude IS NOT NULL");
        qb.andWhere(
            `
      (
        6371 * acos(
          cos(radians(:lat)) * cos(radians(event.latitude)) *
          cos(radians(event.longitude) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(event.latitude))
        )
      ) <= :radius
    `,
            { lat, lng, radius }
        );
    }

    if (type) {
        qb.andWhere("event.serviceType = :type", { type });
    }

    return qb.getMany();
};

export const getEventById = async (userId: number, eventId: number) => {

    const user = await UserRepository.findOne({
        where: { id: userId, isDeleted: false },
        relations: ["role"],
    });
    if (!user) throw new NotFoundError("User not found");

    let event;

    // 2. If normal user → see any public active event
    if (user.role.name === "user") {
        event = await EventRepository.findOne({
            where: { id: eventId },
            relations: ["producer", "leisure", "eventType"],
        });
    }
    // 3. If producer → only their own event
    else if (["restaurant", "leisure"].includes(user.role.name)) {
        const producer = await ProducerRepository.findOne({ where: { userId } });
        if (!producer) throw new NotFoundError("Producer not found");

        event = await EventRepository.findOne({
            where: { id: eventId, producer: { id: producer.id } },
            relations: ["producer", "leisure", "eventType"],
        });
    }

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