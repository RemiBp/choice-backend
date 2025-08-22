import { z } from 'zod';

const csv = z
    .string()
    .transform((s) => s.split(",").map(v => v.trim()).filter(Boolean));

export const NearbyProducersSchema = z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    radius: z.coerce.number().default(5), // km
    type: z.enum(["restaurant", "leisure", "wellness"]),
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
    userId: z.coerce.number(), // needed if friendsOnly = true
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    radius: z.coerce.number().default(5),
    ratingMin: z.coerce.number().min(1).max(5).optional(),
    friendsOnly: z.coerce.boolean().default(false), // switch between global & friends
    limit: z.coerce.number().default(30),
    page: z.coerce.number().default(1),
});

export type ChoiceMapInput = z.infer<typeof ChoiceMapSchema>;