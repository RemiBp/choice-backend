import {
  AddMenuDish,
  DeleteRestaurantImageSchema,
  GetRestaurantImagesSchema,
  PreSignedURL,
  ReviewsAndRatingsSchema,
  reviewsAndRatingsSchema,
  SetCapacitySchema,
  SetGalleryImages,
  SetMainImageSchema,
  SetOperationHoursSchema,
  SetServiceTypeInput,
  UpdateProfileSchema,
  UploadRestaurantImagesSchema,
} from '../../validators/producer/profile.validation';
import {
  BookingRepository,
  BusinessProfileRepository,
  CuisineTypeRepository,
  DeletedUsersRepository,
  DeleteReasonRepository,
  HelpAndSupportRepository,
  NotificationRepository,
  OpeningHoursRepository,
  OperationalHourRepository,
  PasswordRepository,
  PaymentMethodsRepository,
  PhotoRepository,
  ProducerRepository,
  ProducerServiceRepository,
  RestaurantImagesRepository,
  RestaurantPaymentMethodsRepository,
  RestaurantRepository,
  ReviewRepository,
  WellnessServiceRepository,
  SlotRepository,
  UnavailableSlotRepository,
  UserRepository,
  WellnessRepository,
  WellnessServiceTypeRepository,
  MenuCategoryRepository,
  MenuDishesRepository,
} from '../../repositories';
import { hashPassword } from '../../utils/PasswordUtils';
import s3Service from '../s3.service';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { UploadDocuments } from '../../validators/producer/profile.validation';
import { generateSlots } from '../../utils/generateHourlySlots';
import RestaurantPaymentMethods from '../../models/RestaurantPaymentMethods';
import { Between, In, MoreThan } from 'typeorm';
import { getCurrentTimeInUTCFromTimeZone, getTodayDateInTimeZone, toStartOfDay } from '../../utils/getTime';
import { mapBusinessProfile, mapProducer } from '../../utils/profile.mapper';
import { BusinessRole } from '../../enums/Producer.enum';
import MenuCategory from '../../models/MenuCategory';
import MenuDishes from '../../models/MenuDishes';

export const getAllServiceType = async () => {
  const serviceTypes = await WellnessServiceTypeRepository.find({
    order: { name: "ASC" },
  });
  return serviceTypes;
};

export const updateProfile = async (
  userId: number,
  updateProfileObject: UpdateProfileSchema
) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ["producer", "businessProfile"],
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.producer || !user.businessProfile) {
      throw new NotFoundError("Profile not initialized for this user");
    }

    // --------------------
    // Update Producer Info
    // --------------------
    Object.assign(user.producer, {
      address: updateProfileObject.address,
      city: updateProfileObject.city,
      country: updateProfileObject.country,
      phoneNumber: updateProfileObject.phoneNumber,
      website: updateProfileObject.website,
      latitude: updateProfileObject.latitude,
      longitude: updateProfileObject.longitude,
      locationPoint: { type: "Point", coordinates: [updateProfileObject.longitude, updateProfileObject.latitude] },
    });

    // Keep user phoneNumber in sync
    if (updateProfileObject.phoneNumber) {
      user.phoneNumber = updateProfileObject.phoneNumber;
    }

    // --------------------
    // Update BusinessProfile (socials)
    // --------------------
    Object.assign(user.businessProfile, {
      instagram: updateProfileObject.instagram,
      twitter: updateProfileObject.twitter,
      facebook: updateProfileObject.facebook,
      description: updateProfileObject.description,
      profileImageUrl: updateProfileObject.profileImageUrl,
    });

    await ProducerRepository.save(user.producer);
    await BusinessProfileRepository.save(user.businessProfile);
    await UserRepository.save(user);

    return {
      message: "Profile updated successfully",
      producer: user.producer,
      businessProfile: user.businessProfile,
    };
  } catch (error) {
    console.error("Error in updateProfile", { error });
    throw error;
  }
};


export const getProfile = async (userId: number) => {
  const user = await UserRepository.findOne({
    where: { id: userId },
    relations: ['businessProfile', 'producer', 'restaurant', 'restaurant.cuisineType'],
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    email: user.email,
    phoneNumber: user.phoneNumber,
    isVerified: user.isVerified,
    businessProfile: user.businessProfile ? mapBusinessProfile(user.businessProfile) : null,
    producer: user.producer ? mapProducer(user.producer) : null,
  };
};

export const getProducers = async () => {
  const producers = await ProducerRepository.find({
    where: { isDeleted: false },
  });

  return producers;
};

export const getProducerById = async (id: number) => {
  const producer = await ProducerRepository.findOne({
    where: { id, isDeleted: false },
  });

  if (!producer) {
    throw new NotFoundError('Producer not found');
  }

  return producer;
};

export const getPreSignedUrl = async (userId: number, getPreSignedURLObject: PreSignedURL) => {
  try {
    const { fileName, contentType, folderName } = getPreSignedURLObject;
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const { url, keyName } = await s3Service.getPresignedUploadUrl(fileName, contentType, true, folderName);
    return { url, keyName };
  } catch (error) {
    throw error;
  }
};

export const changeCurrentPassword = async (userId: number, newPassword: string) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['Password'],
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const hashedPassword = await hashPassword(newPassword);
    const userPassword = await PasswordRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!userPassword) {
      throw new NotFoundError('User password not found');
    }
    userPassword.password = hashedPassword;
    const updatePassword = await PasswordRepository.save(userPassword);
    if (!updatePassword) {
      throw new Error('password not updated');
    }
    return { message: 'Password updated successfully' };
  } catch (error) {
    throw error;
  }
};

