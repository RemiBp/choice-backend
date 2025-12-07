import { NotFoundError } from '../../errors/notFound.error';
import { BadRequestError } from '../../errors/badRequest.error';
import {
    PostRepository,
    PostRatingRepository,
    PostImageRepository,
    ProducerRepository,
    PostEmotionRepository,
    PostLikeRepository,
    PostCommentRepository,
    PostShareRepository,
    PostStatisticsRepository,
    FollowRepository,
    UserRepository,
    NotificationRepository,
    PostTagRepository,
    RestaurantPostRatingRepository,
    LeisurePostRatingRepository,
    WellnessPostRatingRepository,
    RestaurantRatingRepository,
    ServiceRatingRepository,
    EventRatingRepository,
    EventRepository,
    LeisureRepository,
    WellnessRepository,
    TagRepository,
    DishRatingRepository,
    MenuDishesRepository,
    WellnessServiceTypeRepository,
    WellnessServiceRepository,
    BookingRepository,
    SlotRepository,
} from '../../repositories';
import { CreateDishRatingsInput, CreateEmotionInput, CreateEventRatingsInput, CreatePostInput, CreateProducerPostInput, CreateRatingInput, CreateServiceRatingsInput, EmotionSchema } from '../../validators/producer/post.validation';
import AppDataSource from '../../data-source';
import z from 'zod';
import Follow from '../../models/Follow';
import User from '../../models/User';
import { BusinessRole, RoleName } from '../../enums/Producer.enum';
import { sendAdminNotification } from '../../utils/sendAdminNotification';
import { NotificationTypeEnums, PostNotificationCode } from '../../enums/post-notification.enum';
import { FollowStatusEnums } from '../../enums/followStatus.enum';
import { LeisureRatingCriteria, RestaurantRatingCriteria, WellnessRatingCriteria } from '../../enums/rating.enum';
import { Between, EntityManager, ILike, In } from 'typeorm';
import ServiceRating from '../../models/ServiceRatings';
import ProducerService from '../../models/Services';
import WellnessServiceType from '../../models/WellnessServiceTypes';
import { addDays, addMinutes, endOfDay, endOfWeek, startOfDay, startOfWeek } from 'date-fns';
import { ProducerType } from '../../enums/ProducerType.enum';
import { getProducerSlots } from './profile.service';

export const searchProducers = async (query: string, type: string) => {
    if (
        type !== BusinessRole.RESTAURANT &&
        type !== BusinessRole.WELLNESS &&
        type !== BusinessRole.LEISURE
    ) {
        throw new NotFoundError("Invalid type provided");
    }

    const producers = await ProducerRepository.find({
        where: {
            type,
            name: ILike(`%${query}%`),
            isDeleted: false,
            isActive: true,
        },
        take: 10,
    });

    return producers;
};

export const createUserPost = async (userId: number, data: CreatePostInput) => {

    if (data.imageUrls && data.imageUrls.length > 5) {
        throw new BadRequestError("You can upload a maximum of 5 images");
    }

    if (data.coverImage && !data.imageUrls?.includes(data.coverImage)) {
        throw new BadRequestError("Cover image must be one of the uploaded images");
    }

    const producer = await ProducerRepository.findOne({
        where: { id: data.placeId, isDeleted: false, isActive: true },
    });
    if (!producer) {
        throw new NotFoundError("Producer not found for the given placeId");
    }

    const post = await PostRepository.save({
        ...data,
        producerId: producer.id,
        userId,
        tags: data.tags ?? [],
        isDeleted: false,
        likesCount: 0,
        commentCount: 0,
        shareCount: 0,
    });

    if (data.tags?.length) {
        for (const tagName of data.tags) {
            let tag = await TagRepository.findOne({ where: { name: tagName } });
            if (!tag) {
                tag = await TagRepository.save(
                    TagRepository.create({ name: tagName })
                );
            }

            await PostTagRepository.save({
                postId: post.id,
                userId,
                tagId: tag.id,
                isDeleted: false,
            });
        }
    }

    if (data.imageUrls?.length) {
        const images = data.imageUrls.map((url) =>
            PostImageRepository.create({
                postId: post.id,
                url,
                isCoverImage: url === data.coverImage,
            })
        );
        await PostImageRepository.save(images);
    }

    return post;
};

export const createProducerPost = async (userId: number, roleName: string, data: CreateProducerPostInput) => {

    if (roleName !== data.type) {
        throw new BadRequestError(`Role '${roleName}' is not allowed to create a '${data.type}' post.`);
    }

    const producer = await ProducerRepository.findOneBy({ userId });
    if (!producer) throw new NotFoundError('Producer not found for this user');

    if (data.imageUrls && data.imageUrls.length > 5) {
        throw new BadRequestError('You can upload a maximum of 5 images');
    }

    if (data.coverImage && !data.imageUrls?.includes(data.coverImage)) {
        throw new BadRequestError('Cover image must be one of the uploaded images');
    }

    const post = await PostRepository.save({
        ...data,
        tags: data.tags ?? [],
        isDeleted: false,
        likesCount: 0,
        commentCount: 0,
        shareCount: 0,
        userId: null,
        producerId: producer.id,
    });

    if (data.imageUrls?.length) {
        const images = data.imageUrls.map((url) =>
            PostImageRepository.create({
                postId: post.id,
                url,
                isCoverImage: url === data.coverImage,
            })
        );
        await PostImageRepository.save(images);
    }

    return { post: post };
};

