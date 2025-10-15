import { AccountDeleteSchema, PreSignedURL, UpdateProfileSchema } from '../../validators/app/user.profile.validation';
import {
  BlockRepository,
  BookingRepository,
  DeletedUsersRepository,
  DeleteReasonRepository,
  FavouriteRestaurantRepository,
  HelpAndSupportRepository,
  NotificationRepository,
  PasswordRepository,
  RestaurantRepository,
  RolesRepository,
  SocialLoginRepository,
  UserRepository,
} from '../../repositories';
import { comparePassword, hashPassword } from '../../utils/PasswordUtils';
import s3Service from '../s3.service';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { In } from 'typeorm';
import Block from '../../models/Block';
import PostgresDataSource from '../../data-source';

export const updateProfile = async (userId: number, updateProfileObject: UpdateProfileSchema) => {
  try {
    const user = await UserRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    Object.assign(user, updateProfileObject);

    await UserRepository.save(user);

    return { message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error in updateProfile", { error });
    throw error;
  }
};

export const getProfile = async (userId: number) => {
  try {
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return { user: user };
  } catch (error) {
    console.error('Error in getProfile', { error });
    throw error;
  }
};

export const searchUsers = async (userId: number, query: string) => {
  const qb = UserRepository.createQueryBuilder("user")
    .where("user.id != :userId", { userId });

  if (query && query.trim() !== "") {
    qb.andWhere("user.userName ILIKE :query", { query: `%${query}%` });
  }

  // Exclude blocked users via subquery
  qb.andWhere(`user.id NOT IN (
      SELECT CASE
        WHEN b."blockerId" = :userId THEN b."blockedUserId"
        ELSE b."blockerId"
      END
      FROM "Blocks" b
      WHERE b."blockerId" = :userId OR b."blockedUserId" = :userId
    )`, { userId });

  return qb.limit(20).getMany();
};

export const getUserDetailById = async (userId: number) => {
  const user = await UserRepository.findOne({
    where: { id: userId },
    relations: [
      "posts",
      "posts.images",
      "posts.comments",
      "posts.likes",
      "postLikes",
      "postComments",
      "postShares",
      "follows",          // following
      "followedByUsers",  // followers
      "blockedUsers",
      "blockedBy",
    ],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const deleteProfile = async (userId: number) => {
  return await PostgresDataSource.transaction(async (manager: any) => {
    const user = await manager.getRepository(UserRepository.target).findOne({
      where: { id: userId },
      relations: [
        'Password',
        'businessProfile',
        'restaurant',
        'producer',
        'posts',
        'postLikes',
        'postComments',
        'postShares',
        'postTags',
        'postEmotions',
        'postRatings',
        'follows',
        'followedByUsers',
      ],
    });

    if (!user) throw new NotFoundError('User not found');
    if (user.isDeleted) throw new BadRequestError('User already deleted');

    // Delete Password first (to prevent FK violation)
    if (user.Password) {
      await manager.getRepository(PasswordRepository.target).delete({ id: user.Password.id });
    }

    // Cascade delete all related entities (BusinessProfile, Restaurant, Producer, Posts, etc.)
    await manager.remove(user);

    return user;
  });
};

export const getPreSignedUrlForProfileImage = async (userId: number, getPreSignedURLObject: PreSignedURL) => {
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
        role: 'user',
      },
    });
    return { deleteReasons };
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async (userId: number, deleteReasonId: number, otherReason?: string) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ['Password'],
    });

    const getBookings = await BookingRepository.find({
      where: {
        customer: {
          id: userId,
        },
        status: In(['scheduled', 'inProgress']),
      }
    })

    if (getBookings.length > 0) {
      const cancelGetBookings = getBookings.map(async (booking: { id: any; }) => {
        await BookingRepository.update(booking.id, {
          status: 'cancelled',
          cancelBy: 'user',
          cancelReason: 'User Account deleted',
        });
      })
      await Promise.all(cancelGetBookings);
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.isDeleted) {
      throw new BadRequestError('User already deleted');
    }

    if (user.Password) {
      await PasswordRepository.remove(user.Password);
    }

    const deleteReason = await DeleteReasonRepository.findOne({
      where: {
        id: deleteReasonId,
        role: 'user',
      },
    });
    if (!deleteReason) {
      throw new NotFoundError('Delete reason not found');
    }

    const timestamp = Date.now();
    const [localPart, domain] = user.email.split('@');
    await UserRepository.createQueryBuilder('user')
      .update()
      .set({
        isDeleted: true,
        isActive: false,
        email: `${localPart}+deleted_${timestamp}@${domain}`,
        firstName: `deleted+${user.firstName}`,
        lastName: `deleted+${user.lastName}`,
        phoneNumber: `deleted+${user.phoneNumber}`,
        profilePicture: '',
      })
      .where('id = :id', { id: userId })
      .execute();

    const deleteUserEntry = DeletedUsersRepository.create({
      user: user,
      deleteReason: deleteReason,
      role: 'user',
      otherReason: otherReason ? otherReason : null
    });

    await DeletedUsersRepository.save(deleteUserEntry);

    return { message: 'Account deleted successfully' };
  } catch (error) {
    console.error('Error in deleteAccount', { error });
    throw error;
  }
};

