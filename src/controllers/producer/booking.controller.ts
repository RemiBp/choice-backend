import { NextFunction, Request, Response } from 'express';
import { BookingService } from '../../services/producer/booking.service';

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
    const timeZone = req.query.timeZone ? String(req.query.timeZone) : undefined;
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    const response = await BookingService.cancel(userId, BookingId, cancelReason, timeZone);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const BookingId = Number(req.params.id);
    const timeZone = req.query.timeZone ? String(req.query.timeZone) : undefined;
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    const response = await BookingService.checkIn(userId, BookingId, timeZone);
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

export * as BookingController from './booking.controller';