export const getDeleteReasons = async () => {
  try {
    const deleteReasons = await DeleteReasonRepository.find({
      where: {
        role: 'restaurant',
      },
    });
    return { deleteReasons };
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async (userId: number, deleteReasonId: number) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['Password', 'restaurant'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.isDeleted) {
      throw new BadRequestError('User already deleted');
    }
    if (user.restaurant) {
      await RestaurantRepository.remove(user.restaurant);
    }

    if (user.Password) {
      await PasswordRepository.remove(user.Password);
    }

    const deleteReason = await DeleteReasonRepository.findOne({
      where: { id: deleteReasonId },
    });
    if (!deleteReason) {
      throw new NotFoundError('Delete reason not found');
    }

    const getBookings = await BookingRepository.find({
      where: {
        restaurant: {
          id: userId,
        },
        status: In(['scheduled', 'inProgress']),
      }
    })

    if (getBookings.length > 0) {
      const cancelGetBookings = getBookings.map(async (booking: { id: any; }) => {
        await BookingRepository.update(booking.id, {
          status: 'cancelled',
          cancelBy: 'restaurant',
          cancelReason: 'Restaurant Account deleted',
        });
      })
      await Promise.all(cancelGetBookings);
    }

    const timestamp = Date.now();
    const [localPart, domain] = user.email.split('@');
    await UserRepository.createQueryBuilder('user')
      .update()
      .set({
        isDeleted: true,
        isActive: false,
        email: `${localPart}+deleted_${timestamp}@${domain}`,
        phoneNumber: `deleted+${user.phoneNumber}`,
        profilePicture: '',
      })
      .where('id = :id', { id: userId })
      .execute();

    const deleteUserEntry = DeletedUsersRepository.create({
      user: user,
      deleteReason: deleteReason,
      role: 'restaurant',
    });

    await DeletedUsersRepository.save(deleteUserEntry);

    return { message: 'Account deleted successfully' };
  } catch (error) {
    throw error;
  }
};

export const uploadDocuments = async (uploadDocumentsObject: UploadDocuments) => {
  try {
    const { userId, certificateOfHospitality, certificateOfTourism } = uploadDocumentsObject;
    const restaurant = await RestaurantRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    restaurant.certificateOfHospitality = certificateOfHospitality;
    restaurant.certificateOfTourism = certificateOfTourism;
    restaurant.accountStatus = 'underReview';
    await RestaurantRepository.save(restaurant);

    return { message: 'Documents uploaded successfully' };
  } catch (error) {
    throw error;
  }
};

export const uploadMenu = async (userId: number, menuUrl: string) => {
  try {
    const restaurant = await RestaurantRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    restaurant.menu = menuUrl;
    await RestaurantRepository.save(restaurant);

    return { message: 'Menu uploaded successfully' };
  } catch (error) {
    throw error;
  }
};



export const setServiceType = async (input: { userId: number; serviceTypeIds: number[] }) => {
  const { userId, serviceTypeIds } = input;

  const producer = await ProducerRepository.findOne({ where: { userId } });
  if (!producer) throw new NotFoundError("Producer not found");

  if (producer.type !== BusinessRole.WELLNESS) {
    throw new BadRequestError("Service type can only be added for wellness producers");
  }

  let wellness = await WellnessRepository.findOne({
    where: { producerId: producer.id },
    relations: ["selectedServices", "selectedServices.serviceType"],
  });

  if (!wellness) {
    wellness = WellnessRepository.create({ producerId: producer.id });
    wellness = await WellnessRepository.save(wellness);
  }

  const existingIds = (wellness.selectedServices ?? []).map((s: { serviceType: { id: any; }; }) => s.serviceType.id);

  const newServiceIds = serviceTypeIds.filter((id) => !existingIds.includes(id));

  if (newServiceIds.length > 0) {
    const newServices = await Promise.all(
      newServiceIds.map(async (id) => {
        const serviceType = await WellnessServiceTypeRepository.findOne({ where: { id } });
        if (!serviceType) throw new NotFoundError(`ServiceType ${id} not found`);

        return WellnessServiceRepository.create({
          wellness,
          serviceType,
        });
      })
    );

    const saved = await WellnessServiceRepository.save(newServices);

    // Add to wellness.selectedServices so return is updated
    const reloaded = await WellnessServiceRepository.find({
      where: { id: In(saved.map((s: { id: any; }) => s.id)) },
      relations: ["serviceType"],
    });

    wellness.selectedServices.push(...reloaded);
  }

  // 5. Return updated services
  return {
    producerId: producer.id,
    serviceTypes: (wellness.selectedServices ?? []).map((s: { id: any; serviceType: { id: any; name: any; criteria: any; }; }) => ({
      id: s.id,
      serviceTypeId: s.serviceType.id,
      name: s.serviceType.name,
      criteria: s.serviceType.criteria,
    })),
  };
};

export const getServiceType = async (input: { userId: number }) => {
  const { userId } = input;

  const producer = await ProducerRepository.findOne({ where: { userId } });
  if (!producer) throw new NotFoundError("Producer not found");

  if (producer.type !== BusinessRole.WELLNESS) {
    throw new BadRequestError("Only wellness producers have service types");
  }

  const wellness = await WellnessRepository.findOne({
    where: { producerId: producer.id },
    relations: ["selectedServices", "selectedServices.serviceType"],
  });

  return {
    producerId: producer.id,
    serviceTypes: (wellness?.selectedServices ?? []).map((s: { id: any; serviceType: { id: any; name: any; criteria: any; }; }) => ({
      id: s.id,
      serviceTypeId: s.serviceType.id,
      name: s.serviceType.name,
      criteria: s.serviceType.criteria,
    })),
  };
};

export const setGalleryImages = async (userId: number, input: SetGalleryImages) => {
  const user = await UserRepository.findOne({
    where: { id: userId },
    relations: ['producer'],
  });

  if (!user || !user.producer) {
    throw new NotFoundError('Producer not found for this user');
  }

  const producer = user.producer;

  const photos = input.images.map(img =>
    PhotoRepository.create({
      url: img.url,
      producer: producer,
    })
  );

  await PhotoRepository.save(photos);
};

export const getGalleryImages = async (userId: number) => {
  const user = await UserRepository.findOne({
    where: { id: userId },
    relations: ['producer'],
  });

  if (!user || !user.producer) {
    throw new NotFoundError('Producer not found for this user');
  }

  const photos = await PhotoRepository.find({
    where: { producer: { id: user.producer.id } },
    order: { id: 'ASC' },
  });

  return photos.map((photo: { id: any; url: any; source: any; }) => ({
    id: photo.id,
    url: photo.url,
    source: photo.source,
  }));
};

// export const setOperationalHours = async (input: SetOperationHoursSchema & { userId: number }) => {
//   const { userId, hours } = input;

//   try {
//     if (!Array.isArray(hours) || hours.length !== 7) {
//       throw new BadRequestError('Exactly 7 days of hours are required.');
//     }

