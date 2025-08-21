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
        throw new NotFoundError('Producer not found');
    }

    if (producer.type !== 'leisure') {
        throw new BadRequestError('Only leisure producers can create events');
    }

    const leisure = await LeisureRepository.findOne({
        where: { producerId: producer.id },
    });
    if (!leisure) {
        throw new NotFoundError('Leisure record not found for this producer');
    }

    if (!data.eventTypeId) {
        throw new BadRequestError('Event type is required');
    }

    const eventType = await EventTypeRepository.findOne({
        where: { id: data.eventTypeId },
    });
    if (!eventType) {
        throw new NotFoundError('Invalid Event Type provided');
    }

    const newEvent = await EventRepository.save({
        ...data,
        producerId: producer.id,
        leisureId: leisure.id,
        eventTypeId: eventType.id,
        isActive: true,
        isDeleted: false,
    });

    return {
        message: 'Event created successfully.',
        event: newEvent,
    };
};

export const getAllEvents = async (userId: number, status?: EventStatus) => {
    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    const leisure = await LeisureRepository.findOne({ where: { producerId: producer.id } });
    if (!leisure) {
        throw new NotFoundError('Leisure profile not found for this producer');
    }

    if (status && !Object.values(EventStatus).includes(status)) {
        throw new BadRequestError('Invalid event status');
    }

    const events = await EventRepository.find({
        where: {
            leisureId: leisure.id,
            isDeleted: false,
            ...(status ? { status } : {}),
        },
        relations: ['leisure'],
    });

    return events;
};

export const getEventById = async (userId: number, eventId: number) => {
    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    const leisure = await LeisureRepository.findOne({ where: { producerId: producer.id } });
    if (!leisure) {
        throw new NotFoundError('Leisure profile not found for this producer');
    }

    const event = await EventRepository.findOne({
        where: { id: eventId, leisureId: leisure.id, isDeleted: false },
        relations: ['leisure'],
    });

    if (!event) {
        throw new NotFoundError('Event not found');
    }

    const totalParticipantsResult = await EventBookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.numberOfPersons)', 'total')
        .where('booking.eventId = :eventId AND booking.isCancelled = false', { eventId })
        .getRawOne();

    const totalParticipants = Number(totalParticipantsResult.total) || 0;

    return {
        ...event,
        totalParticipants,
    };
};

export const updateEvent = async (userId: number, eventId: number, data: Partial<CreateEventInput>) => {
    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    const leisure = await LeisureRepository.findOne({ where: { producerId: producer.id } });
    if (!leisure) {
        throw new NotFoundError('Leisure profile not found for this producer');
    }

    const event = await EventRepository.findOne({
        where: { id: eventId, leisureId: leisure.id, isDeleted: false },
    });
    if (!event) {
        throw new NotFoundError('Event not found');
    }

    Object.assign(event, data);

    await EventRepository.save(event);

    return {
        message: 'Event updated successfully.',
        eventId: event,
    };
};

export const deleteEvent = async (userId: number, eventId: number) => {

    const producer = await ProducerRepository.findOne({ where: { userId } });
    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    const leisure = await LeisureRepository.findOne({ where: { producerId: producer.id } });
    if (!leisure) {
        throw new NotFoundError('Leisure profile not found for this producer');
    }

    const event = await EventRepository.findOne({
        where: { id: eventId, leisureId: leisure.id, isDeleted: false },
    });

    if (!event) {
        throw new NotFoundError('Event not found');
    }

    event.isDeleted = true;
    await EventRepository.save(event);

    return {
        message: 'Event deleted successfully.',
    };
};

export * as EventService from './event.service';