export enum RestaurantRatingCriteria {
    SERVICE = 'service',
    PLACE = 'place',
    PORTIONS = 'portions',
    AMBIANCE = 'ambiance',
}

export enum LeisureRatingCriteria {
    STAGE_DIRECTION = 'stageDirection',
    ACTOR_PERFORMANCE = 'actorPerformance',
    TEXT_QUALITY = 'textQuality',
    SCENOGRAPHY = 'scenography',
}

export enum WellnessRatingCriteria {
    CARE_QUALITY = 'careQuality',
    CLEANLINESS = 'cleanliness',
    WELCOME = 'welcome',
    VALUE_FOR_MONEY = 'valueForMoney',
    ATMOSPHERE = 'atmosphere',
    STAFF_EXPERTISE = 'staffExperience',
}

export type RatingCriteria = RestaurantRatingCriteria | LeisureRatingCriteria | WellnessRatingCriteria;
