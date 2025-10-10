import { z } from 'zod';

export const presignedURLSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  folderName: z.enum([
    'userProfileImages',
    'companyProfileImages',
    'technicianProfileImages',
    'licenseCardFrontUrl',
    'licenseCardBackUrl',
    'serviceImages',
    'serviceItemImagesFromTechnician',
  ]),
});

export type PreSignedURL = z.infer<typeof presignedURLSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  profileImageUrl: z.string().url("Invalid image URL").optional(),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().min(2).max(255).optional(),
  userName: z.string().min(2).max(255).optional(),
  bio: z.string().max(500).optional(),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

export const accountDeleteSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6).max(32, 'Password must be between 6 and 32 characters'),
});

export type AccountDeleteSchema = z.infer<typeof accountDeleteSchema>;

export * as ProfileSchema from './user.profile.validation';

export const GetMyFriendsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type GetMyFriendsInput = z.infer<typeof GetMyFriendsSchema>;