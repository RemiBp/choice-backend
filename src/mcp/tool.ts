import { tool } from "@openai/agents";
import { z } from "zod";
import { getNearbyProducers } from "../services/producer/maps.service";
import { ProducerType, SortOption } from "../enums/ProducerType.enum";
import { ProducerInsightsService } from "../services/producer/insights.service";

const hasNumber = (v: unknown) => typeof v === "number" && Number.isFinite(v);

// User side Tools
export const findNearbyRestaurants = tool({
    name: "find_nearby_restaurants",
    description: "Find nearby restaurants based on user's location.",
    parameters: z.object({
        latitude: z.number(),
        longitude: z.number(),
        radius_km: z.number().default(10),
    }),
    async execute({ latitude, longitude, radius_km }) {
        if (!hasNumber(latitude) || !hasNumber(longitude)) {
            return { message: "Location (latitude, longitude) is required.", data: null };
        }

        const data = await getNearbyProducers(0, {
            latitude,
            longitude,
            radius: radius_km,
            type: ProducerType.RESTAURANT,
            sort: SortOption.DISTANCE,
            limit: 20,
            page: 1,
        });

        return { message: "Nearby restaurants", data };
    },
});

export const findTopRatedNearby = tool({
    name: "find_top_rated_nearby",
    description: "Top-rated restaurants and wellness services near the user's location, sorted by rating.",
    parameters: z.object({
        latitude: z.number().describe("Latitude of user's location"),
        longitude: z.number().describe("Longitude of user's location"),
        radius_km: z.number().default(10).describe("Search radius in kilometers"),
    }),
    async execute({ latitude, longitude, radius_km }) {
        if (!hasNumber(latitude) || !hasNumber(longitude)) {
            return { message: "Location (latitude, longitude) is required.", data: null };
        }

        const restaurants = await getNearbyProducers(0, {
            latitude,
            longitude,
            radius: radius_km,
            type: ProducerType.RESTAURANT,
            sort: SortOption.RATING,
            minAverageScore: 4,
            limit: 10,
            page: 1,
        });

        const wellness = await getNearbyProducers(0, {
            latitude,
            longitude,
            radius: radius_km,
            type: ProducerType.WELLNESS,
            sort: SortOption.RATING,
            minCareQuality: 4,
            minCleanliness: 5,
            minWelcome: 4,
            minValueForMoney: 3,
            minAtmosphere: 4,
            minStaffExperience: 4,
            minAverageScore: 4,
            limit: 10,
            page: 1,
        });

        return { message: "Top-rated restaurants and wellness services near you.", data: { restaurants, wellness } };
    },
});

export const findRestaurantPosts = tool({
    name: "find_restaurant_posts",
    description: "Fetch all posts made by a specific restaurant.",
    parameters: z.object({
        restaurantName: z.string().describe("The name of the restaurant."),
        limit: z.number().optional().default(10),
        page: z.number().optional().default(1),
    }),
    execute: async ({ restaurantName, page, limit }) => {
        const result = await ProducerInsightsService.getPostsByRestaurant(restaurantName, page, limit);
        return { message: result.message, data: result.data };
    },
});

export const friendsPostsThisWeek = tool({
    name: "friends_posts_this_week",
    description: "Find which of the user's friends have made a choice post this week.",
    parameters: z.object({
        userId: z.number().describe("The ID of the user making the query"),
    }),
    execute: async ({ userId }) => {
        const result = await ProducerInsightsService.getFriendsWhoPostedThisWeek(userId);
        return { message: result.message, data: result.data };
    },
});

export const findMostVisitedRestaurants = tool({
    name: "find_most_visited_restaurants",
    description:
        "Find the most visited restaurants based on how many people made Choice posts there.",
    parameters: z.object({
        limit: z.number().default(10).describe("Maximum number of restaurants to return"),
    }),
    async execute({ limit }) {
        const result = await ProducerInsightsService.getMostVisitedRestaurants(limit);
        return result;
    },
});

