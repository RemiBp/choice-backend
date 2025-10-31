import { Between, ILike } from "typeorm";
import { startOfMonth, endOfMonth } from "date-fns";
import {
    BookingRepository,
    PostRatingRepository,
    PostRepository,
    InterestRepository,
    UserRepository,
    EventBookingRepository,
    EventRatingRepository,
    DishRatingRepository,
    ReviewRepository,
} from "../../repositories";
import { BadRequestError } from "../../errors/badRequest.error";
import { NotFoundError } from "../../errors/notFound.error";
import InterestInvite from "../../models/InterestInvite";
import User from "../../models/User";
import Producer from "../../models/Producer";
import Interest from "../../models/Interest";
import EventEntity from "../../models/Event";
import { InviteStatus } from "../../enums/inviteStatus.enum";
import PostStatistics from "../../models/PostStatistics";

type ReferralRow = {
    bookingId: number;
    customerName: string;
    referrerId: number;
    bookedAt: Date;
};

type Row = {
    ratingId: number;
    rating: number;
    userId: number;
    userName: string;
    comment: string | null;
    date: Date;
};

// Producer Insights Service
export const getMostEngagedItems = async (producerId: number) => {
    if (!producerId) throw new BadRequestError("Producer ID is required");

    const postRepo = PostRepository
    const dishRatingRepo = DishRatingRepository;
    const eventRatingRepo = EventRatingRepository;

    // POSTS / SERVICES
    const posts = await postRepo
        .createQueryBuilder("post")
        .leftJoin(PostStatistics, "stats", "stats.postId = post.id")
        .where("post.producerId = :producerId", { producerId })
        .andWhere("post.isDeleted = false")
        .select([
            "'post' AS type",
            "post.id AS id",
            "post.description AS title",
            "COALESCE(stats.totalLikes, 0) + COALESCE(stats.totalShares, 0) + COALESCE(stats.totalComments, 0) + COALESCE(stats.totalRatings, 0) AS engagementScore",
        ])
        .orderBy("engagementScore", "DESC")
        .limit(5)
        .getRawMany();

    // MENU DISHES
    const dishes = await dishRatingRepo
        .createQueryBuilder("dr")
        .innerJoin("dr.dish", "dish")
        .innerJoin("dish.menuCategory", "mc")
        .innerJoin("mc.producer", "producer")
        .where("producer.id = :producerId", { producerId })
        .select([
            "'dish' AS type",
            "dish.id AS id",
            "dish.name AS title",
            "AVG(dr.rating) AS avgRating",
            "COUNT(dr.id) AS totalRatings",
            "(COUNT(dr.id) * AVG(dr.rating)) AS engagementScore",
        ])
        .groupBy("dish.id")
        .orderBy("engagementScore", "DESC")
        .limit(5)
        .getRawMany();

    // EVENTS / ACTIVITIES
    const events = await eventRatingRepo
        .createQueryBuilder("er")
        .innerJoin("er.event", "event")
        .where("event.producerId = :producerId", { producerId })
        .andWhere("event.isDeleted = false")
        .select([
            "'event' AS type",
            "event.id AS id",
            "event.title AS title",
            "AVG(er.rating) AS avgRating",
            "COUNT(er.id) AS totalRatings",
            "(COUNT(er.id) * AVG(er.rating)) AS engagementScore",
        ])
        .groupBy("event.id")
        .orderBy("engagementScore", "DESC")
        .limit(5)
        .getRawMany();

    // COMBINE & SORT
    const allItems = [...posts, ...dishes, ...events].sort(
        (a, b) => Number(b.engagementScore) - Number(a.engagementScore)
    );

    if (!allItems.length)
        throw new NotFoundError("No engagement data found for this producer");

    return allItems.slice(0, 10); // top 10 across all categories
};

