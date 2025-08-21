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
    ServiceRatingCriteriaRepository,
    TagRepository,
} from '../../repositories';
import { CreateEmotionInput, CreatePostInput, CreateProducerPostInput, CreateRatingInput, EmotionSchema } from '../../validators/producer/post.validation';
import AppDataSource from '../../data-source';
import z from 'zod';
import Follow from '../../models/Follow';
import User from '../../models/User';
import { BusinessRole, RoleName } from '../../enums/Producer.enum';
import { sendAdminNotification } from '../../utils/sendAdminNotification';
import { NotificationTypeEnums, PostNotificationCode } from '../../enums/post-notification.enum';
import { FollowStatusEnums } from '../../enums/followStatus.enum';
import { LeisureRatingCriteria, RestaurantRatingCriteria, WellnessRatingCriteria } from '../../enums/rating.enum';
import { EntityManager, ILike } from 'typeorm';
import ServiceRating from '../../models/ServiceRatings';
import ServiceRatingCriteria from '../../models/WellnessServiceTypes';
import ProducerService from '../../models/Services';
import WellnessServiceType from '../../models/WellnessServiceTypes';

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

    return {
        results: producers.map((p: { id: any; placeId: any; name: any; address: any; city: any; country: any; }) => ({
            id: p.id,
            name: p.name,
            address: p.address,
            city: p.city,
            country: p.country,
        })),
    };
};

