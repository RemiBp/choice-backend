import {
  BookingRepository,
  CuisineTypeRepository,
  FavouriteRestaurantRepository,
  NotificationRepository,
  ProducerRepository,
  RestaurantImagesRepository,
  RestaurantRepository,
  ReviewRepository,
  RolesRepository,
  SlotRepository,
  UnavailableSlotRepository,
  UserRepository,
} from '../../repositories';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { In, LessThan, MoreThan, Not } from 'typeorm';
import { NotificationTypeEnums } from '../../enums/notification.type.enum';
import { NotificationStatusCode } from '../../enums/NotificationStatusCode.enum';
import { DateTime } from 'luxon';
import {
  AddReviewSchema,
  CreateBookingSchema,
  FindRestaurantsByCuisineSchema,
  FindRestaurantsNearbySchema,
  GetCuisineTypesSchema,
  UpdateBookingSchema,
} from '../../validators/app/booking.validation';
import { getCurrentTimeInUTCFromTimeZone, getTodayDateInTimeZone } from '../../utils/getTime';
import { sendAdminNotification } from '../../utils/sendAdminNotification';
import { GetRestaurantImagesSchema } from '../../validators/producer/profile.validation';
import Review from '../../models/Review';

export const findRestaurantsNearby = async (findRestaurantsNearByObject: FindRestaurantsNearbySchema) => {
  try {
    const { userId, latitude, longitude, keyword = '', page = 1, limit = 10, radius } = findRestaurantsNearByObject;

    if (!latitude) throw new BadRequestError('Latitude is required');
    if (!longitude) throw new BadRequestError('Longitude is required');

    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const searchRadius: number = radius || 10000; // meters
    const vehicleSpeed: number = 30; // km/h

    // base query with distance calculation
    const baseQuery = ProducerRepository.createQueryBuilder('restaurant')
      .innerJoin('restaurant.user', 'restaurantUser')
      .addSelect(
        `ST_Distance(
          "restaurant"."locationPoint"::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        )`,
        'distance'
      )
      .where(
        `ST_DWithin(
          "restaurant"."locationPoint"::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :searchRadius
        )`,
        { longitude, latitude, searchRadius }
      )
      .andWhere('restaurant.isDeleted = false')
      .andWhere('restaurantUser.isDeleted = false')
      .andWhere('restaurant.isActive = true')
      .andWhere('restaurantUser.isActive = true')
      .andWhere('restaurant.name ILIKE :keyword', { keyword: `%${keyword}%` })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('distance', 'ASC');

    const [restaurants, totalRestaurants] = await baseQuery.getManyAndCount();

    if (!restaurants || restaurants.length === 0) {
      return {
        restaurants: [],
        totalRestaurants: 0,
        currentPage: page,
        totalPages: 0,
      };
    }

    // get favourites for user
    // const favouriteRestaurants = await FavouriteRestaurantRepository.find({
    //   where: { user: { id: userId } },
    //   relations: ['producer'],
    //   select: ['id'], // keep minimal
    // });

    // const favouriteRestaurantIds = favouriteRestaurants.map(
    //   (fav: { producer: { id: any; }; }) => fav.producer.id
    // );

    // fetch raw distances alongside entities
    const { raw, entities } = await baseQuery.getRawAndEntities();

    const restaurantsWithDetails = entities.map((restaurant: { id: any; name: any; address: any; latitude: any; longitude: any; user: { profilePicture: any; }; }, index: string | number) => {
      const distanceInMeters = parseFloat(raw[index].distance);
      const distanceInKm = distanceInMeters / 1000;
      const etaInHours = distanceInKm / vehicleSpeed;
      const etaInMinutes = Math.round(etaInHours * 60);

      return {
        id: restaurant.id,
        restaurantName: restaurant.name,
        address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        profilePicture: restaurant.user?.profilePicture || null,
        //isFav: favouriteRestaurantIds.includes(restaurant.id),
        etaInMinutes,
        distance: Math.round(distanceInMeters),
      };
    });

    return {
      restaurants: restaurantsWithDetails,
      totalRestaurants,
      currentPage: page,
      totalPages: Math.ceil(totalRestaurants / limit),
    };
  } catch (error) {
    console.error('Error in findRestaurantsNearby:', error);
    throw error;
  }
};


