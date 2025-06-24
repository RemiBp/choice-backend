import { z } from 'zod';

export const signUpSchema = z.object({
  restaurantName: z.string({ required_error: 'restaurantName is required' }).trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'Invalid email' })
    .transform(val => val.toLowerCase()),
  phoneNumber: z.string({ required_error: 'phone is required' }).trim(),
  cuisineTypeId: z.number({ required_error: 'cuisineTypeId is required' }),
  address: z.string({ required_error: 'address is required' }).trim(),
  password: z.string({ required_error: 'Password is required' }).trim(),
  restaurantDetails: z.string({ required_error: 'restaurantDetails is required' }).trim(),
  latitude: z.number({ required_error: 'latitude is required' }),
  longitude: z.number({ required_error: 'longitude is required' }),
});

export type SignUp = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6).max(32, 'Password must be between 6 and 32 characters'),
  deviceId: z.string(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(6).max(6, 'otp must be of length 6'),
});

export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string({ required_error: 'OTP is required' }).trim(),
  password: z.string({ required_error: 'Password is required' }).trim(),
});

export type ResetPassword = z.infer<typeof resetPasswordSchema>;

export const verifyOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'Invalid email' })
    .transform(val => val.toLowerCase()),
  otp: z.string({ required_error: 'OTP is required' }).trim(),
});

export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
