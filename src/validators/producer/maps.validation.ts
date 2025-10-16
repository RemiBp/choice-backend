import { z } from 'zod';
import { DayOfWeekEnum, TimeOfDayEnum } from '../../enums/OfferEnums';
import { ProducerType, SortOption } from '../../enums/ProducerType.enum';

const csv = z
    .string()
    .transform((s) => s.split(",").map(v => v.trim()).filter(Boolean));

// src/validators/maps.ts
export const NearbyProducersSchema = z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    radius: z.coerce.number().default(5),
    type: z.nativeEnum(ProducerType).optional(),
    sort: z.nativeEnum(SortOption).default(SortOption.DISTANCE),
    limit: z.coerce.number().default(30),
    page: z.coerce.number().default(1),

    // Restaurant filters
    cuisine: z.string().optional(),
    dishName: z.string().optional(),
    minAmbiance: z.coerce.number().optional(),
    minService: z.coerce.number().optional(),
    minPortions: z.coerce.number().optional(),
    minPlace: z.coerce.number().optional(),
    minDishRating: z.coerce.number().optional(),

    // Leisure filters
    venue: z.string().optional(),
    event: z.string().optional(),
    // emotionalImpact: z.array(z.string()).optional(),

    minStageDirection: z.coerce.number().optional(),
    minActorPerformance: z.coerce.number().optional(),
    minTextQuality: z.coerce.number().optional(),
    minScenography: z.coerce.number().optional(),

    // Wellness filters
    minCareQuality: z.coerce.number().optional(),
    minCleanliness: z.coerce.number().optional(),
    minWelcome: z.coerce.number().optional(),
    minValueForMoney: z.coerce.number().optional(),
    minAtmosphere: z.coerce.number().optional(),
    minStaffExperience: z.coerce.number().optional(),
    minAverageScore: z.coerce.number().optional(),
});

export type NearbyProducersInput = z.infer<typeof NearbyProducersSchema>;

export const getFilteredRestaurantsSchema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    radiusKm: z.coerce.number().default(20),
    cuisine: z.string().optional(),
    ambianceMin: z.coerce.number().min(1).max(5).optional(),
    serviceMin: z.coerce.number().min(1).max(5).optional(),
    portionsMin: z.coerce.number().min(1).max(5).optional(),
    placeMin: z.coerce.number().min(1).max(5).optional(),
    limit: z.coerce.number().default(30),
    offset: z.coerce.number().default(0),
});

export type GetFilteredRestaurantsInput = z.infer<typeof getFilteredRestaurantsSchema>;

export const ChoiceMapSchema = z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(0.1).max(100).default(5),
});

export type ChoiceMapInput = z.infer<typeof ChoiceMapSchema>;

export const createOfferSchema = z.object({
    producerId: z.number(),
    title: z.string().min(1),
    message: z.string().min(1),
    discountPercent: z.number().min(0).max(100),
    validityMinutes: z.number().min(1),
    maxRecipients: z.number().min(1),
    radiusMeters: z.number().min(1),
    imageUrl: z.string().url().optional(),
    scheduledAt: z.union([z.string().datetime(), z.date()]).optional(),
    timeOfDay: z.nativeEnum(TimeOfDayEnum).default(TimeOfDayEnum.ALL_DAY),
    daysOfWeek: z
        .array(z.nativeEnum(DayOfWeekEnum))
        .default([DayOfWeekEnum.EVERYDAY]),
    saveAsTemplate: z.boolean()
});

export type createOfferInput = z.infer<typeof createOfferSchema>;

export const GetProducerOffersSchema = z.object({
    params: z.object({
        producerId: z
            .string()
            .regex(/^\d+$/, "producerId must be a valid numeric string")
            .transform(Number),
    }),
});

export type GetProducerOffersInput = z.infer<typeof GetProducerOffersSchema>;

export const GetProducerHeatmapSchema = z.object({
    producerId: z.number().int().positive({ message: "producerId must be a positive integer" }),
});

export type GetProducerHeatmapInput = z.infer<typeof GetProducerHeatmapSchema>;

export const SendOfferNotificationSchema = z.object({
    offerId: z.number().int().positive({ message: "offerId must be a positive integer" }),
    latitude: z.number({ message: "latitude is required" }),
    longitude: z.number({ message: "longitude is required" }),
});

export type SendOfferNotificationInput = z.infer<typeof SendOfferNotificationSchema>;