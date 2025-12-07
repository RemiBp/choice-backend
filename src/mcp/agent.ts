import OpenAI from "openai";
import { Agent, run, system, user } from "@openai/agents";
import { setDefaultOpenAIClient, OpenAIResponsesModel } from "@openai/agents-openai";
import {
    // User-side tools
    checkRestaurantAvailability,
    findMostVisitedRestaurants,
    findNearbyRestaurants,
    findOpenWellnessStudios,
    findRestaurantPosts,
    findTopRatedNearby,
    friendsPostsThisWeek,

    // Producer-side tools
    getMostEngagedItems,
    getUpcomingBookings,
    getFriendReferralBookings,
    getMonthlyAverageRating,
    getCustomersByRating,
    getRatingBreakdown,
    findNearbyEvents,
    getPlacesByStarRating,
} from "./tool";

interface CopilotResponse {
    message: string;
    data: any;
    tools?: string[];
    askUser?: boolean;
}

// OpenAI client setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
setDefaultOpenAIClient(openai);

// Agent Configuration
const AGENT_CONFIG = {
    name: "ChoiceApp Copilot",
    instructions: [
        "You are the official AI Copilot for ChoiceApp.",
        "",
        "RESPONSE FORMAT:",
        "- Always respond in valid JSON format: { message: string, data: any }",
        "",
        "CONTEXT UNDERSTANDING:",
        "- You receive context as JSON in the system message",
        "- context.role indicates 'user' or 'producer'",
        "- For PRODUCER queries: context.producer.id contains the producerId",
        "- For USER queries: context.coords contains location data",
        "",
        "USER TOOLS (when role='user'):",
        "- find_nearby_restaurants: General restaurant search near user",
        "- find_top_rated_nearby: Best rated restaurants/wellness nearby",
        "- find_most_visited_restaurants: Most popular restaurants",
        "- check_restaurant_availability: Check slots for a specific restaurant",
        "- find_open_wellness_studios: Currently open wellness centers",
        "- find_restaurant_posts: Posts from a specific restaurant",
        "- friends_posts_this_week: What friends posted this week",
        "",
        "PRODUCER TOOLS (when role='producer'):",
        "CRITICAL: For ALL producer tools, ALWAYS use context.producer.id as the producerId parameter.",
        "Never ask the user for producerId - it's always in the context.",
        "",
        "Available producer tools:",
        "- get_most_engaged_items(producerId): Top performing menu items/services",
        "- get_upcoming_bookings(producerId, date?): Future reservations",
        "- get_friend_referral_bookings(producerId): Bookings from referrals",
        "- get_monthly_average_rating(producerId): Current month's rating",
        "- get_customers_by_rating(producerId, rating): Customers by star rating (1-5)",
        "- get_rating_breakdown(producerId): Detailed rating analysis",
        "",
        "PARAMETER EXTRACTION:",
        "- producerId: ALWAYS use context.producer.id (never ask user)",
        "- latitude/longitude: Use context.coords.latitude and context.coords.longitude",
        "- radius_km: Use context.radius_km or default to 5",
        "- userId: Use context.userId",
        "",
        "ERROR HANDLING:",
        "- If producerId missing for producer role: { message: 'Producer information not found. Please ensure you are logged in as a producer.', data: null }",
        "- If coordinates missing for user tools: { message: 'Location not available. Please enable location services.', data: null }",
        "",
        "OUT OF SCOPE:",
        "- For unrelated queries, politely redirect to app features based on role",
    ].join("\n"),

    toolUseBehavior: {
        stopAtToolNames: [
            "find_nearby_restaurants",
            "find_top_rated_nearby",
            "find_most_visited_restaurants",
            "find_restaurant_posts",
            "friends_posts_this_week",
            "check_restaurant_availability",
            "find_open_wellness_studios",
            "get_most_engaged_items",
            "get_upcoming_bookings",
            "get_friend_referral_bookings",
            "get_monthly_average_rating",
            "get_customers_by_rating",
            "get_rating_breakdown",
            "find_nearby_events",
            "get_places_by_star_rating",
        ],
    },

    model: new OpenAIResponsesModel(openai, "gpt-4o-mini"),

    tools: [
        // User tools
        findNearbyRestaurants,
        findTopRatedNearby,
        findRestaurantPosts,
        friendsPostsThisWeek,
        findMostVisitedRestaurants,
        checkRestaurantAvailability,
        findOpenWellnessStudios,
        findNearbyEvents,
        getPlacesByStarRating,

        // Producer tools
        getMostEngagedItems,
        getUpcomingBookings,
        getFriendReferralBookings,
        getMonthlyAverageRating,
        getCustomersByRating,
        getRatingBreakdown,
    ],
};

const agent = new Agent(AGENT_CONFIG);

// Helper: Parse agent output
function parseAgentResponse(response: unknown): CopilotResponse {
    if (!response) {
        return { message: "No response from agent", data: null };
    }

    if (typeof response === "string") {
        const trimmed = response.trim();
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.message && typeof parsed.message === "string") {
                return {
                    message: parsed.message,
                    data: parsed.data ?? null,
                    tools: parsed.tools,
                    askUser: parsed.askUser
                };
            }
        } catch { }
        return { message: trimmed || "Empty response", data: null };
    }

    if (typeof response === "object") {
        const r = response as any;
        if (typeof r.message === "string") {
            return {
                message: r.message,
                data: r.data ?? null,
                tools: r.tools,
                askUser: r.askUser
            };
        }
        return { message: JSON.stringify(r, null, 2), data: null };
    }

    return { message: String(response), data: null };
}

export const CopilotAgent = {
    instance: agent,

    async handle(query: string, context: Record<string, any>) {
        const role = context?.role || "user";

        const promptHeader =
            role === "producer"
                ? "You are the ChoiceApp Producer Copilot."
                : "You are the ChoiceApp User Copilot.";

        const systemPrompt = [
            promptHeader,
            `${role === "producer" ? "Producer" : "User"} context (JSON):`,
            JSON.stringify(context, null, 2),
        ].join("\n");

        const result = await run(agent, [system(systemPrompt), user(query)]);
        const final = (result as any)?.finalToolOutput ?? (result as any)?.finalOutput ?? "";
        let parsed = parseAgentResponse(final);

        // Fallback for out-of-scope queries
        const irrelevant =
            !parsed.data &&
            /outside the scope|not related|don't understand|scope of this app|cannot help|unrelated/i.test(parsed.message || "");

        if (irrelevant) {
            if (role === "producer") {
                parsed = {
                    message: "I can help you manage your bookings, ratings, and business insights on ChoiceApp.",
                    tools: [
                        "📊 View most engaged items",
                        "📅 See upcoming bookings",
                        "🎁 Track friend referral bookings",
                        "⭐ View monthly average ratings",
                        "👥 See customers by rating",
                        "📈 Get rating breakdown analytics",
                    ],
                    data: null,
                };
            } else {
                parsed = {
                    message: "I can help you explore restaurants, wellness studios, and your friends' favorite places nearby.",
                    tools: [
                        "🍽️ Find nearby restaurants",
                        "🏆 Discover top-rated spots",
                        "🔥 Explore most-visited restaurants",
                        "🕒 Check availability",
                        "💆 Find open wellness studios",
                        "📸 View restaurant posts",
                        "👫 See friends' recent choices",
                    ],
                    data: null,
                };
            }
        }

        return parsed;
    },
};