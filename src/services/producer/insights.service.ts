import { Between, ILike } from "typeorm";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
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
    LeisureRepository,
    WellnessRepository,
    RestaurantRatingRepository,
    ProducerRepository,
    FollowRepository,
    EventRepository,
    WellnessServiceRepository
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
import { avgOverallForMonthRepo } from "../../utils/avgOverallForMonthRepo";
import { BusinessRole } from "../../enums/Producer.enum";
import { getProducerSlots } from "./profile.service";
import { ProducerType, SortOption } from "../../enums/ProducerType.enum";
import { FollowStatusEnums } from "../../enums/followStatus.enum";
import { NearbyProducersInput } from "../../validators/producer/maps.validation";
import Wellness from "../../models/Wellness";
import Leisure from "../../models/Leisure";
import RestaurantRating from "../../models/RestaurantRating";
import PostgresDataSource from "../../data-source";

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

const EARTH_RADIUS_KM = 6371;

export const getNearbyProducers = async (userId: number, data: NearbyProducersInput & { dishName?: string }) => {
    const { latitude, longitude, radius, type, limit, page, sort, dishName } = data;

    if (type === ProducerType.FRIENDS) {
        if (!userId) throw new Error("userId is required to fetch nearby friends");
        return await getNearbyFriends(latitude, longitude, radius, userId);
    }

    const distExpr = `
    ${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS(:lat - p.latitude) / 2), 2) +
      COS(RADIANS(:lat)) * COS(RADIANS(p.latitude)) *
      POWER(SIN(RADIANS(:lng - p.longitude) / 2), 2)
    ))
  `;

    const qb = ProducerRepository.createQueryBuilder("p")
        .select([
            "p.id AS id",
            "p.name AS name",
            "p.type AS type",
            "p.latitude AS latitude",
            "p.longitude AS longitude",
            "p.address AS address",
        ])
        .addSelect(`${distExpr}`, "distance_km")
        .where("p.isActive = true")
        .andWhere("p.latitude IS NOT NULL AND p.longitude IS NOT NULL")
        .andWhere(`${distExpr} <= :radius`, { radius })
        .setParameters({ lat: latitude, lng: longitude })
        .offset((page - 1) * limit)
        .limit(limit);

    if (type && type !== ProducerType.ALL) {
        qb.andWhere("p.type::text = :type", { type });
    }

    // Apply dish filter only when provided
    if (dishName && dishName.trim().length) {
        qb
            .leftJoin("p.menuCategory", "mc")
            .leftJoin("mc.dishes", "md")
            // Postgres case-insensitive match
            .andWhere("md.name ILIKE :dish", { dish: `%${dishName.trim()}%` });
    }

    if (sort === SortOption.RATING) {
        qb.orderBy("p.rating->>'average'", "DESC", "NULLS LAST").addOrderBy("distance_km", "ASC");
    } else {
        qb.orderBy("distance_km", "ASC").addOrderBy("p.rating->>'average'", "DESC", "NULLS LAST");
    }

    const producers = await qb.getRawMany();

    if (type === ProducerType.ALL && userId) {
        const friends = await getNearbyFriends(latitude, longitude, radius, userId);
        return { producers, friends };
    }

    return producers;
};

