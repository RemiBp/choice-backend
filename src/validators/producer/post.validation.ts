import { z } from 'zod';
import { PostType, PostStatus, EmotionType } from '../../enums/post.enum';
import {
  RestaurantRatingCriteria,
  LeisureRatingCriteria,
  WellnessRatingCriteria,
} from '../../enums/rating.enum';

export const createPostSchema = z.object({
  type: z.nativeEnum(PostType, {
    required_error: "Post type is required",
    invalid_type_error: "Invalid post type",
  }),

  status: z.nativeEnum(PostStatus)
    .default(PostStatus.DRAFT)
    .describe("Post status (default: DRAFT)"),

  description: z.string({
    required_error: "Description is required",
    invalid_type_error: "Description must be text",
  }).min(1, "Description cannot be empty"),

  link: z.string()
    .url("Invalid URL format (e.g., https://example.com)")
    .optional(),

  tags: z.array(z.string())
    .optional()
    .describe("Tags (e.g., ['tech', 'design'])"),

  coverImage: z.string()
    .optional()
    .describe("Cover image URL"),

  imageUrls: z.array(z.string())
    .max(5, "Maximum 5 images allowed")
    .optional(),

  userId: z.number({
    required_error: "User ID is required",
    invalid_type_error: "User ID must be a number",
  })
    .int("User ID must be an integer")
    .positive("User ID must be positive"),

  placeId: z.number({
    required_error: "Place ID is required",
    invalid_type_error: "PLace ID must be a number",
  }),

  publishDate: z.string()
    .datetime("Invalid ISO 8601 date format (e.g., 2023-01-01T00:00:00Z)")
    .optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createProducerPostSchema = z.object({
  type: z.enum(['restaurant', 'leisure', 'wellness'], {
    required_error: 'Producer type is required',
    invalid_type_error: 'Invalid producer type',
  }),

  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT).describe('Post status'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  tags: z.array(z.string()).optional(),
  imageUrls: z.array(z.string().url()).max(5, 'Maximum 5 images allowed'),
  coverImage: z.string().url('Invalid cover image URL').optional(),
  publishDate: z.string().datetime('Invalid ISO date format').optional(),

  userId: z.number({
    required_error: 'User ID is required',
    invalid_type_error: 'User ID must be a number',
  })
    .int('User ID must be an integer')
    .positive('User ID must be positive'),

  roleName: z.string({
    required_error: 'Role name is required',
    invalid_type_error: 'Role name must be a string',
  }),
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
    stageDirection: z.number().min(0).max(5),
    actorPerformance: z.number().min(0).max(5),
    textQuality: z.number().min(0).max(5),
    scenography: z.number().min(0).max(5),
  }),
});

export const WellnessRatingSchema = z.object({
  producerType: z.literal('wellness'),
  comment: z.string().optional(),
  ratings: z.object({
    careQuality: z.number().min(0).max(5),
    cleanliness: z.number().min(0).max(5),
    welcome: z.number().min(0).max(5),
    valueForMoney: z.number().min(0).max(5),
    atmosphere: z.number().min(0).max(5),
    staffExperience: z.number().min(0).max(5),
  }),
});

export const CreateRatingSchema = z.union([
  RestaurantRatingSchema,
  LeisureRatingSchema,
  WellnessRatingSchema,
]);

export type CreateRatingInput = z.infer<typeof CreateRatingSchema>;

export const singleDishRatingSchema = z.object({
  dishId: z.number({
    required_error: "dishId is required",
    invalid_type_error: "dishId must be a number",
  }),
  rating: z
    .number({
      required_error: "rating is required",
      invalid_type_error: "rating must be a number",
    })
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be at most 5" }),
});

export const createDishRatingsSchema = z.object({
  postId: z.number({
    required_error: "postId is required",
    invalid_type_error: "postId must be a number",
  }),
  ratings: z
    .array(singleDishRatingSchema, {
      required_error: "ratings are required",
      invalid_type_error: "ratings must be an array",
    })
    .min(1, { message: "At least one dish rating is required" }),
});

export type CreateDishRatingsInput = z.infer<typeof createDishRatingsSchema>;

export const CreateServiceRatingsSchema = z.object({
  postId: z.number({
    required_error: "postId is required",
    invalid_type_error: "postId must be a number",
  }),
  serviceTypeId: z.number({
    required_error: "serviceTypeId is required",
    invalid_type_error: "serviceTypeId must be a number",
  }),
  ratings: z.record(
    z.number({
      required_error: "rating is required",
      invalid_type_error: "rating must be a number",
    })
      .min(0, { message: "rating must be greater than or equal to 0" })
      .max(5, { message: "rating must be less than or equal to 5" })
  )
});

export type CreateServiceRatingsInput = z.infer<typeof CreateServiceRatingsSchema>;

export const CreateEventRatingsSchema = z.object({
  postId: z.number({
    required_error: "postId is required",
    invalid_type_error: "postId must be a number",
  }).int({ message: "postId must be an integer" }),

  eventId: z.number({
    required_error: "eventId is required",
    invalid_type_error: "eventId must be a number",
  }).int({ message: "eventId must be an integer" }),

  ratings: z.array(
    z.object({
      criteria: z.string({
        required_error: "criteria is required",
        invalid_type_error: "criteria must be a string",
      }),
      rating: z.number({
        required_error: "rating is required",
        invalid_type_error: "rating must be a number",
      })
        .min(0, { message: "rating must be greater than or equal to 0" })
        .max(5, { message: "rating must be less than or equal to 5" }),
    })
  ).min(1, { message: "At least one rating is required" }),
});

export type CreateEventRatingsInput = z.infer<typeof CreateEventRatingsSchema>;

export const EmotionSchema = z.object({
  emotions: z.array(z.nativeEnum(EmotionType)).min(1, "At least one emotion is required"),
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

export const toggleFollowSchema = z.object({
  producerId: z.number().optional(),
  followedUserId: z.number().optional(),
}).superRefine((data, ctx) => {
  if (!data.producerId && !data.followedUserId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Must provide either producerId or followedUserId',
      path: ['producerId'],
    });
  }

  if (data.producerId && data.followedUserId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cannot follow both a user and a producer at once',
      path: ['producerId'],
    });
  }
});

export type ToggleFollowInput = z.infer<typeof toggleFollowSchema>;