//     const producer = await ProducerRepository.findOne({
//       where: { userId },
//       relations: ['openingHours', 'user'],
//     });

//     if (!producer) {
//       throw new NotFoundError('producer not found');
//     }

//     const dayMap = [
//       'monday',
//       'tuesday',
//       'wednesday',
//       'thursday',
//       'friday',
//       'saturday',
//       'sunday',
//     ] as const;

//     type Day = (typeof dayMap)[number];
//     type TimeKey = `${Day}Open` | `${Day}Close`;

//     const openingHoursData: Partial<Record<TimeKey, string | null>> = {};

//     for (const { day, startTime, endTime, isClosed = false } of hours) {
//       if (!isClosed && (!startTime || !endTime)) {
//         throw new BadRequestError(
//           `Start and end time are required for open day: ${day}`
//         );
//       }

//       const lowerDay = day.toLowerCase() as Day;

//       openingHoursData[`${lowerDay}Open`] = isClosed ? null : startTime;
//       openingHoursData[`${lowerDay}Close`] = isClosed ? null : endTime;
//     }

//     let openingHours = producer.openingHours;

//     if (openingHours) {
//       Object.assign(openingHours, openingHoursData);
//     } else {
//       openingHours = OpeningHoursRepository.create({
//         ...openingHoursData,
//         producer,
//       });
//     }

//     await OpeningHoursRepository.save(openingHours);

//     return {
//       message: 'Operational hours set successfully.',
//     };
//   } catch (error) {
//     console.error('Error in setOperationalHours', { input, error });
//     throw error;
//   }
// };


