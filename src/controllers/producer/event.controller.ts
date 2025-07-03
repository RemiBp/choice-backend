import { NextFunction, Request, Response } from 'express';
import { createEventSchema } from '../../validators/producer/event.validation';
import { EventService } from '../../services/producer/event.service';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error('userId is required');
        }
        const eventData = createEventSchema.parse(req.body);

        const result = await EventService.createEvent(userId, eventData);

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error('userId is required');
        }

        const events = await EventService.getAllEvents(userId);

        res.status(200).json(events);
    } catch (error) {
        next(error);
    }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error('userId is required');
        }
        const eventId = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw new Error('Invalid event ID');
        }

        const event = await EventService.getEventById(userId, eventId);

        res.status(200).json(event);
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error('userId is required');
        }
        const eventId = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw new Error('Invalid event ID');
        }

        const eventData = createEventSchema.partial().parse(req.body);

        const result = await EventService.updateEvent(userId, eventId, eventData);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error('userId is required');
        }
        const eventId = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw new Error('Invalid event ID');
        }

        const result = await EventService.deleteEvent(userId, eventId);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export * as EventController from './event.controller';