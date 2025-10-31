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
    searchReviewsByKeyword,
} from "./tool";


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
setDefaultOpenAIClient(openai);

const AGENT_CONFIG = {
    name: "ChoiceApp Copilot",
    instructions: [
        "You are the official AI Copilot for ChoiceApp.",
        "",
        "GENERAL BEHAVIOR:",
        "- Always respond in JSON format: { message: string, data: any }",
        "- You assist both Users (customers) and Producers (business owners).",
        "",
        "USER QUERIES:",
        "- If the user asks for restaurants, use one of:",
        "   • find_nearby_restaurants (for general nearby)",
        "   • find_top_rated_nearby (for 'top', 'best', or 'highest rated')",
        "   • find_most_visited_restaurants (for 'most visited', 'popular', 'famous', etc.)",
        "- If query mentions 'availability' → check_restaurant_availability",
        "- If query mentions 'open wellness' → find_open_wellness_studios",
        "- If query mentions 'friends' or 'choices' → friends_posts_this_week",
        "",
        "PRODUCER QUERIES:",
        "- If the producer asks about performance, bookings, or ratings, use:",
        "   • get_most_engaged_items → Top dishes/services by engagement",
        "   • get_upcoming_bookings → Upcoming bookings",
        "   • get_friend_referral_bookings → Customers from friend referrals",
        "   • get_monthly_average_rating → Average rating for current month",
        "   • get_customers_by_rating → Customers by star rating (1–5)",
        "   • search_reviews_by_keyword → Find reviews mentioning a keyword",
        "",
        "PARAMETER RULES:",
        "- latitude := user context JSON at coords.latitude",
        "- longitude := user context JSON at coords.longitude",
        "- radius_km := context.radius_km OR default 5",
        "- producerId := context.producer?.id (for producer role)",
        "",
        "If location (latitude/longitude) is missing for user tools, respond:",
        "{ message: 'Please provide user coordinates to continue.', data: null }",
        "",
        "If role is not clear from context, ask for clarification.",
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
            "search_reviews_by_keyword",
        ],
    },

    model: new OpenAIResponsesModel(openai, "gpt-4.1-mini"),

    tools: [
        // User tools
        findNearbyRestaurants,
        findTopRatedNearby,
        findRestaurantPosts,
        friendsPostsThisWeek,
        findMostVisitedRestaurants,
        checkRestaurantAvailability,
        findOpenWellnessStudios,

        // Producer tools
        getMostEngagedItems,
        getUpcomingBookings,
        getFriendReferralBookings,
        getMonthlyAverageRating,
        getCustomersByRating,
        searchReviewsByKeyword,
    ],
};

const agent = new Agent(AGENT_CONFIG);

function parseAgentResponse(response: unknown): { message: string; data: any } {
    if (response && typeof response === "object") {
        const r: any = response;
        if (typeof r.message === "string" && "data" in r) return r;
        return { message: JSON.stringify(r), data: null };
    }
    if (typeof response === "string") {
        const s = response.trim();
        try {
            return JSON.parse(s);
        } catch {
            return { message: s || "No structured response", data: null };
        }
    }
    return { message: "No structured response", data: null };
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
        const final =
            (result as any)?.finalToolOutput ?? (result as any)?.finalOutput ?? "";
        return parseAgentResponse(final);
    },
};
