import { z } from 'zod';
import { PostType, PostStatus, EmotionType } from '../../enums/post.enum';
import {
  RestaurantRatingCriteria,
  LeisureRatingCriteria,
  WellnessRatingCriteria,
} from '../../enums/rating.enum';


export const createPostSchema = z.object({
  type: z.nativeEnum(PostType),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  description: z.string().min(1),
  link: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  imageUrls: z.array(z.string()).max(5).optional(),
  userId: z.number().optional(),
  producerId: z.number().optional(),
  publishDate: z.string().datetime().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createProducerPostSchema = z.object({
  type: z.enum(['restaurant', 'leisure', 'wellness']),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  tags: z.array(z.string()).optional(),
  imageUrls: z.array(z.string().url()).max(5),
  coverImage: z.string().url().optional(),
  publishDate: z.string().optional()
});

export type CreateProducerPostInput = z.infer<typeof createProducerPostSchema>;

export const RestaurantRatingSchema = z.object({
  producerType: z.literal('restaurant'),
  comment: z.string().optional(),
  ratings: z.object({
    service: z.number().min(0).max(5),
    place: z.number().min(0).max(5),
    portions: z.number().min(0).max(5),
    ambiance: z.number().min(0).max(5),
  }),
});

export const LeisureRatingSchema = z.object({
  producerType: z.literal('leisure'),
  comment: z.string().optional(),
  ratings: z.object({
    stage_direction: z.number().min(0).max(5),
    actor_performance: z.number().min(0).max(5),
    text_quality: z.number().min(0).max(5),
    scenography: z.number().min(0).max(5),
  }),
});

export const WellnessRatingSchema = z.object({
  producerType: z.literal('wellness'),
  comment: z.string().optional(),
  ratings: z.object({
    care_quality: z.number().min(0).max(5),
    cleanliness: z.number().min(0).max(5),
    welcome: z.number().min(0).max(5),
    value_for_money: z.number().min(0).max(5),
    atmosphere: z.number().min(0).max(5),
    staff_expertise: z.number().min(0).max(5),
  }),
});

export const CreateRatingSchema = z.union([
  RestaurantRatingSchema,
  LeisureRatingSchema,
  WellnessRatingSchema,
]);

export type CreateRatingInput = z.infer<typeof CreateRatingSchema>;

export const EmotionSchema = z.object({
  emotion: z.nativeEnum(EmotionType),
});

export type CreateEmotionInput = z.infer<typeof EmotionSchema>;

export const updatePostSchema = z.object({
  // postId: z.number(),
  type: z.nativeEnum(PostType).optional(),
  status: z.nativeEnum(PostStatus).optional(),
  description: z.string().min(1).optional(),
  link: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  imageUrls: z.array(z.string()).max(5).optional(),
  publishDate: z.string().datetime().optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;