export const setOperationalHours = async (input: SetOperationHoursSchema) => {
  const { restaurantId, hours } = input;

  try {
    if (restaurantLocks.get(restaurantId)) {
      throw new BadRequestError('Slot generation is already in progress for this restaurant.');
    }
    if (!restaurantId || !Array.isArray(hours) || hours.length !== 7) {
      throw new BadRequestError('restaurantId and 7 days of hours are required.');
    }

    const user = await UserRepository.findOne({
      where: { id: restaurantId },
    });

    if (!user) {
      throw new NotFoundError('Restaurant not found');
    }
    const restaurant = await ProducerRepository.findOne({
      where: { user: { id: restaurantId } },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    // let slotDuration = 0;
    // if (restaurant.slotDuration) {
    //   slotDuration = restaurant.slotDuration;
    // } else {
    //   throw new Error('Slot duration not found');
    // }

    for (const entry of hours) {
      const { day, startTime, endTime, isClosed = false } = entry;

      if (!isClosed && (!startTime || !endTime)) {
        throw new BadRequestError(`Start and end time are required for open day: ${day}`);
      }
      const existing = await OperationalHourRepository.findOne({
        where: { user: { id: restaurantId }, day },
        relations: ['user'],
      });

      if (existing) {
        existing.isClosed = isClosed;
        existing.startTime = isClosed ? null : startTime;
        existing.endTime = isClosed ? null : endTime;
        await OperationalHourRepository.save(existing);
      } else {
        const newHour = OperationalHourRepository.create({
          user,
          day,
          startTime: isClosed ? null : startTime,
          endTime: isClosed ? null : endTime,
          isClosed,
        });
        await OperationalHourRepository.save(newHour);
      }
    }
    //if (restaurant.slotDuration) {
    setImmediate(() => generateSlotsForRestaurant(restaurantId));
    //}


    return {
      message: 'Operational hours set successfully.',
    };
  } catch (error) {
    console.error('Error in setOperationalHours', { input, error }, 'RestaurantService');
    throw error;
  }
};
export const getOperationalDays = async (userId: number) => {
  try {
    const producer = await ProducerRepository.findOne({
      where: { userId },
      relations: ['openingHours'],
    });

    if (!producer) {
      throw new NotFoundError('Producer not found');
    }

    const openingHours = producer.openingHours;

    if (!openingHours) {
      return {
        message: 'No operational hours set for this producer.',
        operationalDays: [],
      };
    }

    const operationalDays = [
      { day: 'Monday', startTime: openingHours.mondayOpen, endTime: openingHours.mondayClose },
      { day: 'Tuesday', startTime: openingHours.tuesdayOpen, endTime: openingHours.tuesdayClose },
      { day: 'Wednesday', startTime: openingHours.wednesdayOpen, endTime: openingHours.wednesdayClose },
      { day: 'Thursday', startTime: openingHours.thursdayOpen, endTime: openingHours.thursdayClose },
      { day: 'Friday', startTime: openingHours.fridayOpen, endTime: openingHours.fridayClose },
      { day: 'Saturday', startTime: openingHours.saturdayOpen, endTime: openingHours.saturdayClose },
      { day: 'Sunday', startTime: openingHours.sundayOpen, endTime: openingHours.sundayClose },
    ];

    return {
      operationalDays,
    };
  } catch (error) {
    console.error('Error in getOperationalDays', { userId, error });
    throw error;
  }
}

export const setCapacity = async (input: SetCapacitySchema & { userId: number }) => {
  const { userId, totalSeats, noOfTables, maxPartySize } = input;

  const producer = await ProducerRepository.findOne({
    where: { userId },
  });

  if (!producer) throw new NotFoundError('Producer not found');

  producer.totalSeats = totalSeats;
  producer.noOfTables = noOfTables;
  producer.maxPartySize = maxPartySize;

  await ProducerRepository.save(producer);

  return { message: 'Capacity set successfully' };
};

export const setSlotDuration = async (restaurantId: number, slotDuration: number) => {
  try {
    const restaurant = await RestaurantRepository.findOne({
      where: { user: { id: restaurantId } },
    });
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    restaurant.slotDuration = slotDuration;
    await RestaurantRepository.save(restaurant);
    setImmediate(() => generateSlotsForRestaurant(restaurantId));
    return { message: 'Slot duration set successfully' };
  } catch (error) {
    throw error;
  }
};

export const getSlotDuration = async (restaurantId: number) => {
  try {
    const restaurant = await RestaurantRepository.findOne({
      where: { user: { id: restaurantId } },
      relations: ['user'],
    });
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    return { slotDuration: restaurant.slotDuration };
  } catch (error) {
    throw error;
  }
};

export const getUnavailableSlots = async (
  restaurantId: number,
  timeZone: string,
  page: number,
  limit: number,
  date?: string
) => {
  try {
    const currentTime = getCurrentTimeInUTCFromTimeZone(timeZone);
    const todayDate = getTodayDateInTimeZone(timeZone);
    if (date && date < todayDate) {
      throw new BadRequestError('Kindly select a future date');
    }

    const where: any = { userId: restaurantId, startTime: MoreThan(currentTime) };

    if (date) {
      where.date = date;
    }

    const [slots, count] = await UnavailableSlotRepository.findAndCount({
      where,
      order: { startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      slots,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    throw error;
  }
};


export const addUnavailableSlot = async (restaurantId: number, slotIds: number[], date: string) => {
  try {
    if (!Array.isArray(slotIds)) {
      throw new BadRequestError('slotIds must be an array');
    }
    const existingSlots = await UnavailableSlotRepository.find({
      where: { userId: restaurantId, date },
    })
    if (existingSlots.length > 0) {
      await UnavailableSlotRepository.remove(existingSlots);
    }


    // Validate slot existence
    const slots = await SlotRepository.findByIds(slotIds, { relations: ['user'] });
    if (slots.length !== slotIds.length) {
      throw new NotFoundError('One or more slots not found');
    }

    // Ensure all slots belong to the restaurant
    for (const slot of slots) {
      if (slot.userId !== restaurantId) {
        throw new BadRequestError('One or more slots does not belong to the specified restaurant');
      }
    }

    // Create multiple unavailable slots
    const unavailableSlots = slots.map((slot: { startTime: any; endTime: any; id: any; }) => {
      const startTime = new Date(`${date}T${slot.startTime}:00.000Z`).toISOString();
      const endTime = new Date(`${date}T${slot.endTime}:00.000Z`).toISOString();
      return UnavailableSlotRepository.create({
        userId: restaurantId,
        startTime,
        endTime,
        slotId: slot.id,
        date,
      });
    });

    // Save all unavailable slots
    await UnavailableSlotRepository.save(unavailableSlots);

    return {
      message: 'Unavailable slots added successfully',
    }
  } catch (error) {
    console.error('Error in addUnavailableSlot', { error }, 'RestaurantService');
    throw error;
  }
};


const restaurantLocks = new Map<number, boolean>();

export const generateSlotsForRestaurant = async (restaurantId: number) => {
  if (restaurantLocks.get(restaurantId)) {
    console.log(`Slot generation already in progress for restaurant ${restaurantId}`);
    return;
  }
  restaurantLocks.set(restaurantId, true);

  try {
    console.log(`🔧 [Service] Generating slots for restaurant ${restaurantId}`);
    const restaurant = await UserRepository.findOne({
      where: { id: restaurantId },
      relations: ['restaurant'],
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    console.log(`Fetching operational hours for ${restaurantId}`);
    const operationalHours = await OperationalHourRepository.find({
      where: { user: { id: restaurantId }, isClosed: false },
    });
    await UnavailableSlotRepository.delete({ userId: restaurantId });
    await SlotRepository.delete({ userId: restaurantId });
    const slotDuration = 1
    console.log('slotDuration', slotDuration);
    for (const hour of operationalHours) {
      const { day, startTime, endTime } = hour;

      if (!startTime || !endTime) continue;

      const hourlySlots = generateSlots(startTime, endTime, slotDuration);
      console.log(`Generated ${hourlySlots.length} slots for ${day}`);

      for (const slot of hourlySlots) {
        const newSlot = SlotRepository.create({
          day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          userId: restaurantId,
        });

        try {
          await SlotRepository.save(newSlot);
        } catch (e) {
          console.error('Failed to save slot:', newSlot, e);
        }
      }
    }
  } finally {
    restaurantLocks.set(restaurantId, false);
    console.log(`Slot generation completed for restaurant ${restaurantId}`);
  }
};

export const getOperationalHours = async (restaurantId: number) => {
  try {
    const operationalHours = await OperationalHourRepository.find({
      where: { user: { id: restaurantId } },
    });
    return operationalHours;
  } catch (error) {
    throw error;
  }
};

// export const getRestaurantSlots = async (restaurantId: number) => {
//   try {
//     const slots = await SlotRepository.createQueryBuilder('slot')
//       .innerJoin('slot.user', 'user')
//       .where('user.id = :restaurantId', { restaurantId })
//       .orderBy(
//         `
//       CASE 
//         WHEN slot.day = 'Monday' THEN 1
//         WHEN slot.day = 'Tuesday' THEN 2
//         WHEN slot.day = 'Wednesday' THEN 3
//         WHEN slot.day = 'Thursday' THEN 4
//         WHEN slot.day = 'Friday' THEN 5
//         WHEN slot.day = 'Saturday' THEN 6
//         WHEN slot.day = 'Sunday' THEN 7
//         ELSE 8
//       END
//     `,
//         'ASC'
//       )
//       .addOrderBy('slot.startTime', 'ASC')
//       .getMany();

//     const groupedSlots = slots.reduce((acc: Record<string, typeof slots>, slot: { day: any; startTime: any }) => {
//       const { day, startTime } = slot;
//       if (!acc[day]) {
//         acc[day] = [];
//       }
//       acc[day].push(slot);
//       return acc;
//     }, {});

//     return groupedSlots;
//   } catch (error) {
//     console.error('Error in getRestaurantSlots', { error }, 'BookingService');
//     throw error;
//   }
// };

export const getRestaurantSlots = async (restaurantId: number) => {
  try {
    const slots = await SlotRepository.createQueryBuilder('slot')
      .innerJoin('slot.user', 'user')
      .where('user.id = :restaurantId', { restaurantId })
      .orderBy(
        `
        CASE 
          WHEN slot.day = 'Monday' THEN 1
          WHEN slot.day = 'Tuesday' THEN 2
          WHEN slot.day = 'Wednesday' THEN 3
          WHEN slot.day = 'Thursday' THEN 4
          WHEN slot.day = 'Friday' THEN 5
          WHEN slot.day = 'Saturday' THEN 6
          WHEN slot.day = 'Sunday' THEN 7
          ELSE 8
        END
      `,
        'ASC'
      )
      .addOrderBy('slot.startTime', 'ASC')
      .getMany();

    // Group by day
    const groupedSlots = slots.reduce((acc: Record<string, typeof slots>, slot: { day: any; }) => {
      const { day } = slot;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(slot);
      return acc;
    }, {});

    // Transform to desired structure
    const response = {
      data: Object.entries(groupedSlots).map(([day, slots]) => ({
        day,
        slots,
      })),
    };

    return response;
  } catch (error) {
    console.error('Error in getRestaurantSlots', { error }, 'BookingService');
    throw error;
  }
};


type SlotUpdateInput = {
  id: number;
  isActive: boolean;
};

export const updateRestaurantSlots = async (userId: number, slots: SlotUpdateInput[]) => {
  try {
    if (!Array.isArray(slots) || slots.length === 0) {
      throw new Error('Invalid input: slots array is required');
    }

    const updatedSlots = [];

    for (const slot of slots) {
      const existingSlot = await SlotRepository.findOne({
        where: { id: slot.id },
        relations: ['user'],
      });

      if (!existingSlot) {
        throw new Error(`Slot with ID ${slot.id} does not exist`);
      }

      if (existingSlot.user.id !== userId) {
        throw new Error(`Slot with ID ${slot.id} does not belong to the specified restaurant`);
      }

      existingSlot.isActive = slot.isActive;
      updatedSlots.push(existingSlot);
    }

    await SlotRepository.save(updatedSlots);

    return { message: 'Slots updated successfully' };
  } catch (error) {
    console.error('Error in updateRestaurantSlots', { error }, 'BookingService');
    throw error;
  }
};

export const uploadRestaurantImages = async (input: UploadRestaurantImagesSchema) => {
  const { restaurantId, images } = input;

  try {
    if (!restaurantId || !Array.isArray(images) || images.length === 0) {
      throw new BadRequestError('At least one image is required.');
    }

    const user = await UserRepository.findOne({
      where: { id: restaurantId },
    });

    if (!user) {
      throw new NotFoundError('Restaurant not found');
    }

    const existingMainImage = await RestaurantImagesRepository.findOne({
      where: { restaurantId, isMain: true },
    });

    const mainImageCount = images.filter(img => img.isMain).length;

    if (mainImageCount > 1) {
      throw new BadRequestError('Only one image can be set as main.');
    }

    if (mainImageCount === 0 && images.length > 0) {
      if (!existingMainImage) {
        images[images.length - 1].isMain = true;
      }
    }

    if (mainImageCount === 1) {
      if (existingMainImage) {
        await RestaurantImagesRepository.update({ restaurantId, isMain: true }, { isMain: false });
      }
    }

    const imageEntities = images.map(img =>
      RestaurantImagesRepository.create({
        imageUrl: img.url,
        isMain: !!img.isMain,
        restaurant: user,
        restaurantId: user.id,
      })
    );

    await RestaurantImagesRepository.save(imageEntities);

    return {
      message: 'Images uploaded successfully',
      count: imageEntities.length,
    };
  } catch (error) {
    console.error('Error in uploadRestaurantImages', { input, error }, 'RestaurantService');
    throw error;
  }
};

export const setMainImage = async (input: SetMainImageSchema) => {
  const { restaurantId, imageId } = input;

  try {
    if (!restaurantId || !imageId) {
      throw new BadRequestError('restaurantId and imageId are required.');
    }

    const user = await UserRepository.findOne({
      where: { id: restaurantId },
    });

    if (!user) {
      throw new NotFoundError('Restaurant not found');
    }

    const currentMainImage = await RestaurantImagesRepository.findOne({
      where: { restaurantId, isMain: true },
    });

    const newMainImage = await RestaurantImagesRepository.findOne({
      where: { id: imageId, restaurantId },
    });

    if (!newMainImage) {
      throw new NotFoundError('Image not found');
    }

    if (currentMainImage) {
      currentMainImage.isMain = false;
      await RestaurantImagesRepository.save(currentMainImage);
    }

    newMainImage.isMain = true;
    await RestaurantImagesRepository.save(newMainImage);

    return {
      message: 'Main image updated successfully.',
    };
  } catch (error) {
    console.error('Error in setMainImage', { input, error }, 'RestaurantService');
    throw error;
  }
};

export const getRestaurantImages = async (getRestaurantImagesObject: GetRestaurantImagesSchema) => {
  try {
    const { restaurantId, page, limit } = getRestaurantImagesObject;
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

export const deleteRestaurantImage = async (input: DeleteRestaurantImageSchema) => {
  try {
    const { restaurantId, imageId } = input;
    const restaurant = await UserRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    const image = await RestaurantImagesRepository.findOne({
      where: { id: imageId, restaurant: { id: restaurantId } },
    });
    if (!image) {
      throw new NotFoundError('Image not found');
    }
    await RestaurantImagesRepository.remove(image);
    return {
      message: 'Image deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteRestaurantImage', { input, error }, 'RestaurantService');
    throw error;
  }
};

export const getContactSupport = async () => {
  try {
    const contactSupport = await HelpAndSupportRepository.findOne({ where: { id: 1 } });
    if (!contactSupport) {
      return { email: '', phone: '' };
    }

    return { email: contactSupport.emailForRestaurants, phone: contactSupport.phoneForRestaurants };
  } catch (error) {
    console.error('Error in getContactSupport', { error });
    throw error;
  }
};

export const reviewsAndRating = async (reviewsAndRatingsObject: ReviewsAndRatingsSchema) => {
  try {
    const { userId, page, limit, filter } = reviewsAndRatingsObject;

    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['restaurant'],
    });

    if (!user || !user.restaurant) {
      throw new NotFoundError('User or restaurant not found');
    }

    const rating = user.restaurant.rating || '0';

    // Set default sort order
    let order: any = { id: 'DESC' }; // default: latest

    if (filter === 'oldest') {
      order = { id: 'ASC' };
    } else if (filter === 'highest') {
      order = { rating: 'DESC' };
    }

    const [reviews, count] = await ReviewRepository.findAndCount({
      where: { restaurant: { id: user.id } },
      relations: ['customer'],
      skip: (page - 1) * limit,
      take: limit,
      order,
    });

    if (!reviews || reviews.length === 0) {
      return {
        rating,
        reviews: [],
        count,
        currentPage: page,
        totalPage: 1,
        starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const starCountsRaw = await ReviewRepository.createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.restaurantId = :restaurantId', { restaurantId: user.id })
      .groupBy('review.rating')
      .getRawMany();

    const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    starCountsRaw.forEach((row: { rating: string; count: string }) => {
      starCounts[parseInt(row.rating)] = parseInt(row.count);
    });

    const reviewsResponse = reviews.map((review: { customer: { id: any; firstName: any; lastName: any; profilePicture: any; }; }) => {
      return {
        ...review,
        customer: {
          id: review.customer.id,
          firstName: review.customer.firstName,
          lastName: review.customer.lastName,
          profilePicture: review.customer.profilePicture,
        },
      };
    });

    return {
      rating,
      reviewsResponse,
      count,
      currentPage: page,
      totalPage: Math.ceil(count / limit),
      starCounts,
    };
  } catch (error) {
    console.error('Error in reviewsAndRating', { error });
    throw error;
  }
};


export const getReviewsByStar = async (userId: number, star: number, page: number, limit: number) => {
  try {
    if (star < 1 || star > 5) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['restaurant'],
    });

    if (!user || !user.restaurant) {
      throw new NotFoundError('User or restaurant not found');
    }

    const [reviews, count] = await ReviewRepository.findAndCount({
      where: {
        restaurant: { id: user.id },
        rating: star,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        id: 'DESC',
      },
    });

    return {
      reviews,
      count,
      currentPage: page,
      totalPage: Math.ceil(count / limit),
    };
  } catch (error) {
    console.error('Error in getReviewsByStarRating', { error });
    throw error;
  }
};

export const onBoardingDetail = async (restaurantId: number) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: restaurantId },
      relations: ['restaurant'],
    });
    let addDocuments = false;
    let addBusinessHours = false;
    let addMenu = false;
    let addPaymentMethods = false;
    let addImages = false;
    let addSlots = false;
    let setUnavailability = false;

    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (
      user.restaurant.certificateOfHospitality !== null &&
      user.restaurant.certificateOfHospitality !== '' &&
      user.restaurant.certificateOfTourism !== null &&
      user.restaurant.certificateOfTourism !== ''
    ) {
      addDocuments = true;
    }
    const businessHours = await OperationalHourRepository.find({
      where: {
        user: { id: restaurantId },
        isClosed: false,
      },
    });
    if (businessHours.length > 0) {
      addBusinessHours = true;
      addSlots = true;
    }
    if (user.restaurant.menu !== null && user.restaurant.menu !== '') {
      addMenu = true;
    }
    const getRestaurantPaymentMethods = await RestaurantPaymentMethodsRepository.find({
      where: { userId: user.id },
    });
    if (getRestaurantPaymentMethods.length > 0) {
      addPaymentMethods = true;
    }
    const images = await RestaurantImagesRepository.find({
      where: { restaurant: { id: restaurantId } },
    });
    if (images.length > 0) {
      addImages = true;
    }

    const unavailableSlots = await UnavailableSlotRepository.find({
      where: { user: { id: restaurantId } },
    });
    if (unavailableSlots.length > 0) {
      setUnavailability = true;
    }

    return {
      onBoardingDetail: {
        addDocuments: addDocuments,
        addBusinessHours: addBusinessHours,
        addMenu: addMenu,
        addPaymentMethods: addPaymentMethods,
        addImages: addImages,
        addSlots: addSlots,
        setUnavailability: setUnavailability,
      },
    };
  } catch (error) {
    console.error('Error in onBoardingDetail', { error });
    throw error;
  }
};

export const getPaymentMethods = async (userId: number) => {
  try {
    const paymentMethods = await PaymentMethodsRepository.find({
      where: { isDeleted: false },
    });
    const getRestaurantPaymentMethods = await RestaurantPaymentMethodsRepository.find({
      where: { userId: userId },
    });
    const paymentMethodIds = getRestaurantPaymentMethods.map(
      (paymentMethod: { paymentMethodId: any }) => paymentMethod.paymentMethodId
    );

    paymentMethods.forEach((paymentMethod: { id: any; isSelected: boolean }) => {
      paymentMethod.isSelected = paymentMethodIds.includes(paymentMethod.id);
    });

    return { paymentMethods };
  } catch (error) {
    console.error('Error in getPaymentMethods', { error });
    throw error;
  }
};

export const addPaymentMethods = async (restaurantId: number, paymentMethods: number[]) => {
  try {
    if (!paymentMethods || !Array.isArray(paymentMethods)) {
      throw new BadRequestError('paymentMethods is an array of numbers');
    }
    const user = await UserRepository.findOne({
      where: { id: restaurantId },
      relations: ['restaurant'],
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const getRestaurantPaymentMethods = await RestaurantPaymentMethodsRepository.find({
      where: { userId: user.id },
    });
    if (getRestaurantPaymentMethods.length > 0) {
      const deletedExistingPaymentMethods =
        await RestaurantPaymentMethodsRepository.remove(getRestaurantPaymentMethods);
    }

    for (const paymentMethodId of paymentMethods) {
      const paymentMethod = await PaymentMethodsRepository.findOne({
        where: { id: paymentMethodId },
      });
      if (!paymentMethod) {
        throw new NotFoundError(`Payment method with ID ${paymentMethodId} not found`);
      }
      const restaurantPaymentMethod = new RestaurantPaymentMethods();
      restaurantPaymentMethod.name = paymentMethod.name;
      restaurantPaymentMethod.userId = user.id;
      restaurantPaymentMethod.paymentMethodId = paymentMethod.id;
      await RestaurantPaymentMethodsRepository.save(restaurantPaymentMethod);
    }

    return { message: 'Payment methods added successfully' };
  } catch (error) {
    console.error('Error in addPaymentMethods', { error });
    throw error;
  }
};


export const getRestaurantSlotsByDate = async (restaurantId: number, timeZone: string, date: string) => {
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

    const formatDate = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone }).format(d);

    const formattedNow = formatDate(now);
    const formattedInput = formatDate(inputDate);

    if (formattedInput < formattedNow) {
      throw new BadRequestError('Please provide a future date');
    }

    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone });
    const inputDay = inputDate.toLocaleDateString('en-US', { weekday: 'long', timeZone });

    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    });

    const currentTime = formatter.format(now);

    const unavailableSlots = await UnavailableSlotRepository.find({
      where: { userId: restaurantId, date: date },
      select: ['slotId'],
    });

    const unavailableSlotIds = unavailableSlots.map((slot: { slotId: number }) => slot.slotId);


    const slotQuery = SlotRepository.createQueryBuilder('slot')
      .innerJoin('slot.user', 'user')
      .where('user.id = :restaurantId', { restaurantId })
      .andWhere('slot.day = :day', { day: inputDay })


    const slots = await slotQuery
      .orderBy('slot.startTime', 'ASC')
      .getMany();

    const slotsUpdated = slots.map((slot: { id: any; }) => {
      let isUnavailable = false;
      isUnavailable = unavailableSlotIds.includes(slot.id);
      return {
        ...slot,
        isUnavailable,
      };
    });

    return {
      slots: slotsUpdated,
    };
  } catch (error) {
    console.error('Error in getRestaurantSlotsByDate', { error }, 'BookingService');
    throw error;
  }
};

