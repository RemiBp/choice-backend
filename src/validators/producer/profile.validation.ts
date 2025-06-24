import { profile } from 'console';
import { z } from 'zod';
import { deleteRestaurantImage } from '../../services/producer/profile.service';

export const uploadDocumentsSchema = z.object({
  userId: z.number({ required_error: 'userId is required' }),
  certificateOfHospitality: z.string({
    required_error: 'certificateOfHospitality is required',
  }),
  certificateOfTourism: z.string({
    required_error: 'certificateOfTourism is required',
  }),
});

export type UploadDocuments = z.infer<typeof uploadDocumentsSchema>;

export const presignedURLSchema = z
  .object({
    fileName: z.string({ required_error: 'fileName is required' }),
    contentType: z.string({ required_error: 'contentType is required' }),
    folderName: z.enum(
      ['restaurantProfileImage', 'restaurantGalleryImage', 'certificateOfHospitality', 'certificateOfTourism', 'menu'],
      {
        required_error: 'folderName is required',
      }
    ),
  })
  .refine(
    data => {
      if (
        data.folderName === 'certificateOfHospitality' ||
        data.folderName === 'certificateOfTourism' ||
        data.folderName === 'menu'
      ) {
        return data.contentType === 'application/pdf';
      }
      return true;
    },
    {
      message: 'contentType must be application/pdf for certificates and menu folders',
      path: ['contentType'],
    }
  );

export type PreSignedURL = z.infer<typeof presignedURLSchema>;

export const updateProfileSchema = z.object({
  restaurantName: z.string({ required_error: 'restaurantName is required' }).trim(),
  restaurantDetails: z.string({ required_error: 'restaurantDetails is required' }).trim(),
  cuisineTypeId: z.number({ required_error: 'cuisineTypeId is required' }),
  address: z.string({ required_error: 'address is required' }).trim(),
  phoneNumber: z.string({ required_error: 'phoneNumber is required' }).trim(),
  latitude: z.number({ required_error: 'latitude is required' }),
  longitude: z.number({ required_error: 'longitude is required' }),
  profilePicture: z.string({ required_error: 'profilePicture is required' }).trim(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

const dayHourSchema = z
  .object({
    day: z.string({ required_error: 'day is required' }),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    isClosed: z.boolean().optional(),
  })
  .refine(
    data => {
      if (data.isClosed === true) return true;
      return !!data.startTime && !!data.endTime;
    },
    {
      message: 'Provide either startTime and endTime, or set isClosed to true',
    }
  );

export const setOperationHoursSchema = z.object({
  restaurantId: z.number({ required_error: 'restaurantId is required' }),
  hours: z.array(dayHourSchema).length(7, 'Exactly 7 days of hours must be provided'),
});

export type SetOperationHoursSchema = z.infer<typeof setOperationHoursSchema>;

export * as ProfileSchema from './profile.validation';

export const uploadRestaurantImagesSchema = z.object({
  restaurantId: z.number({ required_error: 'restaurantId is required' }),
  images: z
    .array(
      z.object({
        url: z.string({ required_error: 'Image URL is required' }).url('Invalid image URL'),
        isMain: z.boolean().optional(),
      })
    )
    .min(1, 'At least one image is required'),
});

export type UploadRestaurantImagesSchema = z.infer<typeof uploadRestaurantImagesSchema>;

export const setMainImageSchema = z.object({
  restaurantId: z.number({ required_error: 'restaurantId is required' }),
  imageId: z.number({ required_error: 'imageId is required' }),
});

export type SetMainImageSchema = z.infer<typeof setMainImageSchema>;

export const getRestaurantImagesSchema = z.object({
  restaurantId: z.number({ required_error: 'restaurantId is required' }),
  page: z.number({ required_error: 'page is required' }),
  limit: z.number({ required_error: 'limit is required' }),
});

export type GetRestaurantImagesSchema = z.infer<typeof getRestaurantImagesSchema>;

export const deleteRestaurantImageSchema = z.object({
  restaurantId: z.number({ required_error: 'restaurantId is required' }),
  imageId: z.number({ required_error: 'imageId is required' }),
});

export type DeleteRestaurantImageSchema = z.infer<typeof deleteRestaurantImageSchema>;

export const reviewsAndRatingsSchema = z.object({
  userId: z.number({ required_error: 'restaurantId is required' }),
  page: z.number({ required_error: 'page is required' }),
  limit: z.number({ required_error: 'limit is required' }),
  filter: z.enum(['oldest', 'highest']).optional(),
});

export type ReviewsAndRatingsSchema = z.infer<typeof reviewsAndRatingsSchema>;
