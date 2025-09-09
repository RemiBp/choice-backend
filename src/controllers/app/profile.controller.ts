import { NextFunction, Request, Response } from 'express';
import {
  accountDeleteSchema,
  presignedURLSchema,
  updateProfileSchema,
} from '../../validators/app/user.profile.validation';
import { ProfileService } from '../../services/app/profile.service';
import { BadRequestError } from '../../errors/badRequest.error';
import { GetUserDetailSchema, SearchUsersSchema } from '../../validators/producer/post.validation';
import { sendApiResponse } from '../../utils/sendApiResponse';

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedObject = updateProfileSchema.parse(req.body);
    const userId = Number(req.userId);
    const response = await ProfileService.updateProfile(userId, validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const response = await ProfileService.getProfile(userId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const { query } = SearchUsersSchema.parse(req.query);

    const users = await ProfileService.searchUsers(userId, query);
    return sendApiResponse(res, 200, "Users fetched successfully", users);
  } catch (error) {
    console.error("Error in searchUsers controller:", error);
    next(error);
  }
};

export const getUserDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = GetUserDetailSchema.parse(req.params);

    const user = await ProfileService.getUserDetailById(userId);
    return sendApiResponse(res, 200, "User fetched successfully", user);
  } catch (error) {
    next(error);
  }
};

export const getPreSignedUrlForProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const fileName = req.body.fileName;
    const contentType = req.body.contentType;
    const folderName = 'userProfileImages';
    if (!userId) {
      throw new Error('User id is required');
    }
    const validatedObject = presignedURLSchema.parse({
      fileName,
      contentType,
      folderName,
    });
    const response = await ProfileService.getPreSignedUrlForProfileImage(userId, validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const changeCurrentPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const newPassword = req.body.newPassword;
    if (!newPassword) {
      return res.status(400).json({ message: 'newPassword are required' });
    }
    if (!userId) {
      throw new Error('userId is required');
    }
    const response = await ProfileService.changeCurrentPassword(userId, newPassword);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getDeleteReasons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new Error('User id is required');
    }
    const response = await ProfileService.getDeleteReasons();
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const deleteReasonId = Number(req.params.id);
    const otherReason = req.body.otherReason ? String(req.body.otherReason) : undefined;

    if (!userId) {
      throw new Error('User id is required');
    }
    const response = await ProfileService.deleteAccount(userId, deleteReasonId, otherReason);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteAccountByEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const validatedRequest = accountDeleteSchema.parse({
      email,
      password,
    });
    const response = await ProfileService.deleteAccountByEmail(validatedRequest);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getContactSupport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await ProfileService.getContactSupport();
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};


export const addFavouriteRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.userId);
    const restaurantId = Number(req.params.id);
    const response = await ProfileService.addFavouriteRestaurant(
      userId,
      restaurantId,
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const removeFavouriteRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.userId);
    const restaurantId = Number(req.params.id);
    const response = await ProfileService.removeFavouriteRestaurant(
      userId,
      restaurantId,
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getFavouriteRestaurants = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.userId);
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }
    const response = await ProfileService.getFavouriteRestaurants(userId, latitude, longitude);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const response = await ProfileService.getNotifications(
      userId,
      page,
      limit,
    );
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const readNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.userId);
    const notificationId = Number(req.params.id);
    const response = await ProfileService.readNotification(
      userId,
      notificationId,
    );
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export * as ProfileController from './profile.controller';
