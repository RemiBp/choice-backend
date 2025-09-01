import { z } from "zod";

const score = (field: string) =>
  z
    .number({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a number`,
    })
    .min(0, { message: `${field} must be >= 0` })
    .max(5, { message: `${field} must be <= 5` });

export const RestaurantAIRatingSchema = z.object({
  ai_service: score("ai_service"),
  ai_place: score("ai_place"),
  ai_portions: score("ai_portions"),
  ai_ambiance: score("ai_ambiance"),
  ai_overall: score("ai_overall"),
});

export const LeisureAIRatingSchema = z.object({
  ai_stageDirection: score("ai_stageDirection"),
  ai_actorPerformance: score("ai_actorPerformance"),
  ai_textQuality: score("ai_textQuality"),
  ai_scenography: score("ai_scenography"),
  ai_overall: score("ai_overall"),
});

export const WellnessAIRatingSchema = z.object({
  ai_careQuality: score("ai_careQuality"),
  ai_cleanliness: score("ai_cleanliness"),
  ai_welcome: score("ai_welcome"),
  ai_valueForMoney: score("ai_valueForMoney"),
  ai_atmosphere: score("ai_atmosphere"),
  ai_staffExperience: score("ai_staffExperience"),
  ai_overall: score("ai_overall"),
});

export type RestaurantAIRatingInput = z.infer<typeof RestaurantAIRatingSchema>;
export type LeisureAIRatingInput = z.infer<typeof LeisureAIRatingSchema>;
export type WellnessAIRatingInput = z.infer<typeof WellnessAIRatingSchema>;
