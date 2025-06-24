import {
  BookingRepository,
  NotificationRepository,
  RolesRepository,
  UserRepository,
} from '../../repositories';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { In, LessThan, MoreThan, Not } from 'typeorm';
import { NotificationTypeEnums } from '../../enums/notification.type.enum';
import { NotificationStatusCode } from '../../enums/NotificationStatusCode.enum';
import { getCurrentTimeInUTCFromTimeZone } from '../../utils/getTime';
import { sendAdminNotification } from '../../utils/sendAdminNotification';

export const getBookings = async (userId: number, booking: string, timeZone: string, page = 1, limit = 10) => {
  try {
    let currentTime = getCurrentTimeInUTCFromTimeZone(timeZone);
    const user = await UserRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userRole = await RolesRepository.findOne({
      where: {
        name: 'restaurant',
      },
    });

    if (user.role.id !== userRole.id) {
      throw new BadRequestError('User is not a Restaurant');
    }
    let bookings: any[] = [];
    let total = 0;
    let totalPages = 0;
    let canCancel = false;
    let canCheckIn = false;
    const nowIso = getCurrentTimeInUTCFromTimeZone(timeZone);
    const bookingsToUpdate = await BookingRepository.find({
          where: {
            restaurant: { id: user.id },
            endDateTime: LessThan(nowIso),
            status:  'scheduled'
          },
          order: { id: 'DESC' },
          skip: (page - 1) * limit,
          take: limit,
        });
        const bookingIdsToUpdate = bookingsToUpdate
          .map((booking: { id: any }) => booking.id);

        if (bookingIdsToUpdate.length > 0) {
          await BookingRepository.createQueryBuilder()
            .update()
            .set({ status: 'cancelled', cancelReason: 'Cancelled by system because its overdue and no action was taken' })
            .whereInIds(bookingIdsToUpdate)
            .execute();
        }

    switch (booking) {
      case 'scheduled':
        const scheduledBookings = await BookingRepository.findAndCount({
          where: {
            restaurant: {
              id: user.id,
            },
            status: 'scheduled',
            endDateTime: MoreThan(currentTime),
          },
          relations: ['customer', 'restaurant', 'restaurant.restaurant'],
          order: {
            startDateTime: 'ASC',
          },
          skip: (page - 1) * limit,
          take: limit,
        });
        const mapScheduledBookings = scheduledBookings[0].map((booking: { status: string; startDateTime: string; endDateTime: string }) => {
          if (booking.status === 'scheduled') {
            canCancel = true;
          }
          if (booking.startDateTime <= currentTime && booking.endDateTime > currentTime) {
            canCheckIn = true;
          }

          return { ...booking, canCancel, canCheckIn };
        });
        bookings = mapScheduledBookings || [];
        total = scheduledBookings[1] || 0;
        totalPages = Math.ceil(total / limit);
        break;

      case 'inProgress':
        let inProgressBookings = await BookingRepository.findAndCount({
          where: {
            restaurant: {
              id: user.id,
            },
            status: In(['inProgress']),
          },
          relations: ['customer', 'restaurant', 'restaurant.restaurant'],
          order: {
            id: 'DESC',
          },
        });
        const inProgressBookingMap = inProgressBookings[0].map((booking: { status: string }) => {
          canCancel = true;
          canCheckIn = false;
          return { ...booking, canCancel, canCheckIn };
        });
        bookings = inProgressBookingMap ? inProgressBookingMap : [];
        total = inProgressBookings[1] || 0;
        totalPages = Math.ceil(total / limit);
        break;

      case 'completed':
        const nowIso = getCurrentTimeInUTCFromTimeZone(timeZone);
        const [bookingsToUpdate, countToUpdate] = await BookingRepository.findAndCount({
          where: {
            restaurant: { id: user.id },
            endDateTime: LessThan(nowIso),
            status: Not(In(['cancelled', 'scheduled'])),
          },
          relations: ['customer', 'restaurant', 'restaurant.restaurant'],
          order: { id: 'DESC' },
          skip: (page - 1) * limit,
          take: limit,
        });
        const bookingIdsToUpdate = bookingsToUpdate
          .filter((booking: { status: string }) => booking.status !== 'completed')
          .map((booking: { id: any }) => booking.id);

        if (bookingIdsToUpdate.length > 0) {
          await BookingRepository.createQueryBuilder()
            .update()
            .set({ status: 'completed' })
            .whereInIds(bookingIdsToUpdate)
            .execute();
        }
        bookings = bookingsToUpdate.map((booking: any) => ({
          ...booking,
          status: 'completed',
          canCancel: false,
          canCheckIn: false,
        }));
        total = countToUpdate;
        totalPages = Math.ceil(total / limit);
        break;
      case 'cancelled':
        const cancelledbookings = await BookingRepository.findAndCount({
          where: {
            restaurant: {
              id: user.id,
            },
            status: 'cancelled',
          },
          relations: ['customer', 'restaurant', 'restaurant.restaurant'],
          order: {
            id: 'DESC',
          },
          skip: (page - 1) * limit,
          take: limit,
        });
        const mapCancelledBookings = cancelledbookings[0].map((booking: { status: string; startDateTime: string }) => {
          let canCancel = false;
          let canCheckIn = false;
          return { ...booking, canCancel, canCheckIn };
        });
        bookings = mapCancelledBookings || [];
        total = cancelledbookings[1] || 0;
        totalPages = Math.ceil(total / limit);
        break;

      default:
        throw new BadRequestError('Invalid booking type requested');
    }
    return {
      bookings,
      total,
      currentPage: page,
      totalPages: totalPages,
    };
  } catch (error) {
    console.error(
      'Error in getBookings',
      {
        error,
      },
      'BookingService'
    );
    throw error;
  }
};

