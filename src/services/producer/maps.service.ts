import { ProducerRepository } from '../../repositories';
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

export * as MapsService from './maps.service';