export const deleteAccountByEmail = async (deleteObject: AccountDeleteSchema) => {
  try {
    const { email, password } = deleteObject;
    const user = await UserRepository.findOne({
      where: {
        email: email.toLowerCase(),
      },
      relations: ['role', 'Password'],
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (user.role.id != userRole.id) {
      throw new BadRequestError('user is not an app user');
    }
    if (user.isDeleted) {
      throw new BadRequestError('This account is already deleted');
    }
    if (user.isActive === false) {
      throw new BadRequestError("You're not allowed to delete account, Kindly contact the admin");
    }
    const isPasswordMatch = await comparePassword(password, user.Password.password);
    if (!isPasswordMatch) {
      throw new BadRequestError('Invalid password');
    }

    const userEmail = user.email;
    const uniqueSuffix = `+deleted_${Date.now()}`;
    user.email = userEmail.split('@')[0] + uniqueSuffix + '@' + userEmail.split('@')[1];
    user.name = 'deleted+' + user.name;
    user.isActive = false;
    user.isDeleted = true;
    user.profileImage = '';
    user.password = '';

    await UserRepository.save(user);
    const socialLogin = await SocialLoginRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (socialLogin) {
      await SocialLoginRepository.remove(socialLogin);
    }

    return { message: 'Account deleted successfully' };
  } catch (error) {
    console.error(
      'Error in delete account',
      {
        error,
        deleteObject,
      },
      'UserProfileService'
    );
    throw error;
  }
};

export const getContactSupport = async () => {
  try {
    const contactSupport = await HelpAndSupportRepository.findOne({ where: { id: 1 } });
    if (!contactSupport) {
      return { email: '', phone: '' };
    }

    return { email: contactSupport.emailForCustomers, phone: contactSupport.phoneForCustomers };
  } catch (error) {
    console.error('Error in getProfile', { error });
    throw error;
  }
};


export const addFavouriteRestaurant = async (
  userId: number,
  restaurantId: number,
) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ["role"],
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.role.name !== "user") {
      throw new BadRequestError("userId is invalid");
    }
    const restaurant = await RestaurantRepository.findOne({
      where: {
        user: { id: restaurantId, isActive: true, isDeleted: false },
      },
      relations: ["user", "user.role"],
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (restaurant.user.role.name !== "restaurant") {
      throw new BadRequestError("RestaurantId is invalid");
    }
    const favouriteRestaurants = await FavouriteRestaurantRepository.findOne({
      where: {
        user: { id: userId },
        restaurant: { id: restaurant.user.id },
      },
    });
    if (favouriteRestaurants) {
      throw new BadRequestError("Restaurant already exist in favourites");
    }

    const favourite = FavouriteRestaurantRepository.create({
      user: user,
      restaurant: restaurant.user,
    });
    const saveFavourite = await FavouriteRestaurantRepository.save(favourite);

    return { favourite: saveFavourite };
  } catch (error) {
    console.error("Error in addFavouriteRestaurant", { error });
    throw error;
  }
};

export const removeFavouriteRestaurant = async (
  userId: number,
  RestaurantId: number,
) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ["role"],
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.role.name !== "user") {
      throw new BadRequestError("userId is invalid");
    }
    const restaurant = await RestaurantRepository.findOne({
      where: { user: { id: RestaurantId } },
      relations: ["user", "user.role"],
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (restaurant.user.role.name !== "restaurant") {
      throw new BadRequestError("restaurantId is invalid");
    }
    const favouriteRestaurants = await FavouriteRestaurantRepository.findOne({
      where: {
        user: { id: userId },
        restaurant: { id: restaurant.user.id },
      },
    });
    if (!favouriteRestaurants) {
      throw new BadRequestError("Restaurant not found in favourites");
    }
    await FavouriteRestaurantRepository.remove(favouriteRestaurants);
    return {
      message: "Restaurant removed from favourites",
    };
  } catch (error) {
    throw error;
  }
};

