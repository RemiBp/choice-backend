import { NextFunction, Request, Response } from 'express';
import { createEventSchema } from '../../validators/producer/event.validation';
import { EventService } from '../../services/producer/event.service';
import { EventStatus } from '../../enums/eventStatus.enum';
import { sendApiResponse } from '../../utils/sendApiResponse';

export const getEventTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventTypes = await EventService.getEventTypes();
        return sendApiResponse(res, 200, "Event types fetched successfully", eventTypes);
    } catch (error) {
        next(error);
    }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const eventData = createEventSchema.parse(req.body);

        const result = await EventService.createEvent(userId, eventData);
        return sendApiResponse(res, 200, "Event created successfully", result);
    } catch (error) {
        next(error);
    }
};

export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const status = req.query.status as EventStatus | undefined;

        const events = await EventService.getAllEvents(userId, status);
        return sendApiResponse(res, 200, "Events fetched successfully", events);
    } catch (error) {
        next(error);
    }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const eventId = Number(req.params.eventId);

        const event = await EventService.getEventById(userId, eventId);
        return sendApiResponse(res, 200, "Event fetched successfully", event);
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const eventId = Number(req.params.eventId);

        const eventData = createEventSchema.partial().parse(req.body);

        const result = await EventService.updateEvent(userId, eventId, eventData);
        return sendApiResponse(res, 200, "Event updated successfully", result);
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const eventId = Number(req.params.eventId);

        const result = await EventService.deleteEvent(userId, eventId);
        return sendApiResponse(res, 200, "Event Deleted successfully", result);
    } catch (error) {
        next(error);
    }
};

export * as EventController from './event.controller';