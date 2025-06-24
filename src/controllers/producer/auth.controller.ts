import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../../services/producer/auth.service';
import {
  signUpSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '../../validators/producer/auth.validation';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedInput = signUpSchema.parse(req.body);
    const response = await AuthService.register(validatedInput);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, deviceId } = req.body;
    const validatedRequest = loginSchema.parse({
      email,
      password,
      deviceId,
    });
    const response = await AuthService.login(validatedRequest);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const validatedRequest = verifyOtpSchema.parse({
      email,
      otp,
    });
    const response = await AuthService.verifyOtp(validatedRequest);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const resendSignUpOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const validatedRequest = forgotPasswordSchema.parse({
      email,
    });
    const response = await AuthService.resendSignUpOtp(validatedRequest);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const validatedRequest = forgotPasswordSchema.parse({
      email,
    });
    const response = await AuthService.forgotPassword(validatedRequest);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const resendForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const validatedRequest = forgotPasswordSchema.parse({
      email,
    });
    const response = await AuthService.resendForgotPasswordOtp(validatedRequest);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const verifyForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const validatedRequest = verifyOtpSchema.parse({
      email,
      otp,
    });
    const response = await AuthService.verifyForgotPasswordOtp(validatedRequest);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, password } = req.body;
    const validatedRequest = resetPasswordSchema.parse({
      email,
      otp,
      password,
    });
    const response = await AuthService.resetPassword(validatedRequest);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const response = await AuthService.refreshAccessToken(refreshToken);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const socialLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId, provider, token } = req.body;
    if (!deviceId) {
      throw new Error('deviceId is required');
    }
    if (!provider) {
      throw new Error('provider is required');
    }
    if (!token) {
      throw new Error('token is required');
    }
    const response = await AuthService.socialLogin(deviceId, provider, token);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const checkTokenDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.body;
    const response = await AuthService.checkTokenDetails(accessToken);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCuisineTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const response = await AuthService.getCuisineTypes(page, limit);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export * as AuthController from './auth.controller';