// export const getFavouriteRestaurants = async (userId: number, latitude: number, longitude: number) => {
//   try {
//     const user = await UserRepository.findOne({
//       where: { id: userId },
//       relations: ["role"],
//     });

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     if (user.role.name !== "user") {
//       throw new BadRequestError("Invalid userId");
//     }
//     const favouriteRestaurants = await FavouriteRestaurantRepository.find({
//       where: { user: { id: userId } },
//       relations: [
//         "restaurant",
//         "restaurant.restaurant",
//       ],
//     });

//     if (!favouriteRestaurants || favouriteRestaurants.length === 0) {
//       return { favouriteRestaurants: [] };
//     }

//     const restaurantIds = favouriteRestaurants.map(
//       (fav: { restaurant: { id: any } }) => fav.restaurant.id,
//     );
//     const favouriteRestaurantsUpdated = favouriteRestaurants.map(
//       (fav: { restaurant: any }) => {
//         const restaurant = fav.restaurant;
//         return { ...restaurant };
//       },
//     );

//     return { favouriteRestaurants: favouriteRestaurantsUpdated };
//   } catch (error) {
//     console.error("Error in getFavouriteRestaurants:", error);
//     throw error;
//   }
// };


export const getFavouriteRestaurants = async (
  userId: number,
  latitude: number,
  longitude: number
) => {
  try {
    const user = await UserRepository.findOne({
      where: { id: userId },
      relations: ["role"],
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.role.name !== "user") {
      throw new BadRequestError("Invalid userId");
    }

    const favouriteRestaurants = await FavouriteRestaurantRepository.find({
      where: { user: { id: userId } },
      relations: ["restaurant"],
    });


    if (favouriteRestaurants.length === 0) {
      return { favouriteRestaurants: [] };
    }

    const restaurantIds = favouriteRestaurants.map((fav: { restaurant: { id: any; }; }) => fav.restaurant.id);

    const restaurantsWithDistance = await RestaurantRepository.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.user', 'user')
      .leftJoinAndSelect('restaurant.cuisineType', 'cuisineType')
      .addSelect(
        `ST_Distance(
          "restaurant"."locationPoint"::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        )`,
        'distance'
      )
      .where('restaurant.userId IN (:...userIds)', { userIds: restaurantIds })
      .setParameters({ latitude, longitude })
      .getRawAndEntities();

    const favouriteRestaurantsWithDistance = restaurantsWithDistance.entities.map(
      (restaurant: { id: any; userId: any; restaurantName: any; address: any; latitude: any; longitude: any; user: { profilePicture: any; }; cuisineType: any; rating: any; }, index: string | number) => {
        const distanceInMeters = restaurantsWithDistance.raw[index].distance;
        const distanceInKm = (distanceInMeters / 1000).toFixed(2);

        return {
          id: restaurant.userId,
          restaurantName: restaurant.restaurantName,
          address: restaurant.address,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          profilePicture: restaurant.user?.profilePicture || null,
          distanceInMeters: Math.round(distanceInMeters),
          distanceInKm: Number(distanceInKm),
          cuisineType: restaurant.cuisineType,
          rating: restaurant.rating,
        };
      }
    );

    return { favouriteRestaurants: favouriteRestaurantsWithDistance };
  } catch (error) {
    console.error("Error in getFavouriteRestaurants:", error);
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







export * as ProfileService from './profile.service'