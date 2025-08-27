export enum CommonWellnessRatingCriteria {
    CARE_QUALITY = 'careQuality',
    CLEANLINESS = 'cleanliness',
    WELCOME = 'welcome',
    VALUE_FOR_MONEY = 'valueForMoney',
    ATMOSPHERE = 'atmosphere',
    STAFF_EXPERTISE = 'staffExperience',
}

export enum HairWellnessRatingCriteria {
  HAIRCUT_QUALITY = "haircutQuality",
  EXPECTATION_RESPECT = "expectationRespect",
  ADVICE = "advice",
  PRODUCTS_USED = "productsUsed",
  PRICING = "pricing",
  PUNCTUALITY = "punctuality",
}

export enum ArtisticWellnessRatingCriteria {
  PRECISION = "precision",
  HYGIENE = "hygiene",
  CREATIVITY = "creativity",
  DURABILITY = "durability",
  ADVICE = "advice",
  PAIN_EXPERIENCE = "painExperience",
}


export type RatingCriteria = CommonWellnessRatingCriteria | HairWellnessRatingCriteria | ArtisticWellnessRatingCriteria;
