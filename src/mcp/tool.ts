import { tool } from "@openai/agents";
import { z } from "zod";
import { ProducerType, SortOption } from "../enums/ProducerType.enum";
import { ProducerInsightsService } from "../services/producer/insights.service";

const hasNumber = (v: unknown) => typeof v === "number" && Number.isFinite(v);

// USER SIDE TOOLS

export const findNearbyRestaurants = tool({
    name: "find_nearby_restaurants",
    description:
        "Find nearby restaurants based on user's location. Optionally filter by dish name when provided (empty string means no filter).",
    parameters: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radius_km: z.number().min(0.1).max(50).default(10),
        // IMPORTANT: required (no optional). Empty string means 'no filter'.
        dishName: z
            .string()
            .default("")
            .describe("Dish name to filter by. Pass empty string ('') for no filter."),
    }),
    async execute({ latitude, longitude, radius_km, dishName }) {
        if (!hasNumber(latitude) || !hasNumber(longitude)) {
            return { message: "Location (latitude, longitude) is required.", data: null };
        }

        try {
            const trimmed = (dishName ?? "").trim();
            const data = await ProducerInsightsService.getNearbyProducers(0, {
                latitude,
                longitude,
                radius: radius_km,
                type: ProducerType.RESTAURANT,
                sort: SortOption.DISTANCE,
                limit: 20,
                page: 1,
                // only pass filter if non-empty
                dishName: trimmed.length ? trimmed : undefined,
            });

            const msg =
                trimmed.length > 0
                    ? `Nearby restaurants serving ${trimmed}`
                    : "Nearby restaurants found successfully.";

            return { message: msg, data };
        } catch (error) {
            console.error("Error in findNearbyRestaurants:", error);
            return { message: "Failed to fetch nearby restaurants.", data: null };
        }
    },
});

export const findTopRatedNearby = tool({
    name: "find_top_rated_nearby",
    description:
        "Find top-rated restaurants and wellness services near the user's location, sorted by rating.",
    parameters: z.object({
        latitude: z.number().describe("Latitude of the user's current location."),
        longitude: z.number().describe("Longitude of the user's current location."),
        radius_km: z.number().default(10).describe("Search radius in kilometers (default 10 km)."),
    }),
    async execute({ latitude, longitude, radius_km }) {
        if (!hasNumber(latitude) || !hasNumber(longitude)) {
            return { message: "Location (latitude, longitude) is required.", data: null };
        }

        try {
            const restaurants = await ProducerInsightsService.getTopProducers(0, {
                latitude,
                longitude,
                radius: radius_km,
                type: ProducerType.RESTAURANT,
                sort: SortOption.RATING,
                minAverageScore: 4,
                limit: 10,
                page: 1,
            });

            const wellness = await ProducerInsightsService.getTopProducers(0, {
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

            return {
                message: "Top-rated restaurants and wellness services near you.",
                data: { restaurants, wellness },
            };
        } catch (error) {
            console.error("Error in findTopRatedNearby:", error);
            return { message: "Failed to fetch top-rated places near you.", data: null };
        }
    },
});

export const findNearbyEvents = tool({
    name: "find_nearby_events",
    description:
        "Find active events happening soon (today or in the next few days) near the user's city or location.",
    parameters: z.object({
        city: z.string().default("").describe("City name to search events in."),
        latitude: z.number().default(0).describe("Latitude of user's location."),
        longitude: z.number().default(0).describe("Longitude of user's location."),
        radius_km: z.number().default(10).describe("Radius around user's location in kilometers."),
    }),
    async execute({ city, latitude, longitude, radius_km }) {
        try {
            const trimmedCity = (city ?? "").trim();
            const hasCoords = latitude && longitude;

            const events = await ProducerInsightsService.getUpcomingEvents({
                city: trimmedCity || undefined,
                latitude: hasCoords ? latitude : undefined,
                longitude: hasCoords ? longitude : undefined,
                radius_km,
            });

            if (!events.length) {
                return { message: "No upcoming events found in your area.", data: [] };
            }

            return {
                message: `Found ${events.length} upcoming event${events.length > 1 ? "s" : ""} near you.`,
                data: events,
            };
        } catch (error) {
            console.error("Error in findNearbyEvents:", error);
            return { message: "Failed to fetch upcoming events.", data: null };
        }
    },
});


export const getPlacesByStarRating = tool({
    name: "get_places_by_star_rating",
    description: "Find restaurants, leisure, or wellness places that have ratings of 1, 2, 3, 4, or 5 stars.",
    parameters: z.object({
        stars: z
            .number()
            .min(1)
            .max(5)
            .describe("Specific star rating (1–5) to filter results"),
    }),
    async execute(input: { stars: number }) {
        try {
            const { stars } = input;

            const result = await ProducerInsightsService.getProducersGroupedByRating(stars);

            if (!result.data || result.data.length === 0) {
                return {
                    message: `No places found with ${stars}-star rating.`,
                    data: [],
                };
            }

            return result;
        } catch (error: any) {
            console.error("Error in getPlacesByStarRating:", error);
            return {
                message: "Failed to retrieve places by star rating.",
                data: null,
            };
        }
    },
});

export const findRestaurantPosts = tool({
    name: "find_restaurant_posts",
    description: "Fetch all posts made by a specific restaurant.",
    parameters: z.object({
        restaurantName: z.string().min(1, "Restaurant name is required."),
        limit: z.number().optional().default(10),
        page: z.number().optional().default(1),
    }),
    async execute({ restaurantName, page, limit }) {
        try {
            const result = await ProducerInsightsService.getPostsByRestaurant(restaurantName, page, limit);
            if (!result?.data || result.data.length === 0) {
                return { message: `No posts found for '${restaurantName}'.`, data: [] };
            }
            return { message: result.message, data: result.data };
        } catch {
            return { message: `No restaurant found with the name '${restaurantName}'.`, data: [] };
        }
    },
});

export const friendsPostsThisWeek = tool({
    name: "friends_posts_this_week",
    description: "Find which of the user's friends have made a choice post this week.",
    parameters: z.object({
        userId: z.number().describe("The ID of the user making the query"),
    }),
    async execute({ userId }) {
        const result = await ProducerInsightsService.getFriendsWhoPostedThisWeek(userId);
        return { message: result.message, data: result.data };
    },
});

export const findMostVisitedRestaurants = tool({
    name: "find_most_visited_restaurants",
    description: "Find the most visited restaurants based on how many people made Choice posts there.",
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
        restaurant_name: z.string().min(1, "Restaurant name is required"),
    }),
    async execute({ restaurant_name }) {
        try {
            const result = await ProducerInsightsService.getProducerAvailabilityByName(restaurant_name);
            if (!result?.data || result.data.length === 0) {
                return { message: `No availability found for '${restaurant_name}'.`, data: [] };
            }
            return { message: result.message, data: result.data };
        } catch (error: any) {
            const msg = String(error?.message || error);
            if (msg.includes("not found")) {
                return { message: `No restaurant found with the name '${restaurant_name}'.`, data: [] };
            }
            return { message: `Failed to check availability for '${restaurant_name}'.`, data: null };
        }
    },
});

