import { NextFunction, Request, Response } from 'express';
import { BookingService } from '../../services/app/booking.service';
import {
  addReviewSchema,
  BookingSchema,
  createBookingSchema,
  findRestaurantsByCuisineSchema,
  findRestaurantsNearbySchema,
  getCuisineTypesSchema,
} from '../../validators/app/booking.validation';
import { CuisineTypeRepository } from '../../repositories';
import { getRestaurantImagesSchema } from '../../validators/producer/profile.validation';

export const findRestaurantsNearby = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, keyword, radius, page, limit } = req.body;
    const userId = Number(req.userId);
    const validatedObject = findRestaurantsNearbySchema.parse({
      userId,
      latitude,
      longitude,
      page,
      limit,
      keyword,
      radius,
    });
    const response = await BookingService.findRestaurantsNearby(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const findRestaurantsByCuisine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, cuisineTypeId, radius, page, limit } = req.body;
    const userId = Number(req.userId);
    const validatedObject = findRestaurantsByCuisineSchema.parse({
      userId,
      latitude,
      longitude,
      cuisineTypeId,
      page,
      limit,
      radius,
    });

    const response = await BookingService.findRestaurantsByCuisine(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const restaurantId = Number(req.params.id);
    const response = await BookingService.getRestaurant(userId, restaurantId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRestaurantSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const restaurantId = Number(req.params.id);
    const date = req.query.date ? String(req.query.date) : new Date().toISOString().split('T')[0];
    const timeZone = req.query.timeZone ? String(req.query.timeZone) : undefined;
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    const response = await BookingService.getRestaurantSlots(restaurantId, timeZone, date);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const restaurantId = Number(req.body.restaurantId);
    const slotId = Number(req.body.slotId);
    const specialRequest = req.body.specialRequest ? String(req.body.specialRequest) : '';
    const timeZone = req.body.timeZone;
    const guestCount = Number(req.body.guestCount);
    const now = new Date();
    const localTime = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(now)
      .replace(/\u200E/g, '');

    const parts = localTime.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) throw new Error('Date format parsing failed');
    const [, month, day, year, hour, minute, second] = parts;
    const formattedLocalTime = `${year}-${month}-${day}T${hour}:${minute}:${second}.999Z`;
    let currentTime = new Date(formattedLocalTime);
    let date = req.body.date ? String(req.body.date) : currentTime.toISOString().split('T')[0];
    const validatedObject = BookingSchema.createBookingSchema.parse({
      userId,
      restaurantId,
      slotId,
      specialRequest,
      date,
      timeZone,
      guestCount,
    });
    const response = await BookingService.createBooking(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const bookingId = Number(req.params.id);
    const slotId = Number(req.body.slotId);
    const specialRequest = req.body.specialRequest ? String(req.body.specialRequest) : '';
    const timeZone = req.body.timeZone;
    const guestCount = Number(req.body.guestCount);
    const now = new Date();
    const localTime = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(now)
      .replace(/\u200E/g, '');

    const parts = localTime.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) throw new Error('Date format parsing failed');
    const [, month, day, year, hour, minute, second] = parts;
    const formattedLocalTime = `${year}-${month}-${day}T${hour}:${minute}:${second}.999Z`;
    let currentTime = new Date(formattedLocalTime);
    let date = req.body.date ? String(req.body.date) : currentTime.toISOString().split('T')[0];
    const validatedObject = BookingSchema.updateBookingSchema.parse({
      userId,
      bookingId,
      slotId,
      specialRequest,
      date,
      timeZone,
      guestCount,
    });
    const response = await BookingService.updateBooking(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Booking = String(req.query.booking) || 'scheduled';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const userId = Number(req.userId);
    if (!Booking) {
      throw new Error('Booking is required');
    }
    const timeZone = String(req.query.timeZone);
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    const response = await BookingService.getBookings(userId, Booking, timeZone, page, limit);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const BookingId = Number(req.params.id);
    const timeZone = String(req.query.timeZone);
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    const response = await BookingService.getBooking(userId, BookingId, timeZone);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const BookingId = Number(req.params.id);
    const cancelReason = String(req.body.cancelReason);
    const timeZone = req.body.timeZone ? String(req.body.timeZone) : undefined;
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    const response = await BookingService.cancel(userId, BookingId, cancelReason, timeZone);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const bookingId = Number(req.params.id);
    const review = String(req.body.review);
    const rating = Number(req.body.rating);
    const validatedObject = addReviewSchema.parse({
      userId,
      bookingId,
      review,
      rating,
    })
    const response = await BookingService.addReview(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCuisineTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const keyword = req.query.keyword ? String(req.query.keyword) : undefined;
    const validatedObject = getCuisineTypesSchema.parse({
      page,
      limit,
      keyword,
    });
    const response = await BookingService.getCuisineTypes(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateBookingTemp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const bookingId = Number(req.params.id);
    const status = req.body.status;
    const startDateTime = req.body.startDateTime;
    const endDateTime = req.body.endDateTime;
    const response = await BookingService.updateBookingTemp(userId, bookingId, startDateTime, endDateTime, status);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRestaurantImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.params.id);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const validatedObject = getRestaurantImagesSchema.parse({
      restaurantId,
      page,
      limit,
    });
    const response = await BookingService.getRestaurantImages(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export * as BookingController from './booking.controller';
