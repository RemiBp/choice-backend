import { FollowStatusEnums } from '../../enums/followStatus.enum';
import { NotFoundError } from '../../errors/notFound.error';
import { FollowRepository, PostRepository, ProducerRepository } from '../../repositories';
import { ChoiceMapInput, GetFilteredRestaurantsInput, NearbyProducersInput } from '../../validators/producer/maps.validation';

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