export const getTopProducers = async (
    userId: number,
    data: NearbyProducersInput & { dishName?: string }
) => {
    const { latitude, longitude, radius, type, limit, page, sort, dishName } = data;

    if (type === ProducerType.FRIENDS) {
        if (!userId) throw new Error("userId is required to fetch nearby friends");
        return await getNearbyFriends(latitude, longitude, radius, userId);
    }

    const distExpr = `
    ${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS(:lat - p.latitude) / 2), 2) +
      COS(RADIANS(:lat)) * COS(RADIANS(p.latitude)) *
      POWER(SIN(RADIANS(:lng - p.longitude) / 2), 2)
    ))
  `;

    const qb = ProducerRepository.createQueryBuilder("p")
        .select([
            "p.id AS id",
            "p.name AS name",
            "p.type AS type",
            "p.latitude AS latitude",
            "p.longitude AS longitude",
            "p.address AS address",
            "p.rating AS rating",
        ])
        .addSelect(`${distExpr}`, "distance_km")
        .where("p.isActive = true")
        .andWhere("p.latitude IS NOT NULL AND p.longitude IS NOT NULL")
        .andWhere(`${distExpr} <= :radius`, { radius })
        .setParameters({ lat: latitude, lng: longitude })
        .offset((page - 1) * limit)
        .limit(limit);

    // Filter by business type
    if (type && type !== ProducerType.ALL) {
        qb.andWhere("p.type::text = :type", { type });
    }

    // Optional dish filter
    if (dishName && dishName.trim().length) {
        qb.leftJoin("p.menuCategory", "mc")
            .leftJoin("mc.dishes", "md")
            .andWhere("md.name ILIKE :dish", { dish: `%${dishName.trim()}%` });
    }

    // Sort logic
    if (sort === SortOption.RATING) {
        qb.orderBy("p.rating->>'average'", "DESC", "NULLS LAST").addOrderBy("distance_km", "ASC");
    } else {
        qb.orderBy("distance_km", "ASC").addOrderBy("p.rating->>'average'", "DESC", "NULLS LAST");
    }

    const producers = await qb.getRawMany();

    // Friends inclusion for ALL type
    if (type === ProducerType.ALL && userId) {
        const friends = await getNearbyFriends(latitude, longitude, radius, userId);
        return { producers, friends };
    }

    return producers;
};

const getNearbyFriends = async (lat: number, lng: number, radius: number, userId: number) => {
    const distExpr = `${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(:lat - u.latitude) / 2), 2) +
    COS(RADIANS(:lat)) * COS(RADIANS(u.latitude)) *
    POWER(SIN(RADIANS(:lng - u.longitude) / 2), 2)
  ))`;

    const qb = UserRepository.createQueryBuilder("u")
        // mutual follow condition
        .innerJoin("Follow", "f1", "f1.followerId = :userId AND f1.followedUserId = u.id")
        .innerJoin("Follow", "f2", "f2.followerId = u.id AND f2.followedUserId = :userId")
        .leftJoin("u.locationPrivacy", "lp")
        .select([
            "u.id AS id",
            "u.fullName AS fullName",
            "u.userName AS userName",
            "u.profileImageUrl AS profileImageUrl",
            "u.latitude AS latitude",
            "u.longitude AS longitude"
        ])
        .addSelect(`${distExpr}`, "distance_km")
        // only users within given radius
        .andWhere(`${distExpr} <= :radius`, { radius })
        .setParameters({ lat, lng, userId })
        .orderBy("distance_km", "ASC");

    const friends = await qb.getRawMany();
    return friends;
};

export const getUpcomingEvents = async ({
    city,
    latitude,
    longitude,
    radius_km = 10,
}: {
    city?: string;
    latitude?: number;
    longitude?: number;
    radius_km?: number;
}) => {
    try {
        // Date range: today → next 5 days
        const today = new Date();
        const upcomingEnd = addDays(today, 5);
        const fromDate = today.toISOString().split("T")[0];
        const toDate = upcomingEnd.toISOString().split("T")[0];

        const qb = EventRepository.createQueryBuilder("e")
            .leftJoinAndSelect("e.producer", "p")
            .select([
                "e.id AS id",
                "e.title AS title",
                "e.date AS date",
                "e.startTime AS startTime",
                "e.endTime AS endTime",
                "e.location AS location",
                "p.name AS producerName",
                "p.city AS city",
                "p.address AS address",
            ])
            .where("e.isActive = true")
            .andWhere("e.isDeleted = false")
            // works safely for string/varchar date
            .andWhere("TRIM(e.date) >= :from AND TRIM(e.date) <= :to", {
                from: fromDate,
                to: toDate,
            });

        // City filter (optional)
        if (city && city.trim()) {
            qb.andWhere("(p.city IS NOT NULL AND LOWER(p.city) LIKE LOWER(:city))", {
                city: `%${city.trim()}%`,
            });
        }

        // Geo-distance filter (optional)
        if (latitude && longitude) {
            const EARTH_RADIUS_KM = 6371;
            const distExpr = `(
        ${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(
          POWER(SIN(RADIANS(:lat - e.latitude) / 2), 2) +
          COS(RADIANS(:lat)) * COS(RADIANS(e.latitude)) *
          POWER(SIN(RADIANS(:lng - e.longitude) / 2), 2)
        ))
      )`;

            qb.andWhere(
                `(e.latitude IS NOT NULL AND e.longitude IS NOT NULL AND ${distExpr} <= :radius)`,
                { radius: radius_km, lat: latitude, lng: longitude }
            );

            // optional for debugging
            qb.addSelect(`${distExpr}`, "distance_km");
        }

        qb.orderBy("e.date", "ASC").addOrderBy("e.startTime", "ASC");

        const events = await qb.getRawMany();
        return events;
    } catch (error) {
        console.error("Error in getUpcomingEvents:", error);
        throw error;
    }
};