export const getBooking = async (userId: number, bookingId: number, timeZone: string) => {
  try {
    if (!bookingId) {
      throw new BadRequestError('bookingId is required');
    }
    const user = await UserRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userRole = await RolesRepository.findOne({
      where: {
        name: 'restaurant',
      },
    });

    if (user.role.id !== userRole.id) {
      throw new BadRequestError('User is not a restaurant');
    }
    let currentTime = getCurrentTimeInUTCFromTimeZone(timeZone);
    let scheduled = false;
    let inProgress = false;
    let cancelled = false;
    let canCancel = false;
    let completed = false;
    let canCheckIn = false;
    const booking = await BookingRepository.findOne({
      where: {
        restaurant: {
          id: user.id,
        },
        id: bookingId,
      },
      relations: ['customer', 'restaurant', 'restaurant.restaurant', 'review'],
    });
    if (!booking) {
      return {
        booking: null,
      }
    }
    if (booking.status === 'scheduled') {
      canCancel = true;
      scheduled = true;
    }

    if (booking.status === 'inProgress') {
      inProgress = true;
      canCancel = true;
    }

    if (booking.status === 'completed') {
      completed = true;
      inProgress = false;
    }
    if (booking.status === 'cancelled') {
      cancelled = true;
      canCancel = false;
    }
    if (booking.status === 'scheduled' && booking.endDateTime > currentTime) {
      canCheckIn = true;
    }
    const bookingResponse = {
      ...booking,
      canCheckIn,
      scheduled,
      inProgress,
      canCancel,
      cancelled,
      completed,
      start: booking.startDateTime,
      currentTime
    };
    return {
      booking: bookingResponse,
    };
  } catch (error) {
    console.error(
      'Error in getBooking',
      {
        error,
      },
      'BookingService'
    );
    throw error;
  }
};

