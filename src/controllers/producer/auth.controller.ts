import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../../services/producer/auth.service';
import {
  signUpSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  createProducerSchema,
  getPresignedDocumentSchema,
  submitDocumentsSchema,
} from '../../validators/producer/auth.validation';
import { presignedURLSchema, ProducerDocumentSchema } from '../../validators/producer/profile.validation';
import { sendApiResponse } from '../../utils/sendApiResponse';

export const createProducer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedInput = createProducerSchema.parse(req.body);
    const result = await AuthService.createProducer(validatedInput);
    res.status(201).json({ message: 'Producer created successfully', data: result });
  } catch (error) {
    next(error);
  }
};

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

export const switchProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const result = await AuthService.switchProfile(userId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const saveDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const document = ProducerDocumentSchema.parse(req.body);

    const saved = await AuthService.saveDocument(userId, document);

    return sendApiResponse(res, 201, "Document uploaded successfully", saved);
  } catch (err) {
    next(err);
  }
};


export const getPreSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const fileName = req.body.fileName;
    const contentType = req.body.contentType;
    const folderName = req.body.folderName;
    if (!userId) {
      throw new Error('userId is required');
    }
    const validatedObject = presignedURLSchema.parse({
      fileName,
      contentType,
      folderName,
    });
    const response = await AuthService.getPreSignedUrl(userId, validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const submitDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const validated = submitDocumentsSchema.parse(req.body);
    await AuthService.submitDocument(userId, validated);

    res.status(200).json({ message: 'Documents submitted successfully' });
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
    const { deviceId, provider, token, roleName } = req.body;
    if (!deviceId) {
      throw new Error('deviceId is required');
    }
    if (!provider) {
      throw new Error('provider is required');
    }
    if (!token) {
      throw new Error('token is required');
    }
    if (!roleName) {
      throw new Error('roleName is required');
    }
    const response = await AuthService.socialLogin(deviceId, provider, token, roleName);
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
