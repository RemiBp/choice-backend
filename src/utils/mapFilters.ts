import { SelectQueryBuilder } from "typeorm";
import Producer from "../models/Producer";
import { NearbyProducersInput } from "../validators/producer/maps.validation";

// Restaurant Filters
export const applyRestaurantFilters = (qb: SelectQueryBuilder<Producer>, filters: NearbyProducersInput) => {
    //  Join ratings once
    qb.leftJoin("RestaurantRatings", "rr", "rr.producerId = p.id");

    if (filters.cuisine) {
        qb.innerJoin("p.cuisineType", "ct")
            .andWhere("ct.name = :cuisine", { cuisine: filters.cuisine });
    }

    if (filters.dishName || filters.minDishRating) {
        qb.innerJoin("MenuCategory", "mc", "mc.producerId = p.id")
            .innerJoin("MenuDishes", "md", "md.menuCategoryId = mc.id");

        if (filters.dishName) {
            qb.andWhere(`"md"."name" ILIKE :dishName`, { dishName: `%${filters.dishName}%` });
        }

        if (filters.minDishRating) {
            qb.andWhere("md.rating ->> 'average' >= :minDishRating", { minDishRating: filters.minDishRating });
        }
    }

    //  Rating filters
    if (filters.minAmbiance) {
        qb.andWhere("rr.ambiance >= :ambiance", { ambiance: filters.minAmbiance });
    }
    if (filters.minService) {
        qb.andWhere("rr.service >= :service", { service: filters.minService });
    }
    if (filters.minPortions) {
        qb.andWhere("rr.portions >= :portions", { portions: filters.minPortions });
    }
    if (filters.minPlace) {
        qb.andWhere("rr.place >= :place", { place: filters.minPlace });
    }

    //  Dish rating filter
    if (filters.minDishRating) {
        qb.leftJoin("DishRatings", "dr", "dr.dishId = md.id")
            .andWhere("dr.rating >= :dishRating", { dishRating: filters.minDishRating });
    }
};

// Leisure Filters
export const applyLeisureFilters = (qb: SelectQueryBuilder<Producer>, filters: NearbyProducersInput) => {
    qb.innerJoin("Leisure", "l", "l.producerId = p.id");

    if (filters.venue || filters.event) {
        qb.innerJoin("Events", "e", "e.producerId = p.id");

        if (filters.venue) {
            qb.innerJoin("EventTypes", "et", "et.id = e.eventTypeId")
                .andWhere("et.name = :venue", { venue: filters.venue });
        }

        if (filters.event) {
            qb.andWhere("e.title ILIKE :event", { event: `%${filters.event}%` });
        }
    }

    if (filters.minStageDirection) {
        qb.andWhere("l.stageDirection >= :stageDirection", { stageDirection: filters.minStageDirection });
    }
    if (filters.minActorPerformance) {
        qb.andWhere("l.actorPerformance >= :actorPerformance", { actorPerformance: filters.minActorPerformance });
    }
    if (filters.minTextQuality) {
        qb.andWhere("l.textQuality >= :textQuality", { textQuality: filters.minTextQuality });
    }
    if (filters.minScenography) {
        qb.andWhere("l.scenography >= :scenography", { scenography: filters.minScenography });
    }
};

// Wellness Filters
export const applyWellnessFilters = (qb: SelectQueryBuilder<Producer>, filters: NearbyProducersInput) => {
    qb.innerJoin("Wellness", "w", "w.producerId = p.id");

    if (filters.venue) {
        qb.innerJoin("WellnessServices", "ws", "ws.wellnessId = w.id")
            .innerJoin("WellnessServiceTypes", "wst", "wst.id = ws.serviceTypeId")
            .andWhere("wst.name = :venue", { venue: filters.venue });
    }

    if (filters.minCareQuality) {
        qb.andWhere("w.careQuality >= :careQuality", { careQuality: filters.minCareQuality });
    }
    if (filters.minCleanliness) {
        qb.andWhere("w.cleanliness >= :cleanliness", { cleanliness: filters.minCleanliness });
    }
    if (filters.minWelcome) {
        qb.andWhere("w.welcome >= :welcome", { welcome: filters.minWelcome });
    }
    if (filters.minValueForMoney) {
        qb.andWhere("w.valueForMoney >= :valueForMoney", { valueForMoney: filters.minValueForMoney });
    }
    if (filters.minAtmosphere) {
        qb.andWhere("w.atmosphere >= :atmosphere", { atmosphere: filters.minAtmosphere });
    }
    if (filters.minStaffExperience) {
        qb.andWhere("w.staffExperience >= :staffExperience", { staffExperience: filters.minStaffExperience });
    }
    if (filters.minAverageScore) {
        qb.andWhere("w.overall >= :averageScore", { averageScore: filters.minAverageScore });
    }
};