export const getPostsByProducer = async (userId: number, roleName: string) => {
    const isValidProducerRole = Object.values(BusinessRole).includes(roleName as BusinessRole);
    if (!isValidProducerRole) {
        throw new BadRequestError(`Role '${roleName}' is not allowed to fetch posts.`);
    }

    const producer = await ProducerRepository.findOne({
        where: {
            user: { id: userId },
            type: roleName as BusinessRole,
        },
    });

    if (!producer) {
        throw new NotFoundError(`No producer found for user with role '${roleName}'.`);
    }

    const posts = await PostRepository.find({
        where: {
            producer: { id: producer.id },
            isDeleted: false,
        },
        relations: ['images'],
    });

    return posts;
};

// export const getPosts = async (userId: number, roleName: string) => {
//     if (roleName !== 'user') {
//         throw new Error('Only user role can fetch followed feed');
//     }

//     const posts = await PostRepository.createQueryBuilder('post')
//         .leftJoinAndSelect('post.images', 'images')
//         .leftJoinAndSelect('post.producer', 'producer')
//         .innerJoin(
//             Follow,
//             'follow',
//             `"follow"."followerId" = :userId AND (
//     "post"."userId" = "follow"."followedUserId" OR
//     "post"."producerId" = "follow"."producerId"
//   )`,
//             { userId }
//         )
//         .where('post.isDeleted = false')
//         .orderBy('post.createdAt', 'DESC')
//         .getMany();

//     return posts;
// };

export const getPosts = async (userId: number, roleName: string) => {
    if (roleName !== "user") {
        throw new BadRequestError("Only user role can fetch followed feed");
    }

    //  Fetch all followed posts
    const posts = await PostRepository.createQueryBuilder("post")
        .leftJoinAndSelect("post.images", "images")
        .leftJoinAndSelect("post.producer", "producer")
        .innerJoin(
            Follow,
            "follow",
            `"follow"."followerId" = :userId AND (
          "post"."userId" = "follow"."followedUserId" OR
          "post"."producerId" = "follow"."producerId"
        )`,
            { userId }
        )
        .where("post.isDeleted = false")
        .orderBy("post.createdAt", "DESC")
        .getMany();

    if (posts.length === 0) return [];

    const postIds = posts.map((p: { id: any; }) => p.id);
    const producerIds = posts
        .map((p: { producer: { id: any; }; }) => p.producer?.id)
        .filter((id: any): id is number => Boolean(id));

    // Batch fetch ratings
    const [
        allEventRatings,
        allServiceRatings,
        allDishRatings,
        allRestaurantRatings,
        allLeisureRatings,
        allWellnessRatings,
    ] = await Promise.all([
        EventRatingRepository.find({
            where: { postId: In(postIds) },
            select: ["id", "rating", "criteria", "postId"],
        }),
        ServiceRatingRepository.find({
            where: { postId: In(postIds) },
            relations: ["producerService", "producerService.serviceType"],
        }),
        DishRatingRepository.find({
            where: { postId: In(postIds) },
            relations: ["dish", "dish.menuCategory"],
            select: {
                id: true,
                rating: true,
                postId: true,
                dish: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    menuCategory: { id: true, name: true },
                },
            },
        }),
        RestaurantRatingRepository.find({ where: { producerId: In(producerIds) } }),
        LeisureRepository.find({ where: { producerId: In(producerIds) } }),
        WellnessRepository.find({ where: { producerId: In(producerIds) } }),
    ]);

    //  Attach ratings directly to posts
    for (const post of posts) {
        const { type, producer } = post;

        post.globalRating = null;
        post.criteriaRatings = {};

        if (type === BusinessRole.RESTAURANT && producer) {
            const r = allRestaurantRatings.find((x: { producerId: any; }) => x.producerId === producer.id);
            post.globalRating = r?.overall ?? null;
            post.criteriaRatings = Object.fromEntries(
                Object.values(RestaurantRatingCriteria).map((key) => [key, r?.[key] ?? null])
            );
            post.dishRatings = allDishRatings.filter((d: { postId: any; }) => d.postId === post.id);
        }

        if (type === BusinessRole.LEISURE && producer) {
            const r = allLeisureRatings.find((x: { producerId: any; }) => x.producerId === producer.id);
            post.globalRating = r?.overall ?? null;
            post.criteriaRatings = Object.fromEntries(
                Object.values(LeisureRatingCriteria).map((key) => [key, r?.[key] ?? null])
            );
            post.eventRatings = allEventRatings.filter((e: { postId: any; }) => e.postId === post.id);
        }

        if (type === BusinessRole.WELLNESS && producer) {
            const r = allWellnessRatings.find((x: { producerId: any; }) => x.producerId === producer.id);
            post.globalRating = r?.overall ?? null;
            post.criteriaRatings = Object.fromEntries(
                Object.values(WellnessRatingCriteria).map((key) => [key, r?.[key] ?? null])
            );
            post.serviceRatings = allServiceRatings.filter((s: { postId: any; }) => s.postId === post.id);
        }
    }
    return posts;
};