export const findRestaurantsByCuisine = async (findRestaurantsByCuisineObject: FindRestaurantsByCuisineSchema) => {
  try {
    const { userId, latitude, longitude, cuisineTypeId, page = 1, limit = 10, radius } = findRestaurantsByCuisineObject;

    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const searchRadius: number = radius || 10000;
    const vehicleSpeed: number = 30;
    const baseQuery = ProducerRepository.createQueryBuilder('restaurant')
      .innerJoin('restaurant.user', 'restaurantUser')
      .where(
        `ST_DWithin(
          "restaurant"."locationPoint"::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :searchRadius
        )`,
        { longitude, latitude, searchRadius }
      )
      .andWhere('restaurant.cuisineTypeId = :cuisineTypeId', { cuisineTypeId })
      .andWhere('restaurant.isDeleted = false')
      .andWhere('restaurantUser.isDeleted = false')
      .andWhere('restaurant.isActive = true')
      .andWhere('restaurantUser.isActive = true')
      .andWhere('restaurant.accountStatus = :status', { status: 'approved' });

    const totalRestaurants = await baseQuery.getCount();
    const paginatedQuery = RestaurantRepository.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.cuisineType', 'cuisineType')
      .innerJoinAndSelect('restaurant.user', 'user')
      .addSelect(
        `ST_Distance(
          "restaurant"."locationPoint"::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        )`,
        'distance'
      )
      .where(
        `ST_DWithin(
          "restaurant"."locationPoint"::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :searchRadius
        )`,
        { longitude, latitude, searchRadius }
      )
      .andWhere('restaurant.cuisineTypeId = :cuisineTypeId', { cuisineTypeId })
      .andWhere('restaurant.isDeleted = false')
      .andWhere('user.isDeleted = false')
      .andWhere('restaurant.isActive = true')
      .andWhere('user.isActive = true')
      .andWhere('restaurant.accountStatus = :status', { status: 'approved' })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('distance', 'ASC');

    const restaurants = await paginatedQuery.getRawAndEntities();

    if (!restaurants || restaurants.entities.length === 0) {
      return restaurants;
    }

    const favouriteRestaurants = await FavouriteRestaurantRepository.find({
      where: { user: { id: userId } },
      relations: ["restaurant"],
      select: ["id", "restaurant.id"],
    });

    const favouriteRestaurantIds = favouriteRestaurants.map(
      (favourite: { restaurant: { id: any } }) => favourite.restaurant.id,
    );

    const restaurantsWithDetails = restaurants.entities.map(
      (
        restaurant: {
          user: { id: any; profilePicture: any };
          restaurantName: any;
          address: any;
          latitude: any;
          longitude: any;
          rating: any;
          cuisineType: any;
        },
        index: string | number
      ) => {
        const distanceInMeters = restaurants.raw[index].distance;
        const distanceInKm = distanceInMeters / 1000;
        const etaInMinutes = Math.round((distanceInKm / vehicleSpeed) * 60);
        let isFav = false;
        isFav = favouriteRestaurantIds.includes(restaurant.user.id);
        return {
          id: restaurant.user.id,
          restaurantName: restaurant.restaurantName,
          address: restaurant.address,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          profilePicture: restaurant.user.profilePicture || null,
          isFav,
          etaInMinutes,
          distance: Math.round(distanceInMeters),
          rating: restaurant.rating,
          cuisineType: restaurant.cuisineType,
        };
      }
    );

    return {
      restaurants: restaurantsWithDetails,
      totalRestaurants,
      currentPage: page,
      totalPages: Math.ceil(totalRestaurants / limit),
    };
  } catch (error) {
    console.log('error is : ', error);
    throw error;
  }
};

export const getRestaurant = async (userId: number, restaurantId: number) => {
  try {
    const restaurant = await UserRepository.findOne({
      where: { id: restaurantId },
      relations: ['role', 'producer', 'operationalHours', 'paymentMethods' ],
    });
    // const isFav = await FavouriteRestaurantRepository.findOne({
    //   where: { user: { id: userId }, restaurant: { id: restaurantId } },
    // });
    // restaurant.isFav = isFav ? true : false;

    return { restaurant };
  } catch (error) {
    console.error('Error in getRestaurant', { error }, 'BookingService');
    throw error;
  }
};