export const findOpenWellnessStudios = tool({
    name: "find_open_wellness_studios",
    description: "List all wellness studios that are currently open (based on UTC time).",
    parameters: z.object({}),
    async execute() {
        try {
            const result = await ProducerInsightsService.getOpenWellnessStudios();
            return { message: result.message, data: result.data };
        } catch {
            return { message: "Failed to fetch open wellness studios.", data: null };
        }
    },
});

// PRODUCER SIDE TOOLS

export const getMostEngagedItems = tool({
    name: "get_most_engaged_items",
    description: "Find which dishes, activities, or services have the highest engagement (likes, bookings, or posts).",
    parameters: z.object({
        producerId: z.number().describe("Producer ID of the logged-in producer."),
    }),
    async execute({ producerId }) {
        try {
            const result = await ProducerInsightsService.getMostEngagedItems(producerId);

            if (!result || result.length === 0) {
                return {
                    message: "You don't have any engagement data yet. Start by adding menu items, events, or posts!",
                    data: [],
                };
            }

            // return a clean response structure
            return {
                message: "Here are your most engaged dishes, activities, or services.",
                data: result.map((item) => ({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    engagementScore: Number(item.engagementScore) || 0,
                    avgRating: item.avgRating ? Number(item.avgRating) : undefined,
                    totalRatings: item.totalRatings ? Number(item.totalRatings) : undefined,
                })),
            };
        } catch (error: any) {
            const msg = String(error?.message || error);
            if (msg.includes("No engagement data") || msg.includes("not found")) {
                return {
                    message: "You don't have any engagement data yet. Start by adding menu items or services to track engagement!",
                    data: [],
                };
            }
            console.error("Error in getMostEngagedItems:", error);
            return { message: "Failed to fetch engagement data. Please try again later.", data: null };
        }
    },
});

export const getUpcomingBookings = tool({
    name: "get_upcoming_bookings",
    description: "Check all upcoming bookings for the given producer and optional date/time.",
    parameters: z.object({
        producerId: z.number(),
        date: z.string().datetime().nullable().optional(),
    }),
    async execute({ producerId, date }) {
        try {
            const result = await ProducerInsightsService.getUpcomingBookings(producerId, date ?? null);
            return result;
        } catch (e: any) {
            const msg = String(e?.message || e);
            if (msg.includes("No upcoming bookings") || msg.includes("not found") || msg.includes("No bookings")) {
                return { message: "You don't have any upcoming bookings at the moment.", data: [] };
            }
            return { message: "Failed to fetch upcoming bookings. Please try again later.", data: null };
        }
    },
});