export const bookingChart = async (restaurantId: number, chartType: string, timeZone: string) => {
  try {
    if (!restaurantId) throw new BadRequestError('restaurantId is required');
    if (!chartType) throw new BadRequestError('chartType is required');

    const today = new Date();
    const currentTime = getCurrentTimeInUTCFromTimeZone(timeZone);
    const todayIso = today.toISOString().split('T')[0];

    if (chartType === 'lastWeek') {
      const OneWeekAgoDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const OneWeekAgoIso = OneWeekAgoDate.toISOString().split('T')[0];
      const toStartOfOneWeekAgo = toStartOfDay(OneWeekAgoIso);

      const endDate = new Date(today);
      endDate.setDate(today.getDate());
      endDate.setHours(23, 59, 59, 999);
      const endDateIso = endDate.toISOString().split('T')[0];
      const toStartOfEndDate = toStartOfDay(endDateIso);

      const bookings = await BookingRepository.find({
        where: {
          restaurant: { id: restaurantId },
          endDateTime: Between(toStartOfOneWeekAgo, toStartOfEndDate),
        },
      });


      // Group by day (Mon, Tue, ...)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayCountMap: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));

      bookings.forEach((booking: { bookingDate: string | number | Date; }) => {
        const bookingDate = new Date(booking.bookingDate); // bookingDate is a string
        const day = bookingDate.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue", ...
        if (dayCountMap[day] !== undefined) {
          dayCountMap[day]++;
        }
      });

      return {
        chart: {
          labels: days,
          values: days.map((d) => dayCountMap[d]),
        },
      };
    }

    else if (chartType === 'lastMonth') {
      const OneMonthAgoDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const OneMonthAgoIso = OneMonthAgoDate.toISOString().split('T')[0];
      const toStartOfOneMonthAgo = toStartOfDay(OneMonthAgoIso);
      const toStartOfToday = toStartOfDay(todayIso);

      const bookings = await BookingRepository.find({
        where: {
          restaurant: { id: restaurantId },
          endDateTime: Between(toStartOfOneMonthAgo, currentTime),
        },
      });


      // Group by 4 weeks (roughly divide 30 days to 4 parts)
      const weekBuckets = [0, 0, 0, 0];

      bookings.forEach((booking: { bookingDate: string | number | Date; }) => {
        const bookingDate = new Date(booking.bookingDate);
        const diffInDays = Math.floor((bookingDate.getTime() - OneMonthAgoDate.getTime()) / (1000 * 60 * 60 * 24));

        const weekIndex = Math.min(Math.floor(diffInDays / 7.5), 3); // 0 to 3
        weekBuckets[weekIndex]++;
      });

      return {
        chart: {
          labels: ['week1', 'week2', 'week3', 'week4'],
          values: weekBuckets,
        },
      };
    }

    throw new BadRequestError('chartType is not valid');
  } catch (error) {
    console.error('Error in charts', { error }, 'BookingService');
    throw error;
  }
};