export const getRestaurantSlots = async (restaurantId: number, timeZone: string, date: string) => {
  try {
    if (!restaurantId) {
      throw new BadRequestError('restaurantId is required');
    }
    if (!timeZone) {
      throw new BadRequestError('timeZone is required');
    }
    if (!date) {
      throw new BadRequestError('date is required');
    }
    const now = new Date();
    const inputDate = new Date(date);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone });
    const inputDay = inputDate.toLocaleDateString('en-US', { weekday: 'long', timeZone });
    const currentTime = getCurrentTimeInUTCFromTimeZone(timeZone);
    const time = currentTime.split('T')[1].substring(0, 5);

        const todayDate = getTodayDateInTimeZone(timeZone);
        if(date && date < todayDate){
          throw new BadRequestError('Kindly select a future date');
        }


    const unavailableSlots = await UnavailableSlotRepository.find({
      where: { userId: restaurantId, date: date },
      select: ['slotId'],
    });
    

    const unavailableSlotIds = unavailableSlots.map((slot: { slotId: number }) => slot.slotId);
    

    const slotQuery = SlotRepository.createQueryBuilder('slot')
      .innerJoin('slot.user', 'user')
      .where('user.id = :restaurantId', { restaurantId })
      .andWhere('slot.day = :day', { day: inputDay })
      //.andWhere('slot.id NOT IN (:...unavailableSlotIds)', { unavailableSlotIds });

      if (unavailableSlots.length > 0) {
      slotQuery.andWhere('slot.id NOT IN (:...unavailableSlotIds)', { unavailableSlotIds });
    }

    if (inputDay === currentDay && date === todayDate) {
      slotQuery.andWhere('slot.startTime >= :time', { time });
    }

    const slots = await slotQuery
      .orderBy('slot.startTime', 'ASC')
      .getMany();

    return {
      slots,
    };
  } catch (error) {
    console.error('Error in getRestaurantSlots', { error }, 'BookingService');
    throw error;
  }
};

export const createBooking = async (hireObject: CreateBookingSchema) => {
  try {
    const { userId, restaurantId, slotId, date, specialRequest, timeZone, guestCount } = hireObject;

    if (!timeZone) throw new BadRequestError('timeZone is required');
    const inputDate = new Date(date);
    const inputDay = inputDate.toLocaleDateString('en-US', { weekday: 'long', timeZone });

    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundError('User not found');
    if (user.role.name !== 'user') throw new BadRequestError('userId is invalid');

    const restaurant = await ProducerRepository.findOne({
      where: { user: { id: restaurantId } },
    });
    if (!restaurant) throw new NotFoundError('restaurant not found');
    if (restaurant.isDeleted) throw new BadRequestError('restaurant is deleted, Kindly book someone else');

    const slot = await SlotRepository.findOne({ where: { id: slotId } });
    if (!slot) throw new NotFoundError('Slot not found');

    const alredyBooked = await BookingRepository.findOne({
      where: {
        customer: { id: userId },
        restaurant: { id: restaurantId },
        slotStartTime: slot.startTime,
        bookingDate: date,
        status: Not('cancelled'),
      },
    });

    if (alredyBooked) throw new BadRequestError('Same Slot already booked for you at this restaurant');

    const { address, latitude, longitude } = restaurant;
    if (!latitude || !longitude) throw new BadRequestError('location is required');

    let bookingDate = date ? new Date(date) : new Date();
    const nowInTimeZone = new Date(new Date().toLocaleString('en-US', { timeZone }));
    const bookingDateInTimeZone = new Date(new Date(bookingDate).toLocaleString('en-US', { timeZone }));

    // Reset both dates to midnight (start of the day)
    const today = new Date(nowInTimeZone.getFullYear(), nowInTimeZone.getMonth(), nowInTimeZone.getDate());
    const bookingDay = new Date(bookingDateInTimeZone.getFullYear(), bookingDateInTimeZone.getMonth(), bookingDateInTimeZone.getDate());

    if (bookingDay < today) {
      throw new BadRequestError(`Please provide a future date. ${today} AND ${bookingDay}`);
    }
    const formattedBookingDate = bookingDate.toISOString().split('T')[0];
    const bookingStartTime = new Date(`${formattedBookingDate}T${slot.startTime}:00.000Z`).toISOString();
    const bookingEndTime = new Date(`${formattedBookingDate}T${slot.endTime}:00.000Z`).toISOString();

    const booking = BookingRepository.create({
      customer: user,
      restaurant: restaurantId,
      customerName: `${user.fullName}`,
      startDateTime: bookingStartTime,
      endDateTime: bookingEndTime,
      bookingDate: formattedBookingDate,
      location: address,
      latitude,
      longitude,
      slotStartTime: slot.startTime,
      slotEndTime: slot.endTime,
      locationPoint: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      specialRequest,
      bookingType: 'direct',
      timeZone,
      guestCount,
      date: date,
      day: inputDay,
    });

    const saveBooking = await BookingRepository.save(booking);
    // if (restaurant.deviceId) {
    //   const notificationData = {
    //     sender: { id: userId },
    //     receiver: { id: restaurant.id },
    //     notificationId: NotificationStatusCode.BOOKING_CREATED,
    //     jobId: booking.id,
    //     title: 'Booking Created',
    //     body: `${user.firstName} has reserved a booking at your restaurant.`,
    //     type: NotificationTypeEnums.BOOKING_CREATED,
    //     purpose: NotificationTypeEnums.BOOKING_CREATED,
    //     restaurantName: restaurant.restaurant.restaurantName,
    //   };
    //   const notification = NotificationRepository.create(notificationData);
    //   await NotificationRepository.save(notification);
    //   const notificationPayload = {
    //     notificationId: String(NotificationStatusCode.BOOKING_CREATED),
    //     bookingId: String(booking.id),
    //     type: NotificationTypeEnums.BOOKING_CREATED,
    //     userId: String(user.id),
    //     profilePicture: String(user.profilePicture),
    //     name: user.firstName,
    //   };

    //   await sendAdminNotification(
    //     restaurant.deviceId,
    //     "Booking Created",
    //     `${user.firstName} has reserved a booking at your restaurant. Please check your reservation`,
    //     notificationPayload,
    //   );
    // }

    

    return { booking: saveBooking };
  } catch (error) {
    console.error('Error in createBooking', { error }, 'BookingService');
    throw error;
  }
};