export const getProducersGroupedByRating = async (starFilter?: number) => {
    const connection = PostgresDataSource;

    const restaurantRatings = await connection
        .getRepository(RestaurantRating)
        .createQueryBuilder("r")
        .innerJoinAndSelect("r.producer", "p")
        .select([
            "p.id AS id",
            "p.name AS name",
            "p.type AS type",
            "ROUND(r.overall) AS stars",
            "r.overall AS overall"
        ])
        .where("r.overall > 0")
        .getRawMany();

    const leisureRatings = await connection
        .getRepository(Leisure)
        .createQueryBuilder("l")
        .innerJoinAndSelect("l.producer", "p")
        .select([
            "p.id AS id",
            "p.name AS name",
            "p.type AS type",
            "ROUND(l.overall) AS stars",
            "l.overall AS overall"
        ])
        .where("l.overall > 0")
        .getRawMany();

    const wellnessRatings = await connection
        .getRepository(Wellness)
        .createQueryBuilder("w")
        .innerJoinAndSelect("w.producer", "p")
        .select([
            "p.id AS id",
            "p.name AS name",
            "p.type AS type",
            "ROUND(w.overall) AS stars",
            "w.overall AS overall"
        ])
        .where("w.overall > 0")
        .getRawMany();

    // Combine all results
    const all = [...restaurantRatings, ...leisureRatings, ...wellnessRatings];

    // Optional filter for specific star
    const filteredStars = starFilter
        ? [starFilter]
        : [1, 2, 3, 4, 5];

    const grouped = filteredStars.map(star => ({
        stars: star,
        places: all
            .filter(i => Number(i.stars) === star)
            .map(i => ({
                id: i.id,
                name: i.name,
                type: i.type,
                overall: Number(i.overall),
            })),
    }));

    return {
        message: starFilter
            ? `Places with ${starFilter}-star rating`
            : "Places grouped by star ratings",
        data: grouped,
    };
};

