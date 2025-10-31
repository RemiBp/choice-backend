import { NextFunction, Request, Response } from 'express';
import {
  addMenuDishSchema,
  deleteRestaurantImageSchema,
  getRestaurantImagesSchema,
  multiPresignedURLSchema,
  presignedURLSchema,
  reviewsAndRatingsSchema,
  setCapacitySchema,
  setGalleryImagesSchema,
  setMainImageSchema,
  setOperationHoursSchema,
  setServiceTypeSchema,
  updatePasswordSchema,
  updateProfileSchema,
  uploadDocumentsSchema,
  uploadRestaurantImagesSchema,
} from '../../validators/producer/profile.validation';
import { ProfileService } from '../../services/producer/profile.service';
import { time } from 'console';

export const getAllServiceType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventTypes = await ProfileService.getAllServiceType();
    res.status(200).json({
      message: "Services types fetched successfully",
      eventTypes,
    });
  } catch (error) {
    next(error);
  }
};

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

export const updatePassword = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const validatedData = updatePasswordSchema.parse(req.body);
    const userId = Number(req.userId);

    const response = await ProfileService.updatePassword(userId, validatedData);
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

export const deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const result = await ProfileService.deleteProfile(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProducers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await ProfileService.getProducers();
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProducerbyId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const producerId = Number(req.params.id);
    const response = await ProfileService.getProducerById(producerId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getPreSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const fileName = req.body.fileName;
    const contentType = req.body.contentType;
    const folderName = req.body.folderName;
    if (!userId) {
      throw new Error('User id is required');
    }
    const validatedObject = presignedURLSchema.parse({
      fileName,
      contentType,
      folderName,
    });
    const response = await ProfileService.getPreSignedUrl(userId, validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getMultiplePreSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const parsed = multiPresignedURLSchema.parse(req.body);
    const { files } = parsed;

    const result = await ProfileService.getMultiplePreSignedUrl(userId, files);

    return res.status(200).json({
      success: true,
      message: "Pre-signed URLs generated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const changeCurrentPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const newPassword = req.body.newPassword;
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    if (!userId) {
      throw new Error('User id is required');
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
    if (!userId) {
      throw new Error('User id is required');
    }
    const response = await ProfileService.deleteAccount(userId, deleteReasonId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const uploadDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const certificateOfHospitality = req.body.certificateOfHospitality;
    const certificateOfTourism = req.body.certificateOfTourism;
    if (!userId) {
      throw new Error('User id is required');
    }
    const validatedObject = uploadDocumentsSchema.parse({
      userId,
      certificateOfHospitality: certificateOfHospitality,
      certificateOfTourism: certificateOfTourism,
    });
    const response = await ProfileService.uploadDocuments(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const uploadMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const menuUrl = req.body.menuUrl;
    if (!userId) {
      throw new Error('User id is required');
    }
    const response = await ProfileService.uploadMenu(userId, menuUrl);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new Error('User id is required');
    }
    const response = await ProfileService.getMenu(userId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const setServiceType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    const { serviceTypeIds } = setServiceTypeSchema.parse(req.body);

    const result = await ProfileService.setServiceType({
      userId: Number(userId),
      serviceTypeIds,
    });

    res.status(200).json({
      message: "Service types updated successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const getServiceType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    const result = await ProfileService.getServiceType({
      userId: Number(userId),
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


export const setGalleryImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const validated = setGalleryImagesSchema.parse(req.body);
    await ProfileService.setGalleryImages(userId, validated);

    res.status(200).json({ message: 'Gallery images saved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getGalleryImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const images = await ProfileService.getGalleryImages(userId);
    res.status(200).json({ images });
  } catch (error) {
    next(error);
  }
};

export const generateSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const response = await ProfileService.generateSlotsForProducer(userId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const setOperationalHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hours = req.body.hours;
    const restaurantId = Number(req.userId);
    if (!restaurantId) {
      throw new Error('restaurantId is required');
    }
    if (!hours) {
      throw new Error('hours is required');
    }
    const validatedObject = setOperationHoursSchema.parse({
      restaurantId,
      hours,
    });

    const response = await ProfileService.setOperationalHours(validatedObject);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getOperationalDays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const response = await ProfileService.getOperationalDays(userId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const setCapacity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const { totalSeats, noOfTables, maxPartySize } = setCapacitySchema.parse(req.body);

    const response = await ProfileService.setCapacity({ userId, totalSeats, noOfTables, maxPartySize });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const setSlotDuration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const slotDuration = Number(req.body.slotDuration);
    const response = await ProfileService.setSlotDuration(restaurantId, slotDuration);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getSlotDuration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const response = await ProfileService.getSlotDuration(restaurantId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getUnavailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const timezone = req.query.timeZone ? String(req.query.timeZone) : undefined;
    const date = req.query.date ? String(req.query.date) : undefined;
    if (!timezone) {
      throw new Error('timeZone is required');
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const response = await ProfileService.getUnavailableSlots(restaurantId, timezone, page, limit, date ? date : undefined);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export const addUnavailableSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const slotIds = req.body.slotIds
    const date = req.body.date ? String(req.body.date) : undefined;
    if (!date) {
      throw new Error('Date is required');
    }
    if (!slotIds) {
      throw new Error('slotIds array is required');
    }
    const response = await ProfileService.addUnavailableSlot(restaurantId, slotIds, date);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export const getOperationalHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const response = await ProfileService.getOperationalHours(restaurantId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProducerSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const producerId = Number(req.userId);
    const response = await ProfileService.getProducerSlots(producerId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateRestaurantSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'Slots array is required' });
    }

    const response = await ProfileService.updateRestaurantSlots(userId, slots);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in updateRestaurantSlots', { error }, 'BookingService');
    next(error);
  }
};

export const uploadRestaurantImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const images = req.body.images;

    const validatedObject = uploadRestaurantImagesSchema.parse({
      restaurantId,
      images,
    });

    const response = await ProfileService.uploadRestaurantImages(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in uploadRestaurantImages', { error }, 'BookingService');
    next(error);
  }
};

export const setMainImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const imageId = Number(req.params.id);

    const validatedObject = setMainImageSchema.parse({
      restaurantId,
      imageId,
    });

    const response = await ProfileService.setMainImage(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in uploadRestaurantImages', { error }, 'BookingService');
    next(error);
  }
};

export const getRestaurantImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const validatedObject = getRestaurantImagesSchema.parse({
      restaurantId,
      page,
      limit,
    });
    const response = await ProfileService.getRestaurantImages(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteRestaurantImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const imageId = Number(req.params.id);
    const validatedObject = deleteRestaurantImageSchema.parse({
      restaurantId,
      imageId,
    });
    const response = await ProfileService.deleteRestaurantImage(validatedObject);
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

export const reviewsAndRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = req.query.filter
    const validatedObject = reviewsAndRatingsSchema.parse({
      userId,
      page,
      limit,
      filter
    })
    const response = await ProfileService.reviewsAndRating(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getReviewsByStar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const star = req.query.star ? Number(req.query.star) : undefined;
    if (!star) {
      throw new Error('star is required');
    }
    const response = await ProfileService.getReviewsByStar(userId, star, page, limit);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const onBoardingDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const response = await ProfileService.onBoardingDetail(restaurantId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const response = await ProfileService.getPaymentMethods(userId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const addPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const paymentMethods = req.body.paymentMethods;
    const response = await ProfileService.addPaymentMethods(restaurantId, paymentMethods);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRestaurantSlotsByDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.userId);
    const date = req.body.date ? String(req.body.date) : new Date().toISOString().split('T')[0];
    const timeZone = req.body.timeZone ? String(req.body.timeZone) : undefined;
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    const response = await ProfileService.getRestaurantSlotsByDate(restaurantId, timeZone, date);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const bookingChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const chartType = req.query.chartType ? String(req.query.chartType) : undefined;
    const timeZone = req.query.timeZone ? String(req.query.timeZone) : undefined;
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    if (!chartType) {
      throw new Error('chartType is required');
    }
    const response = await ProfileService.bookingChart(userId, chartType, timeZone);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const customerChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const chartType = req.query.chartType ? String(req.query.chartType) : undefined;
    const timeZone = req.query.timeZone ? String(req.query.timeZone) : undefined;
    if (!timeZone) {
      throw new Error('timeZone is required');
    }
    if (!chartType) {
      throw new Error('chartType is required');
    }
    const response = await ProfileService.customerChart(userId, chartType, timeZone);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRepeatAndNewCustomerCounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const response = await ProfileService.getRepeatAndNewCustomerCounts(userId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

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

export const addMenuCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const menuCategory = req.body.menuCategory;
    const response = await ProfileService.addMenuCategory(userId, menuCategory);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getMenuCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10
    const response = await ProfileService.getMenuCategories(userId, page, limit);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export const addMenuDish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const categoryId = req.body.categoryId;
    const validatedObject = addMenuDishSchema.parse({
      userId,
      name,
      description,
      price,
      categoryId,
    });
    const response = await ProfileService.addMenuDish(validatedObject);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCuisineTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const response = await ProfileService.getCuisineTypes(page, limit);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export const getCuisineType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cuisineTypeId = Number(req.params.id);
    const response = await ProfileService.getCuisineType(cuisineTypeId);
    res.status(200).json(response);
  }
  catch (error) {
    next(error);
  }
}

export const setCuisineType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.userId);
    const cuisineTypeId = req.body.cuisineTypeId;
    const response = await ProfileService.setCuisineType(userId, cuisineTypeId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export * as ProfileController from './profile.controller';