export const getUpcomingBookings = async (producerId: number, date?: string | null) => {
    if (!producerId) throw new BadRequestError("Producer ID is required");

    const from = date ? new Date(date) : new Date();
    const fromISO = from.toISOString();
    const fromDateOnly = fromISO.slice(0, 10);

    // Restaurant/Wellness — explicit join to Producer by userId to avoid relying on inverse relations
    const restaurant = await BookingRepository.createQueryBuilder("b")
        .leftJoin(User, "c", "c.id = b.customerId")
        .innerJoin(Producer, "p", "p.userId = b.restaurantId AND p.id = :producerId", { producerId })
        .andWhere("b.isDeleted = false")
        // Filter by the precise datetime OR the date (either condition true)
        .andWhere("(b.startDateTime >= :fromISO OR b.bookingDate >= :fromDateOnly)", { fromISO, fromDateOnly })
        .andWhere("b.status <> :cancelled", { cancelled: "cancelled" })
        .select([
            "b.id AS id",
            "COALESCE(c.fullName, 'Unknown') AS userName",
            "b.bookingDate AS startDate",
            "b.status AS status",
        ])
        .orderBy("b.startDateTime", "ASC")
        .limit(50)
        .getRawMany();

    // Events
    const events = await EventBookingRepository.createQueryBuilder("eb")
        .innerJoin(EventEntity, "e", "e.id = eb.eventId AND e.producerId = :producerId", { producerId })
        .innerJoin(User, "u", "u.id = eb.userId")
        .andWhere("eb.isCancelled = false")
        .andWhere("e.date >= :fromDateOnly", { fromDateOnly })
        .select([
            "eb.id AS id",
            "u.fullName AS userName",
            "e.date AS startDate",
            // if your YAML wants status, provide a stable value or map one from event
            "'scheduled' AS status",
        ])
        .orderBy("e.date", "ASC")
        .limit(50)
        .getRawMany();

    const combined = [...restaurant, ...events]
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 20);

    // Do NOT throw: return empty list if none
    return combined;
};


export const getFriendReferralBookings = async (producerId: number) => {
    if (!producerId) throw new BadRequestError("Producer ID is required");

    // Restaurant/Wellness bookings (Bookings table)
    const producerSide: ReferralRow[] = await BookingRepository
        .createQueryBuilder("b")
        .innerJoin(User, "u", "u.id = b.customerId")
        // Map Booking.restaurantId (User.id) → Producer via userId
        .innerJoin(
            Producer,
            "p",
            "p.userId = b.restaurantId AND p.id = :producerId",
            { producerId }
        )
        // Invite where this customer was invited
        .innerJoin(
            InterestInvite,
            "inv",
            "inv.invitedUserId = b.customerId AND inv.status = :accepted",
            { accepted: InviteStatus.ACCEPTED }
        )
        // Link to the interest; ensure it's for the same producer
        .innerJoin(
            Interest,
            "i",
            "i.id = inv.interestId AND i.producerId = p.id"
        )
        // The inviter (referrer) must differ from the customer
        .where("i.userId <> b.customerId")
        // Invite must precede the booking (prevents false positives)
        .andWhere("inv.createdAt <= b.createdAt")
        .select([
            "b.id AS bookingId",
            "u.fullName AS customerName",
            "i.userId AS referrerId",
            "b.createdAt AS bookedAt",
        ])
        .orderBy("b.createdAt", "DESC")
        .limit(50) // gather a few more; we’ll trim after merging
        .getRawMany();

    // Event bookings (EventBookings table)
    // If your Event has a relation instead of producerId, adjust the join accordingly.
    const eventSide: ReferralRow[] = await EventBookingRepository
        .createQueryBuilder("eb")
        .innerJoin(User, "eu", "eu.id = eb.userId")
        .innerJoin(
            EventEntity,
            "e",
            "e.id = eb.eventId AND e.producerId = :producerId",
            { producerId }
        )
        .innerJoin(
            InterestInvite,
            "inv2",
            "inv2.invitedUserId = eb.userId AND inv2.status = :accepted",
            { accepted: InviteStatus.ACCEPTED }
        )
        .innerJoin(
            Interest,
            "i2",
            "i2.id = inv2.interestId AND i2.eventId = e.id"
        )
        .where("i2.userId <> eb.userId")
        .andWhere("inv2.createdAt <= eb.createdAt")
        .select([
            "eb.id AS bookingId",
            "eu.fullName AS customerName",
            "i2.userId AS referrerId",
            "eb.createdAt AS bookedAt",
        ])
        .orderBy("eb.createdAt", "DESC")
        .limit(50)
        .getRawMany();

    // Merge, sort, and cap
    const data = [...producerSide, ...eventSide]
        .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
        .slice(0, 20);

    // Do NOT throw on empty; return a clean, successful empty result
    return data;
};