export const getMostEngagedItems = async (producerId: number) => {
    if (!producerId) throw new BadRequestError("Producer ID is required");

    // Step 1: Detect producer type
    const producer = await ProducerRepository.findOne({ where: { id: producerId } });
    if (!producer) throw new NotFoundError("Producer not found.");
    const type = (producer.type || "").toString().toLowerCase().trim();

    const postRepo = PostRepository;
    const dishRatingRepo = DishRatingRepository;
    const eventRatingRepo = EventRatingRepository;

    // Step 2: Get post engagement (common for all types)
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

    // Step 3: 🍽 Dishes (restaurants only)
    let dishes: any[] = [];
    if (type === "restaurant") {
        console.log("🍽 Fetching top dishes...");
        dishes = await dishRatingRepo
            .createQueryBuilder("dr")
            .innerJoin("dr.menuDish", "dish") // Correct relation: dishRating.menuDish
            .innerJoin("dish.menuCategory", "mc")
            .innerJoin("mc.producer", "producer")
            .where("producer.id = :producerId", { producerId })
            .select([
                "'dish' AS type",
                "dish.id AS id",
                "dish.name AS title",
                "COALESCE(AVG(dr.rating), 0) AS avgRating",
                "COUNT(dr.id) AS totalRatings",
                "(COUNT(dr.id) * COALESCE(AVG(dr.rating), 0)) AS engagementScore",
            ])
            .groupBy("dish.id")
            .orderBy("engagementScore", "DESC")
            .limit(5)
            .getRawMany();

        console.log("🍽 Dishes Found:", dishes.length);
    }

    // Step 4: Activities (leisure only)
    let events: any[] = [];
    if (type === "leisure") {
        events = await eventRatingRepo
            .createQueryBuilder("er")
            .innerJoin("er.event", "event")
            .where("event.producerId = :producerId", { producerId })
            .andWhere("event.isDeleted = false")
            .select([
                "'event' AS type",
                "event.id AS id",
                "event.title AS title",
                "COALESCE(AVG(er.rating), 0) AS avgRating",
                "COUNT(er.id) AS totalRatings",
                "(COUNT(er.id) * COALESCE(AVG(er.rating), 0)) AS engagementScore",
            ])
            .groupBy("event.id")
            .orderBy("engagementScore", "DESC")
            .limit(5)
            .getRawMany();
    }

    // Step 5: Combine and prioritize
    let allItems: any[] = [];
    if (type === "restaurant" && dishes.length > 0) allItems = dishes;
    else if (type === "leisure" && events.length > 0) allItems = events;
    else allItems = posts;

    if (!allItems.length) allItems = posts;

    if (!allItems.length)
        throw new NotFoundError("No engagement data found for this producer");

    return allItems
        .map((item) => ({
            ...item,
            engagementScore: Number(item.engagementScore) || 0,
        }))
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10);
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

export const getMonthlyAverageRating = async (producerId: number) => {
    if (!producerId) throw new BadRequestError("Producer ID is required");

    const producer = await ProducerRepository.findOne({ where: { id: producerId } });
    if (!producer) throw new BadRequestError("Producer not found");

    const type: string =
        (producer as any).type || (producer as any).producerType || (producer as any).serviceType || "";

    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);

    let avg = 0;

    switch (type.toLowerCase()) {
        case "restaurant":
            avg = await avgOverallForMonthRepo(RestaurantRatingRepository, "rr", producerId, from, to);
            break;
        case "wellness":
            avg = await avgOverallForMonthRepo(WellnessRepository, "w", producerId, from, to);
            break;
        case "leisure":
            avg = await avgOverallForMonthRepo(LeisureRepository, "l", producerId, from, to);
            break;
        default:
            avg = 0;
    }

    return { averageRating: Number.isFinite(avg) ? parseFloat(avg.toFixed(1)) : 0 };
};

export const getCustomersByRating = async (producerId: number, rating: number): Promise<Row[]> => {
    if (!producerId) throw new BadRequestError("Producer ID is required");
    if (!rating || rating < 1 || rating > 5)
        throw new BadRequestError("Rating must be between 1 and 5");

    const restaurantRows = await ReviewRepository.createQueryBuilder("rev")
        .innerJoin("rev.booking", "b")
        .innerJoin(Producer, "p", "p.userId = b.restaurantId AND p.id = :producerId", { producerId })
        .leftJoin(User, "u", "u.id = b.customerId")
        .where("(rev.overall = :rating OR rev.rating = :rating OR rev.stars = :rating)", { rating })
        .select([
            "rev.id AS ratingId",
            "COALESCE(rev.overall, rev.rating, rev.stars) AS rating",
            "u.id AS userId",
            "COALESCE(u.fullName, 'Unknown') AS userName",
            "rev.comment AS comment",
            "rev.createdAt AS date",
        ])
        .orderBy("rev.createdAt", "DESC")
        .limit(50)
        .getRawMany();

    let eventRows: Row[] = [];
    try {
        eventRows = await ReviewRepository.createQueryBuilder("rev")
            .innerJoin("rev.eventBooking", "eb")
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
        eventRows = [];
    }

    const data = [...restaurantRows, ...eventRows]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);

    return data ?? [];
};