export const updateBooking = async (hireObject: UpdateBookingSchema) => {
  try {
    const { userId, bookingId, slotId, date, specialRequest, timeZone, guestCount } = hireObject;

    if (!timeZone) throw new BadRequestError('timeZone is required');
    const inputDate = new Date(date);
    const inputDay = inputDate.toLocaleDateString('en-US', { weekday: 'long', timeZone });

    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundError('User not found');
    if (user.role.name !== 'user') throw new BadRequestError('userId is invalid');

    const existingBooking = await BookingRepository.findOne({
      where: {
        id: bookingId,
      },
      relations: ['restaurant'],
    });
    if (!existingBooking) throw new NotFoundError('Booking not found');

    const restaurant = await UserRepository.findOne({
      where: { id: existingBooking.restaurant.id },
      relations: ['restaurant', 'role'],
    });
    if (!restaurant) throw new NotFoundError('restaurant not found');
    if (restaurant.role.name !== 'restaurant') throw new BadRequestError('restaurantId is invalid');
    if (restaurant.isDeleted) throw new BadRequestError('restaurant is deleted, Kindly book someone else');

    const slot = await SlotRepository.findOne({ where: { id: slotId } });
    if (!slot) throw new NotFoundError('Slot not found');

    const alredyBooked = await BookingRepository.findOne({
      where: {
        customer: { id: userId },
        restaurant: { id: restaurant.id },
        slotStartTime: slot.startTime,
        bookingDate: date,
      },
    });

    if (alredyBooked && alredyBooked.id !== bookingId) throw new BadRequestError('Same Slot already booked for you at this restaurant');



    let bookingDate = date ? new Date(date) : new Date();
    const nowInTimeZone = new Date(new Date().toLocaleString('en-US', { timeZone }));
    const bookingDateInTimeZone = new Date(new Date(bookingDate).toLocaleString('en-US', { timeZone }));

    // Reset both dates to midnight (start of the day)
    const today = new Date(nowInTimeZone.getFullYear(), nowInTimeZone.getMonth(), nowInTimeZone.getDate());
    const bookingDay = new Date(bookingDateInTimeZone.getFullYear(), bookingDateInTimeZone.getMonth(), bookingDateInTimeZone.getDate());

    if (bookingDay < today) {
      throw new BadRequestError(`Please provide a future date. ${today} AND ${bookingDay}`);
    }
    const formattedBookingDate = bookingDate.toISOString().split('T')[0];
    const bookingStartTime = new Date(`${formattedBookingDate}T${slot.startTime}:00.000Z`).toISOString();
    const bookingEndTime = new Date(`${formattedBookingDate}T${slot.endTime}:00.000Z`).toISOString();

    existingBooking.startDateTime = bookingStartTime;
    existingBooking.endDateTime = bookingEndTime;
    existingBooking.bookingDate = formattedBookingDate;
    existingBooking.slotStartTime = slot.startTime;
    existingBooking.slotEndTime = slot.endTime;
    existingBooking.specialRequest = specialRequest;
    existingBooking.guestCount = guestCount;
    existingBooking.timeZone = timeZone;
    existingBooking.date = date;
    existingBooking.day = inputDay;
    await BookingRepository.save(existingBooking);

    if (restaurant.deviceId) {
      const notificationData = {
        sender: { id: userId },
        receiver: { id: restaurant.id },
        notificationId: NotificationStatusCode.BOOKING_UPDATED,
        jobId: existingBooking.id,
        title: 'Booking Updated',
        body: `${user.firstName} has updated a booking at your restaurant.`,
        type: NotificationTypeEnums.BOOKING_UPDATED,
        purpose: NotificationTypeEnums.BOOKING_UPDATED,
      };
      const notification = NotificationRepository.create(notificationData);
      await NotificationRepository.save(notification);
      const notificationPayload = {
        notificationId: String(NotificationStatusCode.BOOKING_UPDATED),
        bookingId: String(existingBooking.id),
        type: NotificationTypeEnums.BOOKING_UPDATED,
        userId: String(user.id),
        profilePicture: String(user.profilePicture),
        name: user.firstName,
      };

      await sendAdminNotification(
        restaurant.deviceId,
        "Booking Updated",
        `${user.firstName} has updated a booking at your restaurant.`,
        notificationPayload,
      );
    }

    

    return { booking: existingBooking };
  } catch (error) {
    console.error('Error in updateBooking', { error }, 'BookingService');
    throw error;
  }
};

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
        name: 'user',
      },
    });

    if (user.role.id !== userRole.id) {
      throw new BadRequestError('User is not an App user');
    }
    let bookings: any[] = [];
    let total = 0;
    let totalPages = 0;
    const nowIso = getCurrentTimeInUTCFromTimeZone(timeZone);
        const bookingsToUpdate = await BookingRepository.find({
              where: {
                customer: { id: user.id },
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
            customer: {
              id: user.id,
            },
            status: 'scheduled',
            endDateTime: MoreThan(currentTime),
          },
          relations: ['customer', 'restaurant', 'restaurant.restaurant', 'review'],
          order: {
            startDateTime: 'ASC',
          },
          skip: (page - 1) * limit,
          take: limit,
        });
        bookings = scheduledBookings[0] || [];
        total = scheduledBookings[1] || 0;
        totalPages = Math.ceil(scheduledBookings[1] / limit);
        break;

      case 'inProgress':
        let inProgressBookings = await BookingRepository.findOne({
          where: {
            customer: {
              id: user.id,
            },
            status: In(['inProgress']),
          },
          relations: ['customer', 'restaurant', 'restaurant.restaurant', 'review'],
          order: {
            id: 'DESC',
          },
        });
        bookings = inProgressBookings ? [inProgressBookings] : [];
        total = inProgressBookings ? 1 : 0;
        totalPages = 1;
        break;

      case 'completed':
        const nowIso = getCurrentTimeInUTCFromTimeZone(timeZone);
        const [bookingsToUpdate, countToUpdate] = await BookingRepository.findAndCount({
          where: {
            customer: { id: user.id },
            endDateTime: LessThan(nowIso),
            status: Not(In(['cancelled', 'scheduled'])),
          },
          relations: ['customer', 'restaurant', 'restaurant.restaurant', 'review'],
          order: { id: 'DESC' },
          skip: (page - 1) * limit,
          take: limit,
        });
        const bookingIdsToUpdate = bookingsToUpdate