export const customerChart = async (restaurantId: number, chartType: string, timeZone: string) => {
  try {
    if (!restaurantId) throw new BadRequestError('restaurantId is required');
    if (!chartType) throw new BadRequestError('chartType is required');

    const today = new Date();
    const currentTime = getCurrentTimeInUTCFromTimeZone(timeZone);
    const todayIso = today.toISOString().split('T')[0];



    if (chartType === 'lastWeek') {
      const OneWeekAgoDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const OneWeekAgoIso = OneWeekAgoDate.toISOString().split('T')[0];
      const toStartOfOneWeekAgo = toStartOfDay(OneWeekAgoIso);

      const endDate = new Date(today);
      endDate.setDate(today.getDate());
      endDate.setHours(23, 59, 59, 999);
      const endDateIso = endDate.toISOString().split('T')[0];
      const toStartOfEndDate = toStartOfDay(endDateIso);

      const bookings = await BookingRepository.find({
        where: {
          restaurant: { id: restaurantId },
          endDateTime: Between(toStartOfOneWeekAgo, toStartOfEndDate),
        },
        relations: ['customer'], // Ensure customer relation is loaded
      });

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayCountMap: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
      const uniqueCustomerMap: Record<string, Set<number>> = Object.fromEntries(days.map((d) => [d, new Set()]));

      bookings.forEach((booking: { bookingDate: string | number | Date; customer: { id: number; }; }) => {
        const bookingDate = new Date(booking.bookingDate);
        const day = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });

        if (dayCountMap[day] !== undefined) {
          dayCountMap[day]++;
          if (booking.customer?.id) {
            uniqueCustomerMap[day].add(booking.customer.id);
          }
        }
      });

      return {
        chart: {
          labels: days,
          values: days.map((d) => uniqueCustomerMap[d].size),
        },
      };
    }

    if (chartType === 'lastMonth') {
      const OneMonthAgoDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const OneMonthAgoIso = OneMonthAgoDate.toISOString().split('T')[0];
      const toStartOfOneMonthAgo = toStartOfDay(OneMonthAgoIso);

      const bookings = await BookingRepository.find({
        where: {
          restaurant: { id: restaurantId },
          endDateTime: Between(toStartOfOneMonthAgo, currentTime),
        },
        relations: ['customer'],
      });

      const weekBuckets = [0, 0, 0, 0];
      const uniqueCustomerBuckets: Set<number>[] = [new Set(), new Set(), new Set(), new Set()];

      bookings.forEach((booking: { bookingDate: string | number | Date; customer: { id: number; }; }) => {
        const bookingDate = new Date(booking.bookingDate);
        const diffInDays = Math.floor((bookingDate.getTime() - OneMonthAgoDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.min(Math.floor(diffInDays / 7.5), 3);

        weekBuckets[weekIndex]++;
        if (booking.customer?.id) {
          uniqueCustomerBuckets[weekIndex].add(booking.customer.id);
        }
      });

      return {
        chart: {
          labels: ['week1', 'week2', 'week3', 'week4'],
          values: uniqueCustomerBuckets.map((set) => set.size),
        }
      };
    }

    throw new BadRequestError('chartType is not valid');
  } catch (error) {
    console.error('Error in charts', { error }, 'BookingService');
    throw error;
  }
};