type RatingBreakdown =
    | {
        type: "restaurant";
        overall: number;
        criteria: { service: number; place: number; portions: number; ambiance: number };
        updatedAt: Date | null;
    }
    | {
        type: "wellness";
        overall: number;
        criteria: {
            careQuality: number; cleanliness: number; welcome: number;
            valueForMoney: number; atmosphere: number; staffExperience: number;
        };
        updatedAt: Date | null;
    }
    | {
        type: "leisure";
        overall: number;
        criteria: { stageDirection: number; actorPerformance: number; textQuality: number; scenography: number };
        updatedAt: Date | null;
    };

const toNum = (v: any) => (v == null ? 0 : typeof v === "string" ? parseFloat(v) : Number(v));

export const getRatingBreakdown = async (producerId: number): Promise<RatingBreakdown | null> => {
    if (!producerId) throw new BadRequestError("Producer ID is required");

    const producer = await ProducerRepository.findOne({ where: { id: producerId } });
    if (!producer) throw new BadRequestError("Producer not found");

    const pType: string =
        (producer as any).type || (producer as any).producerType || (producer as any).serviceType || "";

    switch (pType.toLowerCase()) {
        case "restaurant": {
            const row = await RestaurantRatingRepository.findOne({ where: { producerId } });
            if (!row) return null;
            return {
                type: "restaurant",
                overall: toNum(row.overall),
                criteria: {
                    service: toNum(row.service),
                    place: toNum(row.place),
                    portions: toNum(row.portions),
                    ambiance: toNum(row.ambiance),
                },
                updatedAt: row.updatedAt ?? null,
            };
        }
        case "wellness": {
            const row = await WellnessRepository.findOne({ where: { producerId } });
            if (!row) return null;
            return {
                type: "wellness",
                overall: toNum(row.overall),
                criteria: {
                    careQuality: toNum(row.careQuality),
                    cleanliness: toNum(row.cleanliness),
                    welcome: toNum(row.welcome),
                    valueForMoney: toNum(row.valueForMoney),
                    atmosphere: toNum(row.atmosphere),
                    staffExperience: toNum(row.staffExperience),
                },
                updatedAt: row.updatedAt ?? null,
            };
        }
        case "leisure": {
            const row = await LeisureRepository.findOne({ where: { producerId } });
            if (!row) return null;
            return {
                type: "leisure",
                overall: toNum(row.overall),
                criteria: {
                    stageDirection: toNum(row.stageDirection),
                    actorPerformance: toNum(row.actorPerformance),
                    textQuality: toNum(row.textQuality),
                    scenography: toNum(row.scenography),
                },
                updatedAt: row.updatedAt ?? null,
            };
        }
        default:
            return null;
    }
};

export const getFriendsWhoPostedThisWeek = async (userId: number) => {
    // Get all accepted follows (friends)
    const friends = await FollowRepository.createQueryBuilder("f")
        .leftJoinAndSelect("f.followedUser", "u")
        .where("f.followerId = :userId", { userId })
        .andWhere("f.status = :status", { status: FollowStatusEnums.Approved })
        .getMany();

    if (friends.length === 0) {
        return {
            message: "You have no friends yet 😢",
            data: [],
        };
    }

    const friendIds = friends.map((f: any) => f.followedUserId).filter(Boolean);

    // Define this week’s UTC range
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });

    // Find posts created by friends this week
    const posts = await PostRepository.createQueryBuilder("p")
        .leftJoinAndSelect("p.user", "u")
        .where("p.userId IN (:...friendIds)", { friendIds })
        .andWhere("p.createdAt BETWEEN :start AND :end", { start, end })
        .orderBy("p.createdAt", "DESC")
        .getMany();

    if (!posts.length) {
        return {
            message: "None of your friends made any posts this week.",
            data: [],
        };
    }

    // Group posts per friend
    const grouped = posts.reduce((acc: Record<number, any>, post: any) => {
        const uid = post.user.id;
        if (!acc[uid]) {
            acc[uid] = {
                friendId: uid,
                friendName: post.user.userName,
                totalPosts: 0,
                latestPostAt: post.createdAt,
            };
        }
        acc[uid].totalPosts++;
        return acc;
    }, {});

    const result = Object.values(grouped);

    return {
        message: `${result.length} friends made a choice post this week 🎉`,
        data: result,
    };
};