//          .filter((booking: { status: string }) => booking.status !== 'completed')
          .map((booking: { id: any }) => booking.id);

        if (bookingIdsToUpdate.length > 0) {
          await BookingRepository.createQueryBuilder()
            .update()
            .set({ status: 'completed' })
            .whereInIds(bookingIdsToUpdate)
            .execute();
        }
        bookings = bookings = bookingsToUpdate.map((booking: any) => ({
          ...booking,
          status: 'completed',
        }));
        total = countToUpdate;
        totalPages = Math.ceil(total / limit);
        break;
      case 'cancelled':
        const cancelledbookings = await BookingRepository.findAndCount({
          where: {
            customer: {
              id: user.id,
            },
            status: 'cancelled',
          },
          relations: ['customer', 'restaurant', 'restaurant.restaurant', 'review'],
          order: {
            id: 'DESC',
          },
          skip: (page - 1) * limit,
          take: limit,
        });
        bookings = cancelledbookings[0] || [];
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
        name: 'user',
      },
    });

    if (user.role.id !== userRole.id) {
      throw new BadRequestError('User is not an App user');
    }
    const currentTimeInLocalZone = DateTime.now().setZone(timeZone);
    const formattedTime = currentTimeInLocalZone.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    let currentTime = new Date(formattedTime);
    let scheduled = false;
    let inProgress = false;
    let cancelled = false;
    let canCancel = false;
    let completed = false;
    let canAddReview = false;
    let reviewAdded = false;
    const booking = await BookingRepository.findOne({
      where: {
        customer: {
          id: user.id,
        },
        id: bookingId,
      },
      relations: ['customer', 'restaurant', 'restaurant.restaurant', 'review'],
    });
    if (!booking) {
      return {
        booking: null,
      };
    }
    if (booking.status === 'scheduled') {
      canCancel = true;
      scheduled = true;
    }

    if (booking.status !== 'scheduled' && booking.status !== 'completed' && booking.status !== 'cancel') {
      inProgress = true;
    }
    if (booking.status === 'inProgress') {
      inProgress = true;
      canCancel = false;
    }

    if (booking.status === 'completed') {
      completed = true;
      inProgress = false;
      canAddReview = true;
    }
    if (booking.reviewAdded) {
      canAddReview = false;
      reviewAdded = true;
    }
    if (booking.status === 'cancelled') {
      cancelled = true;
      canCancel = false;
    }
    const bookingResponse = {
      ...booking,
      scheduled,
      inProgress,
      canCancel,
      cancelled,
      reviewAdded,
      canAddReview,
      completed,
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
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (user.role.id !== userRole.id) {
      throw new BadRequestError('User is not an App user');
    }

    const currentTimeInLocalZone = DateTime.now().setZone(timeZone);
    const formattedTime = currentTimeInLocalZone.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    let currentTime = new Date(formattedTime);
    const booking = await BookingRepository.findOne({
      where: {
        customer: {
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
    booking.cancelBy = 'user';
    booking.cancelReason = cancelReason;
    booking.cancelAt = currentTime.toISOString();
    await BookingRepository.save(booking);

    const bookingResponse = {
      ...booking,
    };
    const convertBookingDateToDDMMYY = (booking.startDateTime.split('T')[0].split('-').reverse().join('-')); 

    if (booking.restaurant.deviceId) {
      const notificationData = {
        sender: { id: userId },
        receiver: { id: booking.restaurant.id },
        notificationId: NotificationStatusCode.BOOKING_CUSTOMER_CANCELLED,
        jobId: booking.id,
        title: 'Reservation Cancelled By Customer',
        body: `We’re sorry! The reservation at ${booking.restaurant.restaurant.restaurantName} scheduled for ${convertBookingDateToDDMMYY} has been canceled by the customer.`,
        type: NotificationTypeEnums.BOOKING_CUSTOMER_CANCELLED,
        purpose: NotificationTypeEnums.BOOKING_CUSTOMER_CANCELLED,
        restaurantName: booking.restaurant.restaurant.restaurantName,
      };
      const notification = NotificationRepository.create(notificationData);
      await NotificationRepository.save(notification);
      const notificationPayload = {
        notificationId: String(NotificationStatusCode.BOOKING_CUSTOMER_CANCELLED),
        bookingId: String(booking.id),
        type: NotificationTypeEnums.BOOKING_CUSTOMER_CANCELLED,
        userId: String(user.id),
        profilePicture: String(user.profilePicture),
        name: String(user.firstName),
      };
      await sendAdminNotification(
        booking.restaurant.deviceId,
        "Reservation Cancelled By Customer",
        `We’re sorry! The reservation at ${booking.restaurant.restaurant.restaurantName} scheduled for ${convertBookingDateToDDMMYY} has been canceled by the customer.`,
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

export const addReview = async (addReviewObject: AddReviewSchema) => {
  try {
    const { userId, bookingId, review, rating } = addReviewObject;
    if (!userId) {
      throw new BadRequestError('userId is required');
    }
    if (!bookingId) {
      throw new BadRequestError('bookingId is required');
    }
    if (!rating) {
      throw new BadRequestError('rating is required');
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
        name: 'user',
      },
    });
    if (user.role.id !== userRole.id) {
      throw new BadRequestError('User is not an App user');
    }

    const booking = await BookingRepository.findOne({
      where: {
        customer: {
          id: user.id,
        },
        id: bookingId,
        status: In(['completed']),
      },
      relations: ['customer', 'restaurant', 'restaurant.restaurant'],
    });
    if (!booking) {
      throw new NotFoundError('booking not found');
    }
    if (booking.reviewAdded) {
      throw new BadRequestError('Review already added');
    }


    const addReview = ReviewRepository.create({
      rating,
      remarks: review ? review : '',
      isActive: true,
      customer: user,
      booking: { id: booking.id },
      restaurant: booking.restaurant,
    });
    const saveReview = await ReviewRepository.save(addReview);
    booking.reviewAdded = true;
    await BookingRepository.save(booking);

    const allReviews = await ReviewRepository.find({
      where: {
        restaurant: { id: booking.restaurant.id },
      },
      select: ['rating'],
    });
    const totalRating = allReviews.reduce((sum: number, review: { rating: string | number }) => {
      const rating = typeof review.rating === 'string' ? parseFloat(review.rating) : review.rating;
      return sum + (rating || 0);
    }, 0);

    const overallRating = allReviews.length > 0 ? parseFloat((totalRating / allReviews.length).toFixed(2)) : 0;

    booking.restaurant.rating = overallRating;
    const restaurant = await RestaurantRepository.findOne({
      where: {
        user: { id: booking.restaurant.id },
      },
    });
    restaurant.rating = overallRating;
    await RestaurantRepository.save(restaurant);

    const bookingResponse = {
      ...booking,
    };

    if (booking.restaurant.deviceId) {
      const notificationData = {
        sender: { id: userId },
        receiver: { id: booking.restaurant.id },
        notificationId: NotificationStatusCode.BOOKING_ADD_REVIEW,
        jobId: booking.id,
        title: 'Review added by customer',
        body: `${user.firstName} has added a review for the booking.`,
        type: NotificationTypeEnums.BOOKING_ADD_REVIEW,
        purpose: NotificationTypeEnums.BOOKING_ADD_REVIEW,
        restaurantName: booking.restaurant.restaurant.restaurantName,
      };
      const notification = NotificationRepository.create(notificationData);
      await NotificationRepository.save(notification);
      const notificationPayload = {
        notificationId: String(NotificationStatusCode.BOOKING_ADD_REVIEW),
        bookingId: String(booking.id),
        type: NotificationTypeEnums.BOOKING_ADD_REVIEW,
        userId: String(user.id),
        profilePicture: String(user.profilePicture),
        name: String(user.firstName),
      };
    }
    return {
      booking: bookingResponse,
    };
  } catch (error) {
    console.error(
      'Error in addReview',
      {
        error,
      },
      'UserBookingService'
    );
    throw error;
  }
};

export const getCuisineTypes = async (getCuisineTypeObject: GetCuisineTypesSchema) => {
  try {
    const { page, limit, keyword } = getCuisineTypeObject;

    const queryBuilder = CuisineTypeRepository.createQueryBuilder('cuisineType').where(
      'cuisineType.isDeleted = :isDeleted',
      { isDeleted: false }
    );

    if (keyword) {
      queryBuilder.andWhere(`(cuisineType.name ILIKE :keyword)`, { keyword: `%${keyword}%` });
    }

    queryBuilder
      .orderBy('cuisineType.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [cuisineTypes, count] = await queryBuilder.getManyAndCount();

    return {
      cuisineTypes,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
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

export const getRestaurantImages = async (getRestaurantImagesObject: GetRestaurantImagesSchema) => {
  try {
    const { restaurantId, page, limit } = getRestaurantImagesObject;
    const restaurant = await RestaurantRepository.findOne({
      where: {
        user: { id: restaurantId },
      },
    })
    if (!restaurant) {
      throw new NotFoundError('restaurant not found');
    }
    const [images, total] = await RestaurantImagesRepository.findAndCount({
      where: { restaurantId },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        isMain: 'DESC',
        id: 'DESC',
      },
    });
    const totalPages = Math.ceil(total / limit);
    return {
      images,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error('Error in getRestaurantImages', { error }, 'RestaurantService');
    throw error;
  }
};



export * as BookingService from './booking.service';