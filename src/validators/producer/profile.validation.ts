import { profile } from 'console';
import { z } from 'zod';
import { deleteRestaurantImage } from '../../services/producer/profile.service';
import { ServiceType } from '../../enums/serviceType.enum';

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
      ['GalleryImage', 'BusinessDocuments'],
      {
        required_error: 'folderName is required',
      }
    ),
  })
  .refine(
    data => {
      if (
        data.folderName === 'BusinessDocuments'
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

export const ProducerDocumentSchema = z.object({
  type: z.string().min(1, "Document type is required"),
  fileUrl: z.string().min(1, "File URL is required"),
});

export type ProducerDocumentInput = z.infer<typeof ProducerDocumentSchema>;

export const updateProfileSchema = z.object({
  businessName: z.string({ required_error: 'Business name is required' }).trim(),
  address: z.string({ required_error: 'Address is required' }).trim(),
  phoneNumber: z.string({ required_error: 'Phone number is required' }).trim(),
  website: z.string().url().optional(),
  instagram: z.string().url().optional(),
  twitter: z.string().url().optional(),
  facebook: z.string().url().optional(),
  description: z.string({ required_error: 'Description is required' }).trim(),
  profileImageUrl: z.string().optional(),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
  city: z.string().optional(),
  country: z.string().optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

const dayHourSchema = z
  .object({
    day: z.string({ required_error: 'day is required' }),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    isClosed: z.boolean().optional().default(false),
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

export const setCapacitySchema = z.object({
  totalSeats: z
    .number({ required_error: 'totalSeats is required' })
    .int('Must be an integer')
    .positive('Must be greater than 0'),
    noOfTables: z
    .number({ required_error: 'noOfTables is required' })
    .int('Must be an integer')
    .positive('Must be greater than 0'),
    maxPartySize: z
    .number({ required_error: 'maxPartySize is required' })
    .int('Must be an integer')
    .positive('Must be greater than 0'),
});

export type SetCapacitySchema = z.infer<typeof setCapacitySchema>;

export const setServiceTypeSchema = z.object({
  serviceTypeIds: z.array(z.number().int().positive()).min(1, "At least one service type is required"),
});

export type SetServiceTypeInput = z.infer<typeof setServiceTypeSchema>;

export const setGalleryImagesSchema = z.object({
  images: z
    .array(
      z.object({
        url: z
          .string()
          .min(1, 'Image URL (key) is required')
          .refine(val => !val.startsWith('http'), {
            message: 'Only S3 keys (not full URLs) are allowed',
          }),
      })
    )
    .min(1, 'At least one image is required'),
});

export type SetGalleryImages = z.infer<typeof setGalleryImagesSchema>;

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


export const addMenuDishSchema = z.object({
  userId: z.number({ required_error: 'userId is required' }),
  name: z.string({ required_error: 'name is required' }),
  price: z.number({ required_error: 'price is required' }),
  description: z.string({ required_error: 'description is required' }),
  categoryId: z.number({ required_error: 'categoryId is required' }),
});

export type AddMenuDish = z.infer<typeof addMenuDishSchema>;

export * as ProfileSchema from './profile.validation';