export const getMyPosts = async (userId: number, roleName: string) => {
    if (roleName === RoleName.USER) {
        const posts = await PostRepository.find({
            where: { userId },
            relations: [
                "images",
                "producer",
                "user",
                "postTags.tag",
            ],
            order: { createdAt: "DESC" },
        });

        return posts.map((post: any) => ({
            ...post,
            user: {
                id: post.user?.id,
                userName: post.user?.userName,
                profileImageUrl: post.user?.profileImageUrl,
                followersCount: post.user?.followersCount,
                followingCount: post.user?.followingCount,
            },
        }));
    }

    if (Object.values(BusinessRole).includes(roleName as BusinessRole)) {
        const producer = await ProducerRepository.findOne({
            where: { userId },
            relations: ["user"],
        });

        if (!producer) {
            throw new NotFoundError("Producer profile not found for this user");
        }

        const posts = await PostRepository.find({
            where: { producerId: producer.id },
            relations: [
                "images",
                "producer",
                "user",
            ],
            order: { createdAt: "DESC" },
        });

        return posts.map((post: any) => ({
            ...post,
            user: {
                id: post.user?.id,
                userName: post.user?.userName,
                profileImageUrl: post.user?.profileImageUrl,
                followersCount: post.user?.followersCount,
                followingCount: post.user?.followingCount,
            },
        }));
    }

    throw new BadRequestError("Invalid role for fetching posts");
};

export const getUserPostById = async (userId: number, postId: number) => {
    const post = await PostRepository.findOne({
        where: { id: postId, userId },
        relations: ['images'],
    });

    if (!post) throw new NotFoundError('Post not found or already deleted');
    return post;
};

export const getProducerPostById = async (producerId: number, postId: number) => {
    const post = await PostRepository.findOne({
        where: {
            id: postId,
            isDeleted: false,
            producer: {
                id: producerId,
            },
        },
        relations: ['images', 'producer'],
    });

    if (!post) throw new NotFoundError('Post not found or already deleted');
    return post;
};

export const updatePost = async (userId: number, data: any) => {
    const { postId, tags, ...updates } = data;

    const post = await PostRepository.findOne({
        where: { id: postId, isDeleted: false },
        relations: ['producer', 'postTags', 'postTags.tag'],
    });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    if (post.userId && post.userId !== userId) {
        throw new BadRequestError('You can only update your own user post');
    }

    Object.assign(post, updates);
    post.updatedAt = new Date();

    if (tags) {
        // await PostTagRepository.delete({ postId });

        for (const tagName of tags) {
            let tag = await TagRepository.findOne({ where: { name: tagName } });
            if (!tag) {
                tag = await TagRepository.save(TagRepository.create({ name: tagName }));
            }

            await PostTagRepository.save({
                post,
                userId,
                tagId: tag.id,
                isDeleted: false,
            });
        }
    }

    return await PostRepository.save(post);
};

