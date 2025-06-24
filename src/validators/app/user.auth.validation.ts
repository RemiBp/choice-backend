import { z } from 'zod';

export const userSignUpSchema = z.object({
  fullName: z.string({ required_error: 'fullName is required' }).trim(),
  userName: z.string({ required_error: 'userName is required' }).trim()
    .min(3, 'userName must be at least 3 characters long')
    .max(30, 'userName must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'userName can only contain letters, numbers, and underscores'),
  email: z.string({ required_error: 'Email is required' }).trim()
    .email({ message: 'Invalid email' })
    .transform(val => val.toLowerCase()),
  password: z.string({ required_error: 'Password is required' }).trim()
    .min(1, 'Password is required'),
  phoneNumber: z.string({ required_error: 'Phone number is required' }).trim()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
});

export type UserSignUp = z.infer<typeof userSignUpSchema>;

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6).max(32, 'Password must be between 6 and 32 characters'),
  deviceId: z.string(),
});

export type UserLoginSchema = z.infer<typeof userLoginSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(6).max(6, 'otp must be of length 6'),
});

export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;

export const userForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type UserForgotPassword = z.infer<typeof userForgotPasswordSchema>;

export const userResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string({ required_error: 'OTP is required' }).trim(),
  password: z.string({ required_error: 'Password is required' }).trim(),
});

export type UserResetPassword = z.infer<typeof userResetPasswordSchema>;

export const VerifyOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'Invalid email' })
    .transform(val => val.toLowerCase()),
  otp: z.string({ required_error: 'OTP is required' }).trim(),
});

export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
