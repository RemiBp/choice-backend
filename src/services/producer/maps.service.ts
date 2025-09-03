import { FollowStatusEnums } from '../../enums/followStatus.enum';
import { OfferStatus } from '../../enums/offer.enum';
import { NotFoundError } from '../../errors/notFound.error';
import { FollowRepository, PostRepository, ProducerOfferRepository, ProducerRepository, UserRepository } from '../../repositories';
import { ChoiceMapInput, createOfferInput, GetFilteredRestaurantsInput, NearbyProducersInput } from '../../validators/producer/maps.validation';

const EARTH_RADIUS_KM = 6371;

export const getNearbyProducers = async ({
    latitude,
    longitude,
    radius,
    type,
    limit = 30,
    page = 1,
}: NearbyProducersInput) => {
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
        .orderBy("distance_km", "ASC")
        .offset((page - 1) * limit)
        .limit(limit);

    if (type) {
        qb.andWhere("p.type = :type", { type });
    }

    const rows = await qb.getRawMany();
    return rows;
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

    const offer = ProducerOfferRepository.create({
        producer,
        producerId: producer.id,
        title: data.title,
        message: data.message,
        discountPercent: data.discountPercent,
        validityMinutes: data.validityMinutes,
        maxRecipients: data.maxRecipients,
        radiusMeters: data.radiusMeters,
        imageUrl: data.imageUrl,
        scheduledAt,
        expiresAt,
        status: data.scheduledAt ? OfferStatus.DRAFT : OfferStatus.ACTIVE,
    });

    await ProducerOfferRepository.save(offer);
    return offer;
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
        where: { producerId: id, isDeleted: false },
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

export * as MapsService from './maps.service';
