import PostgresDataSource from '../../data-source';
import { FollowStatusEnums } from '../../enums/followStatus.enum';
import { NotificationTypeEnums } from '../../enums/notification.type.enum';
import { NotificationStatusCode } from '../../enums/NotificationStatusCode.enum';
import { OfferStatus } from '../../enums/offer.enum';
import { NotFoundError } from '../../errors/notFound.error';
import Post from '../../models/Post';
import User from '../../models/User';
import { FollowRepository, NotificationRepository, PostRepository, ProducerOfferRepository, ProducerRepository, UserRepository } from '../../repositories';
import { applyLeisureFilters, applyRestaurantFilters, applyWellnessFilters } from '../../utils/mapFilters';
import { sendNotification } from '../../utils/notificationHelper';
import { sendAdminNotification } from '../../utils/sendAdminNotification';
import { ChoiceMapInput, createOfferInput, GetFilteredRestaurantsInput, GetProducerHeatmapInput, NearbyProducersInput, SendOfferNotificationInput } from '../../validators/producer/maps.validation';

const EARTH_RADIUS_KM = 6371;

export const getNearbyProducers = async (data: NearbyProducersInput) => {
    const { latitude, longitude, radius, type, limit = 30, page = 1, sort } = data;

    const distExpr = `${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(:lat - p.latitude) / 2), 2) +
    COS(RADIANS(:lat)) * COS(RADIANS(p.latitude)) *
    POWER(SIN(RADIANS(:lng - p.longitude) / 2), 2)
  ))`;

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
        .andWhere("p.isActive = true")
        .andWhere("p.latitude IS NOT NULL AND p.longitude IS NOT NULL")
        .andWhere(`${distExpr} <= :radius`, { radius })
        .setParameters({ lat: latitude, lng: longitude })
        .offset((page - 1) * limit)
        .limit(limit);

    if (type) {
        qb.andWhere("p.type = :type", { type });

        const filterAppliers = {
            "restaurant": applyRestaurantFilters,
            "leisure": applyLeisureFilters,
            "wellness": applyWellnessFilters,
        };

        if (type && type in filterAppliers) {
            filterAppliers[type](qb, data);
        }
    }

    if (sort === "rating") {
        qb.orderBy("p.globalRating", "DESC");
    } else {
        qb.orderBy("distance_km", "ASC");
    }

    return qb.getRawMany();
};

export const getNearbyUsers = async ({ latitude, longitude, radius, }: ChoiceMapInput) => {
    try {
        if (!latitude || !longitude) {
            throw new Error("Latitude and longitude are required");
        }

        const distExpr = `
      ${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(:lat - u.latitude) / 2), 2) +
        COS(RADIANS(:lat)) * COS(RADIANS(u.latitude)) *
        POWER(SIN(RADIANS(:lng - u.longitude) / 2), 2)
      ))
    `;

        const qb = UserRepository.createQueryBuilder("u")
            .select([
                "u.id AS id",
                "u.fullName AS fullName",
                "u.userName AS userName",
                "u.followingCount AS followingCount",
                "u.followersCount AS followersCount",
                "u.latitude AS latitude",
                "u.longitude AS longitude",
                "u.bio AS bio"
            ])
            .addSelect(`${distExpr}`, "distance_km")
            .where("u.isActive = :isActive", { isActive: true })
            .andWhere("u.latitude IS NOT NULL")
            .andWhere("u.longitude IS NOT NULL")
            .andWhere(`${distExpr} <= :radius`)
            .setParameters({
                lat: latitude,
                lng: longitude,
                radius: radius
            })
            .orderBy("distance_km", "ASC")

        const users = await qb.getRawMany();

        return users;
    } catch (error) {
        console.error("Error fetching nearby users:", error);
        throw new Error("Failed to fetch nearby users");
    }
};

export const createProducerOffer = async (data: createOfferInput) => {
    const producer = await ProducerRepository.findOneBy({ id: data.producerId });
    if (!producer) throw new NotFoundError("Producer not found");

    const now = new Date();
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : now;
    const expiresAt = new Date(scheduledAt.getTime() + data.validityMinutes * 60 * 1000);

    return await ProducerOfferRepository.save({
        ...data,
        producer, // add relation after spread
        producerId: producer.id,
        scheduledAt,
        expiresAt,
        status: data.scheduledAt ? OfferStatus.DRAFT : OfferStatus.ACTIVE,
        isTemplate: !!data.saveAsTemplate,
    });
};

export const getOfferTemplates = async (producerId: number) => {
    const producer = await ProducerRepository.findOneBy({ id: producerId });
    if (!producer) throw new NotFoundError("Producer not found");

    const templates = await ProducerOfferRepository.find({
        where: { producerId, isTemplate: true },
        order: { createdAt: "DESC" },
    });

    return templates;
};

