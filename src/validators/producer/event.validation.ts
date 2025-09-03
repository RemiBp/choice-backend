import { z } from 'zod';
import { ServiceType } from '../../enums/serviceType.enum';
import { EventStatus } from '../../enums/eventStatus.enum';

export const createEventSchema = z.object({
    eventTypeId: z.number().optional(),
    title: z.string().min(3, "Event title is required"),
    description: z.string().optional(),
    venueName: z.string().optional(),
    serviceType: z.nativeEnum(ServiceType, {
        required_error: "Experience type is required",
    }),
    location: z.string().min(3, "Location is required"),
    latitude: z
        .number()
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90")
        .optional(),
    longitude: z
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180")
        .optional(),
    pricePerGuest: z.number().min(0),
    maxCapacity: z.number().int().positive(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    eventImages: z.array(z.string()).max(9, "Max 9 images allowed").optional(),
    status: z.nativeEnum(EventStatus, {
        required_error: "Event status is required",
    }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
    title: z.string().min(3, 'Event title is required').optional(),
    description: z.string().optional(),
    experienceType: z.string().min(1, 'Experience type is required').optional(),
    location: z.string().min(3, 'Location is required').optional(),
    pricePerGuest: z.number().min(0).optional(),
    maxCapacity: z.number().int().positive().optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    eventImages: z.array(z.string()).max(9, 'Max 9 images allowed').optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const getEventByIdSchema = z.object({
    eventId: z.number().int().positive(),
});
export type GetEventByIdInput = z.infer<typeof getEventByIdSchema>;

export const deleteEventSchema = z.object({
    eventId: z.number().int().positive(),
});

export type DeleteEventInput = z.infer<typeof deleteEventSchema>;

export const GetAllEventsSchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  type: z.nativeEnum(ServiceType).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().optional(),
});

export type GetAllEventsInput = z.infer<typeof GetAllEventsSchema>;