export const deletePost = async (userId: number, postId: number) => {
    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    if (post.userId !== userId && post.producerId !== userId) {
        throw new BadRequestError('You can only delete your own posts');
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await PostRepository.save(post);

    return { post };
};

export const saveRatings = async (
    userId: number,
    postId: number,
    data: Omit<CreateRatingInput, "postId">
) => {
    const { ratings, comment = "" } = data;

    const post = await PostRepository.findOne({
        where: { id: postId, isDeleted: false },
        relations: ["producer"],
    });
    if (!post) throw new NotFoundError("Post not found or already deleted");

    if (!post.producer) {
        throw new BadRequestError("This post is not linked to a producer; cannot rate.");
    }

    const type = post.type || post.producer.type;
    if (!type) throw new BadRequestError("Post type not found");

    let repo: any,
        globalRepo: any,
        allowedFields: string[],
        entityId: number = 0,
        extraField: Record<string, number> = {};

    switch (type) {
        case BusinessRole.RESTAURANT: {
            const restaurant = await RestaurantRatingRepository.findOne({
                where: { producerId: post.producer.id },
            });
            if (!restaurant) {
                throw new BadRequestError(
                    `Restaurant profile not found for producerId=${post.producer.id}`
                );
            }

            repo = RestaurantPostRatingRepository;
            globalRepo = RestaurantRatingRepository;
            allowedFields = Object.values(RestaurantRatingCriteria) as string[];
            entityId = restaurant.id;
            extraField = { restaurantId: entityId };
            break;
        }

        case BusinessRole.LEISURE: {
            const leisure = await LeisureRepository.findOne({
                where: { producerId: post.producer.id },
            });
            if (!leisure) {
                throw new BadRequestError(
                    `Leisure profile not found for producerId=${post.producer.id}`
                );
            }

            repo = LeisurePostRatingRepository;
            globalRepo = LeisureRepository;
            allowedFields = Object.values(LeisureRatingCriteria) as string[];
            entityId = leisure.id;
            extraField = { leisureId: entityId };
            break;
        }

        case BusinessRole.WELLNESS: {
            const wellness = await WellnessRepository.findOne({
                where: { producerId: post.producer.id },
            });
            if (!wellness) {
                throw new BadRequestError(
                    `Wellness profile not found for producerId=${post.producer.id}`
                );
            }

            repo = WellnessPostRatingRepository;
            globalRepo = WellnessRepository;
            allowedFields = Object.values(WellnessRatingCriteria) as string[];
            entityId = wellness.id ?? 0;
            extraField = { wellnessId: entityId };
            break;
        }

        default:
            throw new BadRequestError("Invalid post type");
    }

    const invalidKeys = Object.keys(ratings).filter(
        (key) => !allowedFields.includes(key)
    );
    if (invalidKeys.length > 0) {
        throw new BadRequestError(
            `Invalid rating criteria for ${type}. Not allowed: ${invalidKeys.join(", ")}`
        );
    }

    const existing = await repo.findOne({ where: { userId, postId } });
    let savedRating;
    if (existing) {
        Object.assign(existing, { comment, ...ratings });
        savedRating = await repo.save(existing);
    } else {
        savedRating = await repo.save({
            userId,
            postId,
            comment,
            ...ratings,
            ...extraField,
        });
    }

    if (entityId) {
        await updateGlobalRating(type, postId, entityId, globalRepo, savedRating);
    }

    return {
        postId,
        savedRating,
        message: "Rating submitted successfully",
    };
};

async function updateGlobalRating(
    type: BusinessRole,
    postId: number,
    entityId: number,
    globalRepo: any,
    newRating?: any
) {
    let postRepo, criteriaFields: string[];

    switch (type) {
        case BusinessRole.RESTAURANT:
            postRepo = RestaurantPostRatingRepository;
            criteriaFields = Object.values(RestaurantRatingCriteria);
            break;

        case BusinessRole.LEISURE:
            postRepo = LeisurePostRatingRepository;
            criteriaFields = Object.values(LeisureRatingCriteria);
            break;

        case BusinessRole.WELLNESS:
            postRepo = WellnessPostRatingRepository;
            criteriaFields = Object.values(WellnessRatingCriteria);
            break;

        default:
            return;
    }

    const ratings = await postRepo.find({ where: { postId } });

    // 👇 Ensure freshly saved rating is included
    if (newRating && !ratings.find((r: { id: any }) => r.id === newRating.id)) {
        ratings.push(newRating);
    }

    if (!ratings.length) return;

    // ✅ Calculate averages
    const averages: Record<string, number> = {};
    criteriaFields.forEach((field) => {
        averages[field] = parseFloat(
            (
                ratings.reduce(
                    (sum: number, r: any) => sum + (Number(r[field]) || 0),
                    0
                ) / ratings.length
            ).toFixed(1)
        );
    });

    const overall = parseFloat(
        (
            Object.values(averages).reduce((sum, v) => sum + (v as number), 0) /
            criteriaFields.length
        ).toFixed(1)
    );

    // ✅ Update correct global table with sub-entity id
    await globalRepo
        .createQueryBuilder()
        .update()
        .set({
            ...averages,
            overall,
        })
        .where("id = :id", { id: entityId })
        .execute();
}

// export const createServiceRatings = async (input: {
//     userId: number;
//     postId: number;
//     ratings: { producerServiceId: number; ratings: Record<string, number> }[];
// }) => {
//     const { userId, postId, ratings } = input;

//     await AppDataSource.transaction(async (manager: EntityManager) => {
//         for (const r of ratings) {
//             const service = await manager.getRepository(ProducerService).findOne({
//                 where: { id: r.producerServiceId },
//             });

//             if (!service) {
//                 throw new NotFoundError(`ProducerService ${r.producerServiceId} not found`);
//             }

//             await manager.getRepository(ServiceRating).save({
//                 userId,
//                 postId,
//                 producerServiceId: r.producerServiceId,
//                 ratings: r.ratings,
//             });
//         }
//     });

//     return { message: "Service ratings added successfully." };
// };

export const createServiceRatings = async (
    input: CreateServiceRatingsInput & { userId: number }
) => {
    const { userId, postId, serviceTypeId, ratings } = input;

    const post = await PostRepository.findOne({
        where: { id: postId },
        relations: ["producer"],
    });
    if (!post) throw new NotFoundError("Post not found");

    const wellness = await WellnessRepository.findOne({
        where: { producerId: post.producer.id },
    });
    if (!wellness) {
        throw new NotFoundError("Producer wellness profile not found");
    }

    // 3. Find the matching service under this wellness
    const producerService = await WellnessServiceRepository.findOne({
        where: {
            wellnessId: wellness.id,
            serviceTypeId,
        },
        relations: ["serviceType"],
    });
    if (!producerService) {
        throw new NotFoundError("Producer does not have this service type");
    }

    // 4. Validate rating criteria
    const allowedCriteria = producerService.serviceType.criteria;
    const invalidKeys = Object.keys(ratings).filter(
        (k) => !allowedCriteria.includes(k)
    );
    if (invalidKeys.length > 0) {
        throw new BadRequestError(
            `Invalid rating fields: ${invalidKeys.join(", ")}`
        );
    }

    const entity = await ServiceRatingRepository.save({
        userId,
        postId,
        producerServiceId: producerService.id,
        serviceTypeId,
        ratings,
    });

    return entity;
};


export const createDishRatings = async (userId: number, input: CreateDishRatingsInput) => {
    const { postId, ratings } = input;

    const post = await PostRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundError("Post not found");

    const entities = [];

    for (const r of ratings) {
        const dish = await MenuDishesRepository.findOne({ where: { id: r.dishId } });
        if (!dish) throw new NotFoundError(`Dish with id ${r.dishId} not found`);

        entities.push(
            DishRatingRepository.create({
                userId,
                postId,
                dishId: r.dishId,
                rating: r.rating,
            })
        );
    }

    return await DishRatingRepository.save(entities);
};

export const getDishRatings = async (dishId: number) => {
    return DishRatingRepository.find({
        where: { dishId },
        relations: ["user"],
    });
};

export const createEventRatings = async (input: CreateEventRatingsInput & { userId: number }) => {
    const { userId, postId, eventId, ratings } = input;

    const event = await EventRepository.findOne({
        where: { id: eventId },
        relations: ["eventType"],
    });
    if (!event) throw new NotFoundError("Event not found or already deleted");

    const post = await PostRepository.findOne({
        where: { id: postId, isDeleted: false },
    });
    if (!post) throw new NotFoundError("Post not found or already deleted");

    if (!event.eventType) {
        throw new BadRequestError("Event type not configured for this event");
    }

    const allowedCriteria = new Set(event.eventType.criteria);
    const invalidCriteria = ratings
        .map((r) => r.criteria)
        .filter((c) => !allowedCriteria.has(c));

    if (invalidCriteria.length > 0) {
        throw new BadRequestError(`Invalid criteria: ${invalidCriteria.join(", ")}`);
    }

    const existingRatings = await EventRatingRepository.find({
        where: { userId, postId, eventId },
    });
    const existingCriteria = new Set(existingRatings.map((r: { criteria: any; }) => r.criteria));

    const newRatings = ratings.filter((r) => !existingCriteria.has(r.criteria));
    if (newRatings.length === 0) {
        throw new BadRequestError("You already rated this event with given criteria");
    }

    const ratingEntities = EventRatingRepository.create(
        newRatings.map((r) => ({
            userId,
            postId,
            eventId,
            criteria: r.criteria,
            rating: r.rating,
        }))
    );
    await EventRatingRepository.save(ratingEntities);

    const allRatings = await EventRatingRepository.find({ where: { eventId } });
    const avg =
        allRatings.reduce((sum: number, r: { rating: any; }) => sum + Number(r.rating), 0) /
        allRatings.length;

    post.overallAvgRating = avg;
    await PostRepository.save(post);

    return {
        ratings: ratingEntities,
        overallAvgRating: avg,
    };
};


export const saveEmotions = async (userId: number, postId: number, data: CreateEmotionInput) => {
    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    const savedEmotions = [];

    for (const emotion of data.emotions) {
        const existing = await PostEmotionRepository.findOneBy({ userId, postId, emotion });

        if (!existing) {
            PostEmotionRepository.save({ userId, postId, emotion });
            savedEmotions.push(emotion);
        }
    }

    return {
        postId,
        savedEmotions,
        message: savedEmotions.length
            ? 'Emotions saved.'
            : 'All emotions already exist.',
    };
};

export const updatePostEmotions = async (userId: number, postId: number, data: z.infer<typeof EmotionSchema>) => {
    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    await PostEmotionRepository
        .createQueryBuilder()
        .delete()
        .where("userId = :userId AND postId = :postId", { userId, postId })
        .execute();

    if (data.emotions.length > 0) {
        const insertData = data.emotions.map((emotion) => ({
            userId,
            postId,
            emotion,
        }));

        await PostEmotionRepository
            .createQueryBuilder()
            .insert()
            .into("PostEmotions")
            .values(insertData)
            .orIgnore()
            .execute();
    }

    return {
        postId,
        savedEmotions: data.emotions,
    };
};

export const togglePostLike = async (userId: number, postId: number) => {

    const user = await UserRepository.findOne({
        where: { id: userId, isDeleted: false },
        relations: ['role'],
    });

    if (!user) {
        throw new NotFoundError('User not found');
    }

    if (user.role.name !== RoleName.USER) {
        throw new BadRequestError('Only users can like posts');
    }

    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or has been deleted');

    let like = await PostLikeRepository.findOne({
        where: { userId, postId },
        withDeleted: true,
    });

    let stats = await PostStatisticsRepository.findOneBy({ postId });

    if (!stats) {
        stats = await PostStatisticsRepository.save({
            postId,
            totalLikes: 0,
            totalShares: 0,
            totalComments: 0,
            totalRatings: 0,
            averageRating: null,
            criteriaRatings: {},
            emotionCounts: {},
        });
    }

    if (like && !like.isDeleted) {
        like.isDeleted = true;
        like.deletedAt = new Date();
        await PostLikeRepository.save(like);

        post.likesCount = Math.max(0, post.likesCount - 1);
        stats.totalLikes = Math.max(0, stats.totalLikes - 1);

        await PostRepository.save(post);
        await PostStatisticsRepository.save(stats);

        return { liked: false, totalLikes: post.likesCount };
    }

    if (like && like.isDeleted) {
        like.isDeleted = false;
        like.deletedAt = null;
        await PostLikeRepository.save(like);
    } else {
        like = await PostLikeRepository.save({
            userId,
            postId,
            isDeleted: false,
        });
    }

    post.likesCount += 1;
    stats.totalLikes += 1;

    await PostRepository.save(post);
    await PostStatisticsRepository.save(stats);

    const postOwnerId = post.userId || post.producerId;

    if (postOwnerId && postOwnerId !== userId) {
        const postOwner = await UserRepository.findOneBy({ id: postOwnerId });

        if (postOwner) {
            const notification = await NotificationRepository.save({
                notificationId: PostNotificationCode.POST_LIKED,
                receiver: postOwner,
                sender: user,
                title: 'New Like on Your Post',
                body: `${user.fullName} liked your post.`,
                type: NotificationTypeEnums.POST_LIKE,
                purpose: NotificationTypeEnums.POST_LIKE,
            });

            if (postOwner.deviceId) {
                const notificationPayload = {
                    notificationId: String(PostNotificationCode.POST_LIKED),
                    postId: String(post.id),
                    type: NotificationTypeEnums.POST_LIKE,
                    senderId: String(userId),
                };

                await sendAdminNotification(
                    postOwner.deviceId,
                    'New Like on Your Post',
                    `${user.fullName} liked your post.`,
                    notificationPayload
                );
            }
        }
    }

    return { liked: true, totalLikes: post.likesCount };
};

// export const addCommentToPost = async (userId: number, postId: number, comment: string) => {
//     if (!comment || comment.trim() === '') {
//         throw new BadRequestError('Comment cannot be empty');
//     }

//     const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
//     if (!post) throw new NotFoundError('Post not found or already deleted');

//     const stats = await PostStatisticsRepository.findOneBy({ postId });

//     const newComment = await PostCommentRepository.save({
//         userId,
//         postId,
//         comment: comment.trim(),
//         isDeleted: false,
//     });

//     post.commentCount += 1;
//     if (stats) stats.totalComments += 1;

//     await Promise.all([
//         PostRepository.save(post),
//         stats ? PostStatisticsRepository.save(stats) : null,
//     ]);

//     return {
//         comment: newComment,
//         totalComments: post.commentCount,
//     };
// };


export const addCommentToPost = async (
    userId: number,
    postId: number,
    comment: string
) => {
    if (!comment || comment.trim() === "") {
        throw new BadRequestError("Comment cannot be empty");
    }

    const user = await UserRepository.findOne({
        where: { id: userId, isDeleted: false },
        relations: ["role"],
    });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    if (user.role.name !== RoleName.USER) {
        throw new BadRequestError("Only users can comment on posts");
    }

    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError("Post not found or already deleted");

    let stats = await PostStatisticsRepository.findOneBy({ postId });
    if (!stats) {
        stats = await PostStatisticsRepository.save({
            postId,
            totalLikes: 0,
            totalShares: 0,
            totalComments: 0,
            totalRatings: 0,
            averageRating: null,
            criteriaRatings: {},
            emotionCounts: {},
        });
    }

    const newComment = await PostCommentRepository.save({
        userId,
        postId,
        comment: comment.trim(),
        isDeleted: false,
    });

    post.commentCount += 1;
    stats.totalComments += 1;

    await Promise.all([
        PostRepository.save(post),
        PostStatisticsRepository.save(stats),
    ]);

    //  Notify post owner
    const postOwnerId = post.userId ?? post.producerId;

    if (postOwnerId && postOwnerId !== userId) {
        const postOwner = await UserRepository.findOneBy({ id: postOwnerId });

        if (postOwner) {
            // Save DB notification
            const notification = await NotificationRepository.save({
                notificationId: PostNotificationCode.POST_COMMENTED,
                receiver: postOwner,
                sender: user,
                title: "New Comment on Your Post",
                body: `${user.fullName} commented: "${comment.trim()}"`,
                type: NotificationTypeEnums.POST_COMMENT,
                purpose: NotificationTypeEnums.POST_COMMENT,
            });

            // Push FCM notification
            if (postOwner.deviceId) {
                const notificationPayload = {
                    notificationId: String(PostNotificationCode.POST_COMMENTED),
                    postId: String(post.id),
                    type: NotificationTypeEnums.POST_COMMENT,
                    senderId: String(userId),
                    createdAt: new Date().toISOString(),
                };

                await sendAdminNotification(
                    postOwner.deviceId,
                    notification.title,
                    notification.body,
                    notificationPayload
                );
            }
        }
    }

    return {
        comment: newComment,
        totalComments: post.commentCount,
    };
};

export const getCommentsByPost = async (postId: number) => {
    const comments = await PostCommentRepository.find({
        where: { postId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
    });

    return comments;
};

export const deleteComment = async (userId: number, commentId: number) => {
    const comment = await PostCommentRepository.findOneBy({ id: commentId, isDeleted: false });
    if (!comment) throw new NotFoundError('Comment not found or already deleted');

    if (comment.userId !== userId) {
        throw new BadRequestError('You can only delete your own comments');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await PostCommentRepository.save(comment);

    const post = await PostRepository.findOneBy({ id: comment.postId, isDeleted: false });
    if (post) {
        post.commentCount = Math.max(0, post.commentCount - 1);
        await PostRepository.save(post);
    }

    return { message: 'Comment deleted successfully', commentId };
};

export const editComment = async (userId: number, commentId: number, newComment: string) => {
    if (!newComment || newComment.trim() === '') {
        throw new BadRequestError('Comment cannot be empty');
    }

    const comment = await PostCommentRepository.findOneBy({ id: commentId, isDeleted: false });
    if (!comment) throw new NotFoundError('Comment not found or already deleted');

    if (comment.userId !== userId) {
        throw new BadRequestError('You can only edit your own comments');
    }

    comment.comment = newComment.trim();
    comment.updatedAt = new Date();
    await PostCommentRepository.save(comment);

    return {
        commentId: comment.id,
        updatedComment: comment.comment,
        updatedAt: comment.updatedAt,
    };
};

export const sharePost = async (userId: number, postId: number) => {
    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    const stats = await PostStatisticsRepository.findOneBy({ postId });

    const alreadyShared = await PostShareRepository.findOne({
        where: { userId, postId, isDeleted: false },
    });

    if (alreadyShared) throw new BadRequestError('You have already shared this post');

    const share = PostShareRepository.save({
        userId,
        postId,
        isDeleted: false,
    });

    post.shareCount += 1;
    if (stats) stats.totalShares += 1;

    await Promise.all([
        PostRepository.save(post),
        stats ? PostStatisticsRepository.save(stats) : null,
    ]);

    return {
        post,
        totalShares: post.shareCount,
    };
};

export const getPostStatistics = async (postId: number) => {
    const stats = await PostStatisticsRepository.findOneBy({ postId });
    if (!stats) {
        throw new NotFoundError('Statistics not found for this post');
    }

    return {
        totalLikes: stats.totalLikes,
        totalShares: stats.totalShares,
        totalComments: stats.totalComments,
        totalRatings: stats.totalRatings,
        averageRating: stats.averageRating,
        emotionCounts: stats.emotionCounts ?? {},
        criteriaRatings: stats.criteriaRatings ?? {},
    };
};

export const toggleFollow = async (userId: number, producerId?: number, followedUserId?: number) => {
    const follower = await UserRepository.findOne({
        where: { id: userId },
        relations: ["role"],
    });

    if (!follower) throw new NotFoundError("Follower user not found");

    if (follower.role.name !== RoleName.USER) {
        throw new BadRequestError("Only users can follow others");
    }

    // FOLLOW / UNFOLLOW PRODUCER
    if (producerId) {
        const producer = await ProducerRepository.findOne({
            where: { id: producerId, isDeleted: false },
        });

        if (!producer) throw new NotFoundError("Producer not found");

        const existing = await FollowRepository.findOneBy({
            followerId: userId,
            producerId,
        });

        if (existing) {
            await AppDataSource.manager.transaction(async (manager: EntityManager) => {
                await manager.delete(FollowRepository.target, existing.id);
                await manager.decrement(User, { id: userId }, "followingCount", 1);

                if (existing.status === FollowStatusEnums.Approved && producer.userId) {
                    await manager.decrement(User, { id: producer.userId }, "followersCount", 1);
                }
            });

            return {
                message:
                    existing.status === FollowStatusEnums.Approved
                        ? "Unfollowed producer successfully"
                        : "Canceled follow request to producer",
                data: null,
            };
        }

        const follow = FollowRepository.create({
            followerId: userId,
            producerId,
            status: FollowStatusEnums.Pending,
        });

        const saved = await AppDataSource.manager.transaction(async (manager: EntityManager) => {
            const savedFollow = await manager.save(follow);
            await manager.increment(User, { id: userId }, "followingCount", 1);
            return savedFollow;
        });

        return {
            message: "Follow request sent to producer (pending)",
            data: saved,
        };
    }

    // FOLLOW / UNFOLLOW USER
    if (followedUserId) {
        if (userId === followedUserId) {
            throw new BadRequestError("You cannot follow yourself");
        }

        const followedUser = await UserRepository.findOneBy({
            id: followedUserId,
            isDeleted: false,
        });

        if (!followedUser) throw new NotFoundError("User not found");

        const existing = await FollowRepository.findOneBy({
            followerId: userId,
            followedUserId,
        });

        // UNFOLLOW / CANCEL REQUEST
        if (existing) {
            await AppDataSource.manager.transaction(async (manager: EntityManager) => {
                await manager.delete(FollowRepository.target, existing.id);
                await manager.decrement(User, { id: userId }, "followingCount", 1);

                if (existing.status === FollowStatusEnums.Approved) {
                    await manager.decrement(User, { id: followedUserId }, "followersCount", 1);

                    // delete reverse follow (symmetrical removal)
                    const reverseFollow = await FollowRepository.findOneBy({
                        followerId: followedUserId,
                        followedUserId: userId,
                    });

                    if (reverseFollow) {
                        await manager.delete(FollowRepository.target, reverseFollow.id);
                        // Adjust follower/following counts symmetrically
                        await manager.decrement(User, { id: followedUserId }, "followingCount", 1);
                        await manager.decrement(User, { id: userId }, "followersCount", 1);
                    }
                }
            });

            return {
                message:
                    existing.status === FollowStatusEnums.Approved
                        ? "Unfollowed user successfully"
                        : "Canceled follow request to user",
                data: null,
            };
        }

        // FOLLOW REQUEST CREATION
        const follow = FollowRepository.create({
            followerId: userId,
            followedUserId,
            status: FollowStatusEnums.Pending,
        });

        const saved = await AppDataSource.manager.transaction(async (manager: EntityManager) => {
            const savedFollow = await manager.save(follow);
            await manager.increment(User, { id: userId }, "followingCount", 1);
            return savedFollow;
        });

        return {
            message: "Follow request sent to user (pending)",
            data: saved,
        };
    }

    throw new BadRequestError("Invalid follow request");
};


export const approvedRequest = async (userId: number, followId: number) => {
    const follow = await FollowRepository.findOne({
        where: { id: followId },
    });

    if (!follow) throw new NotFoundError("Follow request not found");

    if (follow.status === FollowStatusEnums.Approved)
        throw new BadRequestError("Request is already approved");

    // Authorization checks
    if (follow.followedUserId && follow.followedUserId !== userId) {
        throw new BadRequestError("You are not authorized to approve this request");
    }

    if (follow.producerId) {
        const producer = await ProducerRepository.findOneBy({ id: follow.producerId });
        if (!producer || producer.userId !== userId) {
            throw new BadRequestError("You are not authorized to approve this request");
        }
    }

    follow.status = FollowStatusEnums.Approved;

    await AppDataSource.manager.transaction(async (manager: EntityManager) => {
        await manager.save(follow);

        // Increment follower count for approved connections
        if (follow.followedUserId) {
            await manager.increment(User, { id: follow.followedUserId }, "followersCount", 1);
        }

        if (follow.producerId) {
            const producer = await ProducerRepository.findOneBy({ id: follow.producerId });
            if (producer?.userId) {
                await manager.increment(User, { id: producer.userId }, "followersCount", 1);
            }
        }

        // auto-create reverse follow for user↔user friendship
        if (follow.followedUserId && !follow.producerId) {
            const existingReverse = await FollowRepository.findOneBy({
                followerId: follow.followedUserId,
                followedUserId: follow.followerId,
            });

            if (!existingReverse) {
                const reverseFollow = FollowRepository.create({
                    followerId: follow.followedUserId,  // the approver becomes the follower
                    followedUserId: follow.followerId,  // the requester becomes followed
                    status: FollowStatusEnums.Approved,
                });

                await manager.save(reverseFollow);

                // Update counts for mutual relationship
                await manager.increment(User, { id: follow.followerId }, "followersCount", 1);
                await manager.increment(User, { id: follow.followedUserId }, "followingCount", 1);
            }
        }
    });

    return {
        message: "Follow request approved successfully",
        data: follow,
    };
};

export const getFollowingRequest = async (userId: number) => {
    const requests = await FollowRepository.createQueryBuilder('follow')
        .leftJoinAndSelect('follow.follower', 'follower')
        .where(
            `follow.followedUserId = :userId 
       OR follow.producerId IN (
         SELECT p.id FROM "Producers" p WHERE p."userId" = :userId
       )`,
            { userId }
        )
        .andWhere('follow.status = :status', { status: FollowStatusEnums.Pending })
        .getMany();

    return requests;
};

export * as PostService from './post.service';