export const createUserPost = async (userId: number, data: CreatePostInput) => {

    if (data.imageUrls && data.imageUrls.length > 5) {
        throw new BadRequestError("You can upload a maximum of 5 images");
    }

    if (data.coverImage && !data.imageUrls?.includes(data.coverImage)) {
        throw new BadRequestError("Cover image must be one of the uploaded images");
    }

    const producer = await ProducerRepository.findOne({
        where: { placeId: data.placeId, isDeleted: false, isActive: true },
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

    return {
        message: "Post created successfully",
        post,
    };
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

export const getPosts = async (userId: number, roleName: string) => {
    if (roleName !== 'user') {
        throw new Error('Only user role can fetch followed feed');
    }

    const posts = await PostRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.images', 'images')
        .leftJoinAndSelect('post.producer', 'producer')
        .innerJoin(
            Follow,
            'follow',
            `"follow"."followerId" = :userId AND (
    "post"."userId" = "follow"."followedUserId" OR
    "post"."producerId" = "follow"."producerId"
  )`,
            { userId }
        )
        .where('post.isDeleted = false')
        .orderBy('post.createdAt', 'DESC')
        .getMany();

    return posts;
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

    let repo: any, globalRepo: any, allowedFields: string[], extraField: Record<string, number> = {};

    switch (type) {
        case BusinessRole.RESTAURANT:
            repo = RestaurantPostRatingRepository;
            globalRepo = RestaurantRatingRepository;
            allowedFields = Object.values(RestaurantRatingCriteria) as string[];
            extraField = { restaurantId: post.producer.id };
            break;

        case BusinessRole.LEISURE:
            repo = LeisurePostRatingRepository;
            globalRepo = LeisureRepository;
            allowedFields = Object.values(LeisureRatingCriteria) as string[];
            extraField = { leisureId: post.producer.id };
            break;

        case BusinessRole.WELLNESS:
            repo = WellnessPostRatingRepository;
            globalRepo = WellnessRepository;
            allowedFields = Object.values(WellnessRatingCriteria) as string[];
            extraField = { wellnessId: post.producer.id };
            break;

        default:
            throw new BadRequestError("Invalid post type");
    }

    // ✅ Validate criteria keys
    const invalidKeys = Object.keys(ratings).filter(
        (key) => !allowedFields.includes(key)
    );
    if (invalidKeys.length > 0) {
        throw new BadRequestError(
            `Invalid rating criteria for ${type}. Not allowed: ${invalidKeys.join(", ")}`
        );
    }

    // ✅ Save or update rating
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

    // ✅ Update global after saving
    await updateGlobalRating(type, postId, post.producer.id, globalRepo, savedRating);

    return {
        postId,
        savedRating,
        message: "Rating submitted successfully",
    };
};

async function updateGlobalRating(
    type: BusinessRole,
    postId: number,
    producerId: number,
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

    let ratings = await postRepo.find({ where: { postId } });

    // 👇 Ensure freshly saved rating is included
    if (newRating && !ratings.find((r: { id: any; }) => r.id === newRating.id)) {
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

    // ✅ Update correct global table
    await globalRepo
        .createQueryBuilder()
        .update()
        .set({
            ...averages,
            overall,
        })
        .where("id = :id", { id: producerId })
        .execute();
}

export const createServiceRatings = async (input: {
    userId: number;
    postId: number;
    ratings: { serviceTypeId: number; ratings: Record<string, number> }[];
}) => {
    const { userId, postId, ratings } = input;

    await AppDataSource.transaction(async (manager: EntityManager) => {
        for (const r of ratings) {
            const serviceType = await manager.getRepository(WellnessServiceType).findOne({
                where: { id: r.serviceTypeId },
            });

            if (!serviceType) {
                throw new NotFoundError(`ServiceType ${r.serviceTypeId} not found`);
            }

            await manager.getRepository(ServiceRating).save({
                userId,
                postId,
                serviceTypeId: r.serviceTypeId,
                ratings: r.ratings,
            });
        }
    });

    return { message: "Service ratings added successfully." };
};

export const createEventRatings = async (input: {
    userId: number;
    postId: number;
    eventId: number;
    ratings: { criteria: string; rating: number }[];
}) => {
    const { userId, postId, eventId, ratings } = input;

    const event = await EventRepository.findOne({
        where: { id: eventId, isDeleted: false },
        relations: ["eventType"],
    });
    if (!event) {
        throw new NotFoundError("Event not found or already deleted");
    }

    const post = await PostRepository.findOne({
        where: { id: postId, isDeleted: false },
    });
    if (!post) {
        throw new NotFoundError("Post not found or already deleted");
    }

    if (!event.eventType) {
        throw new BadRequestError("Event type not configured for this event");
    }
    const allowedCriteria = new Set(event.eventType.criteria);

    const invalidCriteria = ratings
        .map(r => r.criteria)
        .filter(c => !allowedCriteria.has(c));

    if (invalidCriteria.length > 0) {
        throw new BadRequestError(`Invalid criteria: ${invalidCriteria.join(", ")}`);
    }

    const existingRatings = await EventRatingRepository.find({
        where: { userId, postId, eventId },
    });
    const existingCriteria = new Set(existingRatings.map((r: { criteria: any; }) => r.criteria));

    const newRatings = ratings.filter(r => !existingCriteria.has(r.criteria));
    if (newRatings.length === 0) {
        throw new BadRequestError("You already rated this event with given criteria");
    }

    const ratingEntities = EventRatingRepository.create(
        newRatings.map(r => ({
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
        allRatings.reduce((sum: number, r: { rating: any; }) => sum + Number(r.rating), 0) / allRatings.length;

    post.overallAvgRating = avg;
    await PostRepository.save(post);

    return {
        message: "Event ratings added successfully.",
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
        stats = PostStatisticsRepository.save({
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
        like = PostLikeRepository.save({
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
            const notification = NotificationRepository.save({
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

export const addCommentToPost = async (userId: number, postId: number, comment: string) => {
    if (!comment || comment.trim() === '') {
        throw new BadRequestError('Comment cannot be empty');
    }

    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    const stats = await PostStatisticsRepository.findOneBy({ postId });

    const newComment = PostCommentRepository.save({
        userId,
        postId,
        comment: comment.trim(),
        isDeleted: false,
    });

    post.commentCount += 1;
    if (stats) stats.totalComments += 1;

    await Promise.all([
        PostRepository.save(post),
        stats ? PostStatisticsRepository.save(stats) : null,
    ]);

    return {
        commentId: newComment,
        totalComments: post.commentCount,
    };
};

export const getCommentsByPost = async (postId: number) => {
    const comments = await PostCommentRepository.find({
        where: { postId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
    });

    return comments.map((comment: { id: any; userId: any; postId: any; comment: any; createdAt: any; updatedAt: any; user: { id: any; name: any; profilePictureUrl: any; }; }) => ({
        id: comment.id,
        userId: comment.userId,
        postId: comment.postId,
        comment: comment.comment,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
    }));
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
        relations: ['role'],
    });

    if (!follower) throw new NotFoundError('Follower user not found');

    if (follower.role.name !== RoleName.USER) {
        throw new BadRequestError('Only users can follow others');
    }

    if (producerId) {
        const producer = await ProducerRepository.findOne({
            where: { id: producerId, isDeleted: false },
        });

        if (!producer) throw new NotFoundError('Producer not found');

        const existing = await FollowRepository.findOneBy({
            followerId: userId,
            producerId,
        });

        if (existing) {
            await AppDataSource.manager.transaction(async (manager: { delete: (arg0: any, arg1: any) => any; decrement: (arg0: typeof User, arg1: { id: any; }, arg2: string, arg3: number) => any; }) => {
                await manager.delete(FollowRepository.target, existing.id);
                await manager.decrement(User, { id: userId }, 'followingCount', 1);

                if (existing.status === FollowStatusEnums.Approved && producer.userId) {
                    await manager.decrement(User, { id: producer.userId }, 'followersCount', 1);
                }
            });

            return {
                message:
                    existing.status === FollowStatusEnums.Approved
                        ? 'Unfollowed producer successfully'
                        : 'Canceled follow request to producer',
                data: null,
            };
        }
        const follow = FollowRepository.create({
            followerId: userId,
            producerId,
            status: FollowStatusEnums.Pending,
        });

        const saved = await AppDataSource.manager.transaction(async (manager: { save: (arg0: any) => any; increment: (arg0: typeof User, arg1: { id: number; }, arg2: string, arg3: number) => any; }) => {
            const savedFollow = await manager.save(follow);
            await manager.increment(User, { id: userId }, 'followingCount', 1);
            return savedFollow;
        });

        return {
            message: 'Follow request sent to producer (pending)',
            data: saved,
        };
    }
    if (followedUserId) {
        if (userId === followedUserId) {
            throw new BadRequestError('You cannot follow yourself');
        }

        const followedUser = await UserRepository.findOneBy({
            id: followedUserId,
            isDeleted: false,
        });

        if (!followedUser) throw new NotFoundError('User not found');

        const existing = await FollowRepository.findOneBy({
            followerId: userId,
            followedUserId,
        });

        if (existing) {
            await AppDataSource.manager.transaction(async (manager: { delete: (arg0: any, arg1: any) => any; decrement: (arg0: typeof User, arg1: { id: number; }, arg2: string, arg3: number) => any; }) => {
                await manager.delete(FollowRepository.target, existing.id);
                await manager.decrement(User, { id: userId }, 'followingCount', 1);

                if (existing.status === FollowStatusEnums.Approved) {
                    await manager.decrement(User, { id: followedUserId }, 'followersCount', 1);
                }
            });

            return {
                message:
                    existing.status === FollowStatusEnums.Approved
                        ? 'Unfollowed user successfully'
                        : 'Canceled follow request to user',
                data: null,
            };
        }

        const follow = FollowRepository.create({
            followerId: userId,
            followedUserId,
            status: FollowStatusEnums.Pending,
        });

        const saved = await AppDataSource.manager.transaction(async (manager: { save: (arg0: any) => any; increment: (arg0: typeof User, arg1: { id: number; }, arg2: string, arg3: number) => any; }) => {
            const savedFollow = await manager.save(follow);
            await manager.increment(User, { id: userId }, 'followingCount', 1);
            return savedFollow;
        });

        return {
            message: 'Follow request sent to user (pending)',
            data: saved,
        };
    }

    throw new BadRequestError('Invalid follow request');
};


export const approvedRequest = async (userId: number, followId: number) => {
    const follow = await FollowRepository.findOne({
        where: { id: followId },
    });

    if (!follow) {
        throw new NotFoundError('Follow request not found');
    }

    if (follow.status === FollowStatusEnums.Approved) {
        throw new BadRequestError('Request is already approved');
    }

    if (follow.followedUserId && follow.followedUserId !== userId) {
        throw new BadRequestError('You are not authorized to approve this request');
    }

    if (follow.producerId) {
        const producer = await ProducerRepository.findOneBy({ id: follow.producerId });
        if (!producer || producer.userId !== userId) {
            throw new BadRequestError('You are not authorized to approve this request');
        }
    }

    follow.status = FollowStatusEnums.Approved;

    await AppDataSource.manager.transaction(async (manager: { save: (arg0: any) => any; increment: (arg0: typeof User, arg1: { id: any; }, arg2: string, arg3: number) => any; }) => {
        await manager.save(follow);

        if (follow.followedUserId) {
            await manager.increment(User, { id: follow.followedUserId }, 'followersCount', 1);
        }

        if (follow.producerId) {
            const producer = await ProducerRepository.findOneBy({ id: follow.producerId });
            if (producer?.userId) {
                await manager.increment(User, { id: producer.userId }, 'followersCount', 1);
            }
        }
    });

    return {
        message: 'Follow request approved successfully',
        data: follow,
    };
};

export * as PostService from './post.service';
