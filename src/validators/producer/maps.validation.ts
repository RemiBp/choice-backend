import { z } from 'zod';

const csv = z
    .string()
    .transform((s) => s.split(",").map(v => v.trim()).filter(Boolean));

export const NearbyProducersSchema = z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    radius: z.coerce.number().default(5), // km
    type: z.enum(["restaurant", "leisure", "wellness"]).optional(),
    sort: z.enum(["distance", "rating"]).default("distance"),
    limit: z.coerce.number().default(30),
    page: z.coerce.number().default(1),
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
});


export type createOfferInput = z.infer<typeof createOfferSchema>;