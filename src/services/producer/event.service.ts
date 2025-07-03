import {
    EventRepository,
    ProducerRepository,
} from '../../repositories';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { In, LessThan, MoreThan, Not } from 'typeorm';
import { CreateEventInput } from '../../validators/producer/event.validation';

export const createEvent = async (userId: number, data: CreateEventInput) => {
    const producer = await ProducerRepository.findOne({
        where: { userId },
    });

    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    const newEvent = EventRepository.create({
        ...data,
        producer,
        isActive: true,
        isDeleted: false,
    });

    await EventRepository.save(newEvent);

    return {
        message: 'Event created successfully.',
        eventId: newEvent.id,
    };
};

export const getAllEvents = async (userId: number) => {
    const producer = await ProducerRepository.findOne({
        where: { userId },
        relations: ['events'],
        
    });

    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    return producer.events.filter((event: { isDeleted: any; }) => !event.isDeleted);
};

export const getEventById = async (userId: number, eventId: number) => {
    const producer = await ProducerRepository.findOne({
        where: { userId },
        relations: ['events'],
    });

    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    const event = producer.events.find((event: { id: number; isDeleted: any; }) => event.id === eventId && !event.isDeleted);

    if (!event) {
        throw new NotFoundError('Event not found');
    }

    return event;
};


export const updateEvent = async (userId: number, eventId: number, data: Partial<CreateEventInput>) => {
    const producer = await ProducerRepository.findOne({
        where: { userId },
        relations: ['events'],
    });

    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    const event = producer.events.find((event: { id: number; isDeleted: any; }) => event.id === eventId && !event.isDeleted);

    if (!event) {
        throw new NotFoundError('Event not found');
    }

    Object.assign(event, data);
    await EventRepository.save(event);

    return {
        message: 'Event updated successfully.',
        eventId: event.id,
    };
};

export const deleteEvent = async (userId: number, eventId: number) => {
    const producer = await ProducerRepository.findOne({
        where: { userId },
        relations: ['events'],
    });

    if (!producer) {
        throw new NotFoundError('Producer not found');
    }

    const event = producer.events.find((event: { id: number; isDeleted: any; }) => event.id === eventId && !event.isDeleted);

    if (!event) {
        throw new NotFoundError('Event not found');
    }

    event.isDeleted = true;
    await EventRepository.save(event);

    return {
        message: 'Event deleted successfully.',
        eventId: event.id,
    };
};

export * as EventService from './event.service';