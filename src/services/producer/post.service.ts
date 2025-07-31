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
} from '../../repositories';
import { CreateEmotionInput, CreatePostInput, CreateProducerPostInput, CreateRatingInput, EmotionSchema } from '../../validators/producer/post.validation';
import { EmotionType } from '../../enums/post.enum';
import z from 'zod';

export const createUserPost = async (userId: number, data: CreatePostInput) => {

    // const producer = await ProducerRepository.findOneBy({ userId });
    // if (!producer) throw new NotFoundError('Producer not found for this user');

    if (data.imageUrls && data.imageUrls.length > 5) {
        throw new BadRequestError('You can upload a maximum of 5 images');
    }

    if (data.coverImage && !data.imageUrls?.includes(data.coverImage)) {
        throw new BadRequestError('Cover image must be one of the uploaded images');
    }

    const post = PostRepository.save({
        ...data,
        // producer,
        userId,
        tags: data.tags ?? [],
        isDeleted: false,
        likesCount: 0,
        commentCount: 0,
        shareCount: 0,
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

    return {
        post: post,
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

    const post = PostRepository.save({
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

    return {
        post: post,
    };
};

export const getPosts = async (userId: number, roleName: string) => {
    let whereCondition: any = { isDeleted: false };

    if (roleName === 'user') {
        whereCondition.userId = userId || null;
    } else if (['restaurant', 'leisure', 'wellness'].includes(roleName)) {
        whereCondition.type = roleName;
    } else {
        throw new Error(`Unsupported role: ${roleName}`);
    }

    const posts = await PostRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' },
        relations: ['images', 'producer'],
    });

    return posts.map((post: { images: any[]; }) => ({
        ...post,
        images: post.images.map((img) => img.url),
    }));
};

export const getPostById = async (userId: number, postId: number) => {
    const post = await PostRepository.findOne({
        where: { id: postId, userId, isDeleted: false },
        relations: ['images', 'producer'],
    });

    if (!post) throw new NotFoundError('Post not found or already deleted');

    return {
        ...post,
        images: post.images.map((img: { url: any; }) => img.url),
    };
};

export const updatePost = async (data: any) => {
    const { postId, ...updates } = data;

    const post = await PostRepository.findOneBy({ id: postId });
    if (!post) throw new NotFoundError('Post not found');

    Object.assign(post, updates);

    return await PostRepository.save(post);
};

export const deletePost = async (userId: number, postId: number) => {
    const post = await PostRepository.findOneBy({ id: postId, userId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    post.isDeleted = true;
    post.deletedAt = new Date();

    await PostRepository.save(post);

    return { post: post };
};

export const saveRatings = async (userId: number, postId: number, data: Omit<CreateRatingInput, 'postId'>) => {
    const { ratings, comment = '' } = data;

    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    const existingRatings = await PostRatingRepository.find({
        where: { userId, postId },
    });

    const existingCriteria = new Set(existingRatings.map((r: { criteria: any; }) => r.criteria));
    const duplicates = Object.keys(ratings).filter((c) => existingCriteria.has(c));
    if (duplicates.length) {
        throw new BadRequestError(`You have already rated: ${duplicates.join(', ')}`);
    }

    for (const value of Object.values(ratings)) {
        if (typeof value !== 'number' || value < 0 || value > 5) {
            throw new BadRequestError('Ratings must be numbers between 0 and 5');
        }
    }

    const ratingEntities = Object.entries(ratings).map(([criteria, value]) =>
        PostRatingRepository.save({
            userId,
            postId,
            criteria,
            rating: value,
            comment,
        })
    );

    return {
        postId,
        count: ratingEntities.length,
    };
};

export const saveEmotions = async (userId: number, postId: number, data: z.infer<typeof EmotionSchema>) => {
    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or already deleted');

    const savedEmotions = [];

    for (const emotion of data.emotions) {
        const existing = await PostEmotionRepository.findOneBy({ userId, postId, emotion });

        if (!existing) {
            const newEmotion = PostEmotionRepository.create({ userId, postId, emotion });
            await PostEmotionRepository.save(newEmotion);
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
    const post = await PostRepository.findOneBy({ id: postId, isDeleted: false });
    if (!post) throw new NotFoundError('Post not found or has been deleted');

    let like = await PostLikeRepository.findOne({
        where: { userId, postId },
        withDeleted: true,
    });

    let stats = await PostStatisticsRepository.findOneBy({ postId });

    if (!stats) {
        stats = PostStatisticsRepository.create({
            postId,
            totalLikes: 0,
            totalShares: 0,
            totalComments: 0,
            totalRatings: 0,
            averageRating: null,
            criteriaRatings: {},
            emotionCounts: {},
        });

        stats = await PostStatisticsRepository.save(stats);
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
        like = PostLikeRepository.create({
            userId,
            postId,
            isDeleted: false,
        });
        await PostLikeRepository.save(like);
    }

    post.likesCount += 1;
    stats.totalLikes += 1;

    await PostRepository.save(post);
    await PostStatisticsRepository.save(stats);

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

export const getComments = async (postId: number) => {
    const comments = await PostCommentRepository.find({
        where: { postId, isDeleted: false },
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
    if (!comment) {
        throw new NotFoundError('Comment not found or already deleted');
    }

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

export * as PostService from './post.service';