export const getRepeatAndNewCustomerCounts = async (restaurantId: number) => {
  try {
    if (!restaurantId) throw new BadRequestError('restaurantId is required');

    const bookings = await BookingRepository.find({
      where: {
        restaurant: { id: restaurantId },
      },
      relations: ['customer'],
    });

    const customerBookingCounts: Record<number, number> = {};

    bookings.forEach((booking: { customer: { id: any; }; }) => {
      const customerId = booking.customer?.id;
      if (customerId) {
        customerBookingCounts[customerId] = (customerBookingCounts[customerId] || 0) + 1;
      }
    });

    let repeatCustomers = 0;
    let newVisitors = 0;

    Object.values(customerBookingCounts).forEach((count) => {
      if (count > 1) repeatCustomers++;
      else newVisitors++;
    });

    return {
      repeatCustomers,
      newVisitors,
    };
  } catch (error) {
    console.error('Error in getRepeatAndNewCustomerCounts', { error });
    throw error;
  }
};

export const getNotifications = async (
  userId: number,
  page: number,
  limit: number,
) => {
  try {
    const user = await UserRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error(`user not found.`);
    }

    const [notifications, count] = await NotificationRepository.findAndCount({
      where: {
        receiver: { id: userId },
      },
      relations: ["receiver", "sender"],
      order: {
        createdAt: "DESC",
      },
      skip: limit * (page - 1),
      take: limit,
    });
    if (notifications.length === 0) {
      return [];
    }
    return {
      notifications: notifications,
      count: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    throw error;
  }
};