export const checkRestaurantAvailability = tool({
    name: "check_restaurant_availability",
    description: "Check available slots for a specific restaurant name.",
    parameters: z.object({
        restaurant_name: z
            .string()
            .min(1, "Restaurant name is required")
            .describe("The name of the restaurant whose availability should be checked."),
    }),
    async execute({ restaurant_name }) {
        try {
            const result = await ProducerInsightsService.getProducerAvailabilityByName(restaurant_name);

            return {
                message: result.message,
                data: result.data,
            };
        } catch (error: any) {
            console.error("Error in check_restaurant_availability:", error);
            return {
                message: `Failed to check availability for '${restaurant_name}'.`,
                data: null,
            };
        }
    },
});

export const findOpenWellnessStudios = tool({
    name: "find_open_wellness_studios",
    description: "List all wellness studios that are currently open (based on UTC time).",
    parameters: z.object({}), // no parameters needed
    async execute() {
        try {
            const result = await ProducerInsightsService.getOpenWellnessStudios();

            return {
                message: result.message,
                data: result.data,
            };
        } catch (error: any) {
            console.error("Error in find_open_wellness_studios:", error);
            return {
                message: "Failed to fetch open wellness studios.",
                data: null,
            };
        }
    },
});

// Producer side Tools
export const getMostEngagedItems = tool({
    name: "get_most_engaged_items",
    description: "Find which dishes, activities, or services have the highest engagement (likes, bookings, or posts).",
    parameters: z.object({
        producerId: z.number().describe("Producer ID whose items to analyze."),
    }),
    async execute({ producerId }) {
        return await ProducerInsightsService.getMostEngagedItems(producerId);
    },
});

export const getUpcomingBookings = tool({
    name: "get_upcoming_bookings",
    description: "Check all upcoming bookings for the given producer and optional date/time.",
    parameters: z.object({
        producerId: z.number(),
        date: z.string().datetime().nullable(),
    }),
    async execute({ producerId, date }) {
        try {
            return await ProducerInsightsService.getUpcomingBookings(producerId, date ?? null);
        } catch (e: any) {
            const msg = String(e?.message || e);
            if (msg.includes("No upcoming bookings")) return [];
            throw e;
        }
    },
});

export const getFriendReferralBookings = tool({
    name: "get_friend_referral_bookings",
    description: "List customers who booked through a friend’s referral (interest creator ≠ booking user).",
    parameters: z.object({
        producerId: z.number(),
    }),
    async execute({ producerId }) {
        return await ProducerInsightsService.getFriendReferralBookings(producerId);
    },
});

export const getMonthlyAverageRating = tool({
    name: "get_monthly_average_rating",
    description: "Get the producer’s average customer rating for the current month.",
    parameters: z.object({ producerId: z.number() }),
    async execute({ producerId }) {
        const res = await ProducerInsightsService.getMonthlyAverageRating(producerId);
        return res; // { averageRating: number }
    },
});

export const getCustomersByRating = tool({
    name: "get_customers_by_rating",
    description: "List customers grouped by the rating (1–5 stars) they gave.",
    parameters: z.object({
        producerId: z.number(),
        rating: z.number().min(1).max(5),
    }),
    async execute({ producerId, rating }) {
        try {
            const rows = await ProducerInsightsService.getCustomersByRating(producerId, rating);
            return rows; // [] when none
        } catch (e) {
            // Avoid surfacing internal errors to the agent reply
            return [];
        }
    },
});

export const getRatingBreakdown = tool({
    name: "get_rating_breakdown",
    description: "Return the current overall rating and criteria breakdown for the producer, based on its type (restaurant, wellness, leisure).",
    parameters: z.object({
        producerId: z.number(),
    }),
    async execute({ producerId }) {
        const res = await ProducerInsightsService.getRatingBreakdown(producerId);
        // Always return a safe shape
        if (!res) {
            return { type: null, overall: 0, criteria: {}, updatedAt: null };
        }
        // Normalize numbers to 1 decimal place if you prefer
        const oneDec = (n: number) => Number.isFinite(n) ? parseFloat(n.toFixed(1)) : 0;
        const criteria = Object.fromEntries(Object.entries(res.criteria).map(([k, v]) => [k, oneDec(v as number)]));
        return { type: res.type, overall: oneDec(res.overall), criteria, updatedAt: res.updatedAt };
    },
});