export const cancel = async (userId: number, bookingId: number, cancelReason: string, timeZone: string) => {
  try {
    const user = await UserRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['role', 'restaurant'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userRole = await RolesRepository.findOne({
      where: {
        name: 'restaurant',
      },
    });
    if (user.role.id !== userRole.id) {
      throw new BadRequestError('User is not a Restaurant');
    }

    let currentTime = getCurrentTimeInUTCFromTimeZone(timeZone);
    const booking = await BookingRepository.findOne({
      where: {
        restaurant: {
          id: user.id,
        },
        id: bookingId,
      },
      relations: ['customer', 'restaurant', 'restaurant.restaurant'],
    });
    if (!booking) {
      throw new NotFoundError('booking not found');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestError('booking is already cancelled');
    }
    if (booking.status !== 'scheduled') {
      throw new BadRequestError('booking cannot be cancelled');
    }
    booking.status = 'cancelled';
    booking.cancelBy = 'restaurant';
    booking.cancelReason = cancelReason;
    booking.cancelAt = currentTime;
    await BookingRepository.save(booking);

    const bookingResponse = {
      ...booking,
    };

    const convertBookingDateToDDMMYY = (booking.startDateTime.split('T')[0].split('-').reverse().join('-'));

    if (booking.customer.deviceId) {
      const notificationData = {
        sender: { id: userId },
        receiver: { id: booking.customer.id },
        notificationId: NotificationStatusCode.BOOKING_RESTAURANT_CANCELLED,
        jobId: bookingId,
        title: 'Reservation Canceled by Restaurant',
        body: `We’re sorry! Your reservation at ${booking.restaurant.restaurant.restaurantName} scheduled for ${convertBookingDateToDDMMYY} has been canceled by the restaurant.Please consider booking another time.`,
        type: NotificationTypeEnums.BOOKING_RESTAURANT_CANCELLED,
        purpose: NotificationTypeEnums.BOOKING_RESTAURANT_CANCELLED,
        restaurantName: booking.restaurant.restaurant.restaurantName,
      };
      const notification = NotificationRepository.create(notificationData);
      await NotificationRepository.save(notification);
      const notificationPayload = {
        notificationId: String(NotificationStatusCode.BOOKING_RESTAURANT_CANCELLED),
        bookingId: String(booking.id),
        type: NotificationTypeEnums.BOOKING_RESTAURANT_CANCELLED,
        userId: String(user.id),
        profilePicture: String(user.profilePicture),
        name: String(booking.restaurant.restaurant.restaurantName),
      };
      await sendAdminNotification(
        booking.customer.deviceId,
        "Reservation Canceled by Restaurant",
        `We’re sorry! Your reservation at ${booking.restaurant.restaurant.restaurantName} scheduled for ${convertBookingDateToDDMMYY} has been canceled by the restaurant. 
          Please consider booking another time.`,
        notificationPayload,
      );
    }
    
    return {
      booking: bookingResponse,
    };
  } catch (error) {
    console.error(
      'Error in cancel',
      {
        error,
      },
      'BookingService'
    );
    throw error;
  }
};

export const checkIn = async (userId: number, bookingId: number, timeZone: string) => {
  try {
    if (!timeZone) {
      throw new Error('timeZone is required');
    }

    const user = await UserRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userRole = await RolesRepository.findOne({
      where: {
        name: 'restaurant',
      },
    });
    if (user.role.id !== userRole.id) {
      throw new BadRequestError('User is not a restaurant');
    }

    let currentTime = getCurrentTimeInUTCFromTimeZone(timeZone);
    const booking = await BookingRepository.findOne({
      where: {
        restaurant: {
          id: user.id,
        },
        id: bookingId,
      },
      relations: ['customer', 'restaurant', 'restaurant.restaurant'],
    });
    if (!booking) {
      throw new NotFoundError('booking not found');
    }
    if (booking.status === 'inProgress') {
      throw new BadRequestError('booking is already inProgress');
    }
    if (booking.status !== 'scheduled') {
      throw new BadRequestError('booking cannot be checkedIn');
    }
    // if (booking.startDateTime > currentTime) {
    //   throw new BadRequestError('booking cannot be checkedIn as it has not started yet');
    // }
    if (booking.endDateTime < currentTime) {
      throw new BadRequestError('booking cannot be checkedIn as it has already ended');
    }
    booking.status = 'inProgress';
    booking.checkInAt = currentTime;
    await BookingRepository.save(booking);

    const bookingResponse = {
      ...booking,
    };
    const convertBookingDateToDDMMYY = (booking.startDateTime.split('T')[0].split('-').reverse().join('-'));

    if (booking.customer.deviceId) {
      const notificationData = {
        sender: { id: userId },
        receiver: { id: booking.customer.id },
        notificationId: NotificationStatusCode.BOOKING_CUSTOMER_CHECKIN,
        jobId: bookingId,
        title: 'Customer Checked-In',
        body: `${booking.customer.firstName} has checked-in the booking scheduled for ${convertBookingDateToDDMMYY}.`,
        type: NotificationTypeEnums.BOOKING_CUSTOMER_CHECKIN,
        purpose: NotificationTypeEnums.BOOKING_CUSTOMER_CHECKIN,
        restaurantName: booking.restaurant.restaurant.restaurantName,
      };
      const notification = NotificationRepository.create(notificationData);
      await NotificationRepository.save(notification);
      const notificationPayload = {
        notificationId: String(NotificationStatusCode.BOOKING_CUSTOMER_CHECKIN),
        bookingId: String(booking.id),
        type: NotificationTypeEnums.BOOKING_CUSTOMER_CHECKIN,
        userId: String(booking.customer.id),
        profilePicture: String(booking.customer.profilePicture),
        name: String(booking.restaurant.restaurant.restaurantName),
      };

      await sendAdminNotification(
              booking.customer.deviceId,
              "Customer Checked-in",
              `${booking.customer.firstName} has checked-in the booking scheduled for ${convertBookingDateToDDMMYY}.`,
              notificationPayload,
      );
    }
    return {
      booking: bookingResponse,
    };
  } catch (error) {
    console.error(
      'Error in cancel',
      {
        error,
      },
      'BookingService'
    );
    throw error;
  }
};

export const updateBookingTemp = async (
  userId: number,
  bookingId: number,
  startDateTime: string,
  endDateTime: string,
  status: string
) => {
  try {
    const booking = await BookingRepository.findOne({
      where: {
        id: bookingId,
      },
    });
    if (!booking) {
      throw new NotFoundError('booking not found');
    }
    booking.startDateTime = startDateTime;
    booking.endDateTime = endDateTime;
    booking.status = status;
    booking.pictureProof = null;
    await BookingRepository.save(booking);
  } catch (error) {
    console.error(
      'Error in updateBookingTemp',
      {
        error,
      },
      'BookingService'
    );
    throw error;
  }
};

export * as BookingService from './booking.service';