export const readNotification = async (
  userId: number,
  notificationId: number,
) => {
  try {
    const notification = await NotificationRepository.findOne({
      where: {
        id: notificationId,
        receiver: { id: userId },
      },
    });

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found.`);
    }

    notification.isSeen = true;
    await NotificationRepository.save(notification);
    return {
      message: "Notification marked as read successfully.",
    };
  } catch (error) {
    throw error;
  }
};

export const addMenuCategory = async (userId: number, menuCategory: string) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['producer'],
    });

    if (!user || !user.producer) {
      throw new NotFoundError('Producer not found for this user');
    }

    const producer = user.producer;

    const newMenuCategory = new MenuCategory();
    newMenuCategory.name = menuCategory;
    newMenuCategory.producer = producer;
    await MenuCategoryRepository.save(newMenuCategory);

    return {
      message: "Menu category added successfully.",
    };
  } catch (error) {
    throw error;
  }
};

export const getMenuCategories = async (userId: number, page: number, limit: number) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['producer'],
    });

    if (!user || !user.producer) {
      throw new NotFoundError('Producer not found for this user');
    }

    const producer = user.producer;

    const [menuCategories, count] = await MenuCategoryRepository.findAndCount({
      where: { producer: { id: producer.id } },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        id: 'DESC',
      },
    });

    return {
      menuCategories,
      count,
      currentPage: page,
      totalPage: Math.ceil(count / limit),
    };
  } catch (error) {
    throw error;
  }
};
export const addMenuDish = async (input: AddMenuDish) => {
  try {
    const { name, price, categoryId, description } = input;
    const category = await MenuCategoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundError('Menu category not found');
    }
    const newMenuDish = new MenuDishes();
    newMenuDish.name = name;
    newMenuDish.price = price;
    newMenuDish.menuCategory = category;
    newMenuDish.description = description;
    await MenuDishesRepository.save(newMenuDish);
    return {
      message: "Menu dish added successfully.",
    };
  } catch (error) {
    throw error;
  }
};

export const getMenu = async (userId: number) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['producer'],
    });

    if (!user || !user.producer) {
      throw new NotFoundError('Producer not found for this user');
    }

    const producer = user.producer;

    const menuCategories = await MenuCategoryRepository.find({
      where: { producer: { id: producer.id } },
      order: {
        id: 'DESC',
      },
      relations: ['dishes'],
    });

    return {
      menu: menuCategories,
    };
  } catch (error) {
    throw error;
  }
};

export const getCuisineTypes =  async ( page : number, limit : number) => {
  try {
    const [ cuisineTypes, count ] = await CuisineTypeRepository.findAndCount(
      {
        where: {
          isActive: true,
          isDeleted: false,
        },
        skip: (page - 1) * limit,
        take: limit,
      }
    );
    return {
      cuisineTypes,
      count,
      currentPage: page,
      totalPage: Math.ceil(count / limit),
    };
  } catch (error) {
    throw error;
  }
};

export const getCuisineType = async (cuisineTypeId : number) => {
  try {
    const cuisineType = await CuisineTypeRepository.findOne({ 
      where: { id: cuisineTypeId },
    });
    if (!cuisineType) {
      throw new NotFoundError('Cuisine type not found');
    }
    return {
      cuisineType,
    };
  } catch (error) {
    throw error;
  }
};


export const setCuisineType = async (userId : number, cuisineTypeId : number) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['restaurant'],
    });
    if (!user || !user.restaurant) {
      throw new NotFoundError('Restaurant not found for this user');
    } 
    const restaurant = user.producer; 
    restaurant.cuisineType = cuisineTypeId;
    await UserRepository.save(restaurant);
    return {
      message: "Cuisine type set successfully.",
    };
  } catch (error) {
    throw error;
  }
};








export * as ProfileService from './profile.service';