export const getMostVisitedRestaurants = async (limit = 10) => {
    const qb = ProducerRepository.createQueryBuilder("producer")
        .leftJoin("producer.posts", "post")
        .select([
            "producer.id AS id",
            "producer.name AS name",
            "producer.type AS type",
            "producer.latitude AS latitude",
            "producer.longitude AS longitude",
            "producer.address AS address",
        ])
        .addSelect("COUNT(post.id)", "post_count")
        .where("producer.type = :type", { type: ProducerType.RESTAURANT })
        .andWhere("producer.isActive = true")
        .groupBy("producer.id")
        .orderBy("post_count", "DESC")
        .limit(limit);

    const data = await qb.getRawMany();

    if (!data.length) {
        return { message: "No visited restaurants found.", data: [] };
    }

    return {
        message: `Top ${data.length} most visited restaurants 🍽️`,
        data,
    };
};

export const getProducerAvailabilityByName = async (producerName: string) => {
    try {
        // Find the producer by name (case-insensitive)
        const producer = await ProducerRepository.createQueryBuilder("producer")
            .where("LOWER(producer.name) = LOWER(:name)", { name: producerName })
            .getOne();

        if (!producer) {
            throw new BadRequestError(`No restaurant found with name "${producerName}".`);
        }

        // Fetch all slots for this producer
        const availability = await getProducerSlots(producer.userId);

        // Determine display name
        const displayName =
            producer.businessName ||
            producer.name ||
            producer.displayName ||
            "this restaurant";

        return {
            message: `Availability for ${displayName}`,
            data: availability.data,
        };
    } catch (error) {
        console.error("Error in getProducerAvailabilityByName:", error);
        throw error;
    }
};

export const getOpenWellnessStudios = async () => {
    try {
        // Current UTC day + time
        const now = new Date();
        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const currentDay = days[now.getUTCDay()];
        const currentTime = now.toISOString().substring(11, 19); // "HH:MM:SS"

        // Query all active wellness producers that have open slots
        const openStudios = await ProducerRepository.createQueryBuilder("producer")
            .innerJoin("producer.user", "user")
            .innerJoin("Slot", "slot", "slot.userId = user.id") // join via foreign key
            .where("producer.type = :type", { type: BusinessRole.WELLNESS })
            .andWhere("producer.isActive = true")
            .andWhere("slot.day = :currentDay", { currentDay })
            .andWhere("slot.startTime <= :currentTime AND slot.endTime >= :currentTime", { currentTime })
            .select([
                "producer.id AS id",
                "producer.name AS name",
                "producer.address AS address",
                "slot.startTime AS openFrom",
                "slot.endTime AS openUntil",
                "slot.day AS day",
            ])
            .getRawMany();

        const formatted = openStudios.map((s: any) => ({
            id: s.id,
            name: s.name,
            address: s.address,
            openFrom: s.openfrom,
            openUntil: s.openuntil,
            day: s.day,
        }));

        return {
            message: `Currently open wellness studios (${formatted.length}) [UTC time based]`,
            data: formatted,
        };
    } catch (error) {
        console.error("Error in getOpenWellnessStudios (UTC):", error);
        throw error;
    }
};

export const getPostsByRestaurant = async (restaurantName: string, page = 1, limit = 10) => {
    // find the restaurant
    const producer = await ProducerRepository.createQueryBuilder("p")
        .where("LOWER(p.name) LIKE LOWER(:name)", { name: `%${restaurantName}%` })
        .andWhere("p.type = :type", { type: "restaurant" })
        .getOne();

    if (!producer) throw new NotFoundError("No restaurant found with that name.");

    // fetch posts related to that producer
    const [posts, total] = await PostRepository.createQueryBuilder("post")
        .where("post.producerId = :producerId", { producerId: producer.id })
        .orderBy("post.createdAt", "DESC")
        .offset((page - 1) * limit)
        .limit(limit)
        .getManyAndCount();

    return {
        message: `Found ${posts.length} posts from ${producer.name}`,
        data: posts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export * as ProducerInsightsService from "./insights.service";