import { ProducerRepository } from "../../repositories";

import RestaurantRating from "../../models/RestaurantRating";
import Wellness from "../../models/Wellness";
import Leisure from "../../models/Leisure";
import PostgresDataSource from "../../data-source";

type MonthlyAvg = { averageRating: number };

// AVG(overall) with month filter; falls back to current overall if no rows in month.
async function avgOverallForMonth<T>(
    entity: { new(): T },
    tableAlias: string,
    producerId: number,
    from: Date,
    to: Date
): Promise<number> {
    // Try monthly average (created OR updated in the window)
    const monthly = await PostgresDataSource.getRepository(entity)
        .createQueryBuilder(tableAlias)
        .select(`AVG(CAST(${tableAlias}.overall AS numeric))`, "avg")
        .where(`${tableAlias}."producerId" = :producerId`, { producerId })
        .andWhere(`(${tableAlias}."createdAt" BETWEEN :from AND :to OR ${tableAlias}."updatedAt" BETWEEN :from AND :to)`,
            { from, to }
        )
        .getRawOne();

    if (monthly?.avg != null) {
        const n = typeof monthly.avg === "string" ? parseFloat(monthly.avg) : Number(monthly.avg);
        if (Number.isFinite(n)) return n;
    }

    // Fallback: current overall (useful if table is 1 row per producer)
    const current = await PostgresDataSource.getRepository(entity)
        .createQueryBuilder(tableAlias)
        .select(`CAST(${tableAlias}.overall AS numeric)`, "val")
        .where(`${tableAlias}."producerId" = :producerId`, { producerId })
        .getRawOne();

    if (current?.val != null) {
        const n = typeof current.val === "string" ? parseFloat(current.val) : Number(current.val);
        if (Number.isFinite(n)) return n;
    }

    return 0;
}

export const getMonthlyAverageRating = async (producerId: number): Promise<MonthlyAvg> => {
    if (!producerId) throw new BadRequestError("Producer ID is required");

    const producer = await ProducerRepository.findOne({ where: { id: producerId } });
    if (!producer) throw new BadRequestError("Producer not found");

    // Adjust per your schema: producer.type / producer.producerType / serviceType, etc.
    const pType: string = (producer as any).type || (producer as any).producerType || "";

    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);

    let avg = 0;

    switch (pType.toLowerCase()) {
        case "restaurant":
            avg = await avgOverallForMonth(RestaurantRating, "rr", producerId, from, to);
            break;
        case "wellness":
            avg = await avgOverallForMonth(Wellness, "w", producerId, from, to);
            break;
        case "leisure":
            avg = await avgOverallForMonth(Leisure, "l", producerId, from, to);
            break;
        default:
            // Unknown type → safe default
            avg = 0;
    }

    return { averageRating: Number.isFinite(avg) ? parseFloat(avg.toFixed(1)) : 0 };
};