export const getProducerOffers = async (producerId: number) => {
    const producer = await ProducerRepository.findOneBy({ id: producerId });
    if (!producer) throw new NotFoundError("Producer not found");

    const offers = await ProducerOfferRepository.find({
        where: { producerId },
        order: { createdAt: "DESC" },
    });

    return offers;
};

export const getUserLiveOffers = async (userId: number) => {
    // Fetch notifications where this user was the receiver
    const notifications = await NotificationRepository.createQueryBuilder("n")
        .innerJoinAndSelect("n.sender", "s")
        .innerJoinAndSelect("n.receiver", "r")
        .where("n.receiver.id = :userId", { userId })
        .andWhere("n.type = :type", { type: NotificationTypeEnums.OFFER })
        .getMany();

    if (notifications.length === 0) return [];

    // Get all unique offer IDs from notifications
    const offerIds = notifications.map((n: any) => n.jobId).filter(Boolean);
    if (offerIds.length === 0) return [];

    // Fetch those offers (that are not expired)
    const offers = await ProducerOfferRepository.createQueryBuilder("offer")
        .innerJoinAndSelect("offer.producer")
        .where("offer.id IN (:...offerIds)", { offerIds })
        // .andWhere("offer.expiresAt > NOW()")
        .andWhere("offer.status IN (:...statuses)", { statuses: ["SENT", "ACTIVE"] })
        .getMany();

    // Format the result
    return offers;
};

export const getProducerDetails = async (id: number) => {
    const producer = await ProducerRepository.findOne({
        where: { id },
        relations: ["photos", "openingHours", "user"],
    });

    if (!producer) throw new NotFoundError("Producer not found");

    const postsCount = await PostRepository.count({ where: { producerId: id } });
    const followersCount = await FollowRepository.count({ where: { producerId: id } });
    const followingCount = await FollowRepository.count({
        where: { followerId: producer.user.id, status: FollowStatusEnums.Approved },
    });

    const recentPosts = await PostRepository.find({
        where: { producerId: id },
        relations: ["images"],
        order: { createdAt: "DESC" },
        take: 5,
    });

    return {
        ...producer,
        postsCount,
        followersCount,
        followingCount,
        recentPosts,
    };
};

export const getProducerHeatmap = async (data: GetProducerHeatmapInput) => {
    const { producerId } = data;

    try {
        const qb = PostgresDataSource.getRepository(Post)
            .createQueryBuilder("post")
            .innerJoin(User, "user", "user.id = post.userId")
            .select([
                `ROUND("user"."latitude"::numeric, 4) AS lat`,
                `ROUND("user"."longitude"::numeric, 4) AS lng`,
                `COUNT(DISTINCT "user"."id") AS count`,
                `ARRAY_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'id', "user"."id",
          'username', "user"."userName",
          'email', "user"."email"
        )) AS users`,
            ])
            .where("post.producerId = :producerId", { producerId })
            .andWhere("user.latitude IS NOT NULL AND user.longitude IS NOT NULL")
            .groupBy(`ROUND("user"."latitude"::numeric, 4), ROUND("user"."longitude"::numeric, 4)`);

        const rawData = await qb.getRawMany();

        return rawData;
    } catch (error) {
        console.error("Error in getProducerHeatmap:", error);
        throw new Error("Failed to fetch heatmap data");
    }
};

export const sendOfferNotification = async (data: SendOfferNotificationInput) => {
    const { offerId, latitude, longitude } = data;

    const offer = await ProducerOfferRepository.findOne({
        where: { id: offerId },
        relations: ["producer"],
    });
    if (!offer) throw new NotFoundError("Offer not found");

    const { producer, maxRecipients, discountPercent, title, message } = offer;

    const radius = offer.radiusMeters;
    const users = await getNearbyUsers({ latitude, longitude, radius });
    const targetUsers = users.slice(0, maxRecipients).filter((user: any) => user.id && user.deviceId);

    // Send all notifications in parallel
    const notificationPromises = targetUsers.map((user: any) =>
        sendNotification({
            senderId: producer.userId,
            receiverId: user.id!,
            notificationCode: NotificationStatusCode.OFFER_SENT,
            jobId: offer.id,
            title: `${discountPercent}% Off! ${title}`,
            body: message,
            type: NotificationTypeEnums.OFFER,
            purpose: NotificationTypeEnums.OFFER,
            restaurantName: producer.name,
            profilePicture: producer.logoUrl || "",
            fcmToken: user.deviceId!,
            extraPayload: {
                offerId: String(offer.id),
            },
        })
    );

    // Wait for all notifications to complete
    await Promise.all(notificationPromises);

    // Update only status, not expiresAt
    offer.status = OfferStatus.SENT;
    await ProducerOfferRepository.save(offer);

    return offer;
};

export * as MapsService from './maps.service';