export const getFriendReferralBookings = tool({
    name: "get_friend_referral_bookings",
    description: "List customers who booked through a friend's referral.",
    parameters: z.object({
        producerId: z.number(),
    }),
    async execute({ producerId }) {
        try {
            const result = await ProducerInsightsService.getFriendReferralBookings(producerId);
            return result;
        } catch (error: any) {
            const msg = String(error?.message || error);
            if (msg.includes("No referral") || msg.includes("not found") || msg.includes("No bookings")) {
                return {
                    message: "You don't have any friend referral bookings yet. Encourage customers to share your business!",
                    data: [],
                };
            }
            return { message: "Failed to fetch referral bookings. Please try again later.", data: null };
        }
    },
});

export const getMonthlyAverageRating = tool({
    name: "get_monthly_average_rating",
    description: "Get the producer's average customer rating for the current month.",
    parameters: z.object({
        producerId: z.number().describe("Producer ID of the logged-in producer."),
    }),
    async execute({ producerId }) {
        try {
            const res = await ProducerInsightsService.getMonthlyAverageRating(producerId);

            // Format the response clearly
            const avg = res?.averageRating ?? 0;

            if (avg === 0) {
                return {
                    message: "You don't have any ratings for this month yet.",
                    data: { averageRating: 0 },
                };
            }

            return {
                message: `Your average rating for this month is ${avg.toFixed(1)} stars.`,
                data: { averageRating: avg },
            };
        } catch (error: any) {
            const msg = String(error?.message || error);
            if (msg.includes("No rating") || msg.includes("not found") || msg.includes("No data")) {
                return {
                    message: "You don't have any ratings for this month yet.",
                    data: { averageRating: 0 },
                };
            }

            console.error("Error in getMonthlyAverageRating:", error);
            return {
                message: "Failed to fetch average rating. Please try again later.",
                data: null,
            };
        }
    },
});

export const getCustomersByRating = tool({
    name: "get_customers_by_rating",
    description: "Fetch a list of customers who rated the producer with a specific number of stars (1–5).",
    parameters: z.object({
        producerId: z.number().describe("The producer's ID"),
        rating: z.number().min(1).max(5).describe("Rating value (1 to 5)"),
    }),
    async execute({ producerId, rating }) {
        try {
            const rows = await ProducerInsightsService.getCustomersByRating(producerId, rating);

            // Ensure consistent output
            if (!rows || !Array.isArray(rows)) {
                return { message: "No customers found for this rating.", data: [] };
            }

            if (rows.length === 0) {
                return { message: `No customers have given ${rating}-star ratings yet.`, data: [] };
            }

            // Sort data by most recent
            const sorted = rows.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            return {
                message: `Found ${sorted.length} customers with ${rating}-star ratings.`,
                data: sorted,
            };
        } catch (error: any) {
            const msg = String(error?.message || error);
            if (
                msg.includes("No customers") ||
                msg.includes("not found") ||
                msg.includes("No ratings") ||
                msg.includes("empty")
            ) {
                return { message: `No customers have given ${rating}-star ratings yet.`, data: [] };
            }

            console.error("getCustomersByRating tool error:", msg);
            return { message: "Something went wrong while fetching customers by rating.", data: [] };
        }
    },
});

export const getRatingBreakdown = tool({
    name: "get_rating_breakdown",
    description: "Return the current overall rating and criteria breakdown for the producer.",
    parameters: z.object({
        producerId: z.number(),
    }),
    async execute({ producerId }) {
        try {
            const res = await ProducerInsightsService.getRatingBreakdown(producerId);
            if (!res) {
                return {
                    message: "You don't have any rating data yet. Ratings will appear once customers start reviewing your business.",
                    data: { type: null, overall: 0, criteria: {}, updatedAt: null },
                };
            }

            const oneDec = (n: number) => (Number.isFinite(n) ? parseFloat(n.toFixed(1)) : 0);
            const criteria = Object.fromEntries(Object.entries(res.criteria).map(([k, v]) => [k, oneDec(v as number)]));

            return {
                message: `Overall rating: ${oneDec(res.overall)}`,
                data: { type: res.type, overall: oneDec(res.overall), criteria, updatedAt: res.updatedAt },
            };
        } catch (error: any) {
            const msg = String(error?.message || error);
            if (msg.includes("No rating") || msg.includes("not found") || msg.includes("No data")) {
                return {
                    message: "You don't have any rating data yet. Ratings will appear once customers start reviewing your business.",
                    data: { type: null, overall: 0, criteria: {}, updatedAt: null },
                };
            }
            return { message: "Failed to fetch rating breakdown. Please try again later.", data: null };
        }
    },
});