export const getCustomersByRating = async (producerId: number, rating: number) => {
    if (!producerId) throw new BadRequestError("Producer ID is required");
    if (!rating || rating < 1 || rating > 5)
        throw new BadRequestError("Rating must be between 1 and 5");

    // --- Restaurant/Wellness reviews via Booking -> Producer(userId) mapping
    const restaurantRows: Row[] = await ReviewRepository
        .createQueryBuilder("rev")
        .innerJoin("rev.booking", "b")                        // assumes Review.booking relation
        .innerJoin(Producer, "p", "p.userId = b.restaurantId AND p.id = :producerId", { producerId })
        .leftJoin(User, "u", "u.id = b.customerId")
        // Accept common rating column names: overall | rating | stars
        .where("(rev.overall = :rating OR rev.rating = :rating OR rev.stars = :rating)", { rating })
        .select([
            "rev.id AS ratingId",
            // coalesce the rating column back to one field:
            "COALESCE(rev.overall, rev.rating, rev.stars) AS rating",
            "u.id AS userId",
            "COALESCE(u.fullName, 'Unknown') AS userName",
            "rev.comment AS comment",
            "rev.createdAt AS date",
        ])
        .orderBy("rev.createdAt", "DESC")
        .limit(50)
        .getRawMany();

    // --- Event reviews (optional) — only if you actually have a Review ↔ EventBooking path
    let eventRows: Row[] = [];
    try {
        eventRows = await ReviewRepository
            .createQueryBuilder("rev")
            .innerJoin("rev.eventBooking", "eb")               // assumes Review.eventBooking relation if present
            .innerJoin(EventEntity, "e", "e.id = eb.eventId AND e.producerId = :producerId", { producerId })
            .leftJoin(User, "eu", "eu.id = eb.userId")
            .where("(rev.overall = :rating OR rev.rating = :rating OR rev.stars = :rating)", { rating })
            .select([
                "rev.id AS ratingId",
                "COALESCE(rev.overall, rev.rating, rev.stars) AS rating",
                "eu.id AS userId",
                "COALESCE(eu.fullName, 'Unknown') AS userName",
                "rev.comment AS comment",
                "rev.createdAt AS date",
            ])
            .orderBy("rev.createdAt", "DESC")
            .limit(50)
            .getRawMany();
    } catch {
        // If you don’t have event reviews, silently skip
        eventRows = [];
    }

    const data = [...restaurantRows, ...eventRows]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);

    // Return [] instead of throwing so the tool doesn’t error out
    return data;
};

// Escape % and _ for ILIKE
function escapeLike(raw: string) {
    return raw.replace(/[%_\\]/g, (m) => "\\" + m);
}

export const searchReviewsByKeyword = async (producerId: number, keyword: string) => {
    if (!producerId) throw new BadRequestError("Producer ID is required");
    if (!keyword || keyword.trim().length < 2)
        throw new BadRequestError("Keyword must be at least 2 characters long");

    const kw = `%${escapeLike(keyword.trim())}%`;

    // 🍽️ Restaurant/Wellness reviews via Booking → Producer(userId) mapping
    const restaurant: Row[] = await ReviewRepository
        .createQueryBuilder("rev")
        .innerJoin("rev.booking", "b") // assumes Review.booking relation exists
        .innerJoin(Producer, "p", "p.userId = b.restaurantId AND p.id = :producerId", { producerId })
        .leftJoin(User, "u", "u.id = b.customerId")
        .where("rev.comment ILIKE :kw ESCAPE '\\'", { kw })
        // Handle rating column naming differences (overall | rating | stars)
        .select([
            "rev.id AS reviewId",
            "rev.comment AS comment",
            "COALESCE(rev.overall, rev.rating, rev.stars) AS rating",
            "COALESCE(u.fullName, 'Unknown') AS userName",
            "rev.createdAt AS date",
        ])
        .orderBy("rev.createdAt", "DESC")
        .limit(50)
        .getRawMany();

    // 🎟️ Event reviews (optional) — only include if you actually have Review ↔ EventBooking relation
    let events: Row[] = [];
    try {
        events = await ReviewRepository
            .createQueryBuilder("rev")
            .innerJoin("rev.eventBooking", "eb") // if your Review has this relation
            .innerJoin(EventEntity, "e", "e.id = eb.eventId AND e.producerId = :producerId", { producerId })
            .leftJoin(User, "eu", "eu.id = eb.userId")
            .where("rev.comment ILIKE :kw ESCAPE '\\'", { kw })
            .select([
                "rev.id AS reviewId",
                "rev.comment AS comment",
                "COALESCE(rev.overall, rev.rating, rev.stars) AS rating",
                "COALESCE(eu.fullName, 'Unknown') AS userName",
                "rev.createdAt AS date",
            ])
            .orderBy("rev.createdAt", "DESC")
            .limit(50)
            .getRawMany();
    } catch {
        events = [];
    }

    // Merge & cap
    const data = [...restaurant, ...events]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);

    return data; // [] when none
};

export * as ProducerInsightsService from "./insights.service";
