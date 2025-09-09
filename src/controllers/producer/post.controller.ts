import { Request, Response, NextFunction } from 'express';
import { createDishRatingsSchema, CreateEventRatingsSchema, createPostSchema, createProducerPostSchema, CreateRatingSchema, CreateServiceRatingsSchema, EmotionSchema, toggleFollowSchema, updatePostSchema } from '../../validators/producer/post.validation';
import { PostService } from '../../services/producer/post.service';
import { sendApiResponse } from '../../utils/sendApiResponse';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { UserRepository } from '../../repositories';

export const getProducerPlaces = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query, type } = req.query;

        if (!query || !type) {
            return res.status(400).json({ message: "Query and type are required" });
        }

        const results = await PostService.searchProducers(query.toString(), type.toString());
        return sendApiResponse(res, 200, 'places fetched successfully.', results);
    } catch (error) {
        next(error);
    }
};


export const createUserPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const parsed = createPostSchema.parse({ ...req.body, userId });

        const result = await PostService.createUserPost(userId, parsed);
        return sendApiResponse(res, 200, 'Post created successfully.', result);
    } catch (error) {
        next(error);
    }
};

export const createProducerPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;

        const parsed = createProducerPostSchema.parse({ ...req.body, userId, roleName });
        const result = await PostService.createProducerPost(userId, roleName, parsed);
        return sendApiResponse(res, 200, 'Producer post created successfully.', result);
    } catch (error) {
        next(error);
    }
};

export const getPostsByProducer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;

        const posts = await PostService.getPostsByProducer(userId, roleName);
        return sendApiResponse(res, 200, 'Posts by producer retrieved successfully.', posts);
    } catch (error) {
        next(error);
    }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;

        const posts = await PostService.getPosts(userId, roleName);
        return sendApiResponse(res, 200, 'Posts retrieved successfully.', posts);
    } catch (error) {
        next(error);
    }
};

export const getUserPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);

        const post = await PostService.getUserPostById(userId, postId);
        return sendApiResponse(res, 200, 'Post retrieved successfully.', post);
    } catch (error) {
        next(error);
    }
};

export const getProducerPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);

        const post = await PostService.getProducerPostById(userId, postId);
        return sendApiResponse(res, 200, 'Post retrieved successfully.', post);
    } catch (error) {
        next(error);
    }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = Number(req.params.id);
        const userId = req.userId;

        const parsed = updatePostSchema.safeParse({ ...req.body, postId });
        const updatedPost = await PostService.updatePost(userId, parsed.data);
        return sendApiResponse(res, 200, 'Post updated successfully', updatedPost);
    } catch (err) {
        next(err);
    }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);

        const result = await PostService.deletePost(userId, postId);
        return sendApiResponse(res, 200, 'Post deleted successfully.', result);
    } catch (error) {
        next(error);
    }
};

export const saveRatings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);

        const parsed = CreateRatingSchema.parse(req.body);

        const result = await PostService.saveRatings(userId, postId, parsed);

        return sendApiResponse(res, 200, "Rating submitted successfully.", result);
    } catch (err) {
        next(err);
    }
};

export const createServiceRatings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const validated = CreateServiceRatingsSchema.parse(req.body);

        const result = await PostService.createServiceRatings({
            userId,
            postId: validated.postId,
            serviceTypeId: validated.serviceTypeId,
            ratings: validated.ratings,
        });

        return sendApiResponse(res, 201, "Services ratings saved successfully", result);
    } catch (err) {
        next(err);
    }
};

export const createDishRatings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const validatedData = createDishRatingsSchema.parse(req.body);

        const result = await PostService.createDishRatings(userId, validatedData);

        return sendApiResponse(res, 201, "Dish ratings saved successfully", result);
    } catch (error) {
        next(error);
    }
};

export const getDishRatings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dishId = Number(req.params.dishId);
        const result = await PostService.getDishRatings(dishId);
        return sendApiResponse(res, 200, "Dish ratings fetched successfully", result);
    } catch (error) {
        next(error);
    }
};

export const createEventRatings = async (req: Request,res: Response,next: NextFunction) => {
    try {
        const userId = req.userId;
        const validated = CreateEventRatingsSchema.parse(req.body);

        const result = await PostService.createEventRatings({
            userId,
            ...validated,
        });
        return sendApiResponse(res, 200, "Events ratings fetched successfully", result);
    } catch (err) {
        next(err);
    }
};

export const saveEmotions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);

        const parsed = EmotionSchema.parse(req.body);
        const result = await PostService.saveEmotions(userId, postId, parsed);

        const statusCode = result.savedEmotions.length ? 201 : 200;
        return sendApiResponse(res, statusCode, result.message, {
            postId: result.postId,
            savedEmotions: result.savedEmotions,
        });
    } catch (err) {
        next(err);
    }
};

export const updatePostEmotions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);
        const parsed = EmotionSchema.parse(req.body);

        const result = await PostService.updatePostEmotions(userId, postId, parsed);

        return sendApiResponse(res, 201, 'Emotions updated.', result);
    } catch (error) {
        next(error);
    }
};

export const togglePostLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);

        const result = await PostService.togglePostLike(userId, postId);
        return sendApiResponse(res, 200, result.liked ? 'Post liked' : 'Post unliked', result);
    } catch (err) {
        next(err);
    }
};

export const addCommentToPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);
        const { comment } = req.body;

        const result = await PostService.addCommentToPost(userId, postId, comment);
        return sendApiResponse(res, 200, 'Comment added successfully', result);
    } catch (err) {
        next(err);
    }
};

export const getCommentsByPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = Number(req.params.postId);

        const comments = await PostService.getCommentsByPost(postId);
        return sendApiResponse(res, 200, 'Comments retrieved successfully', comments);
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const commentId = Number(req.params.commentId);

        const result = await PostService.deleteComment(userId, commentId);
        return sendApiResponse(res, 200, 'Comment deleted successfully', result);
    } catch (err) {
        next(err);
    }
};

export const editComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const commentId = Number(req.params.commentId);
        const { comment } = req.body;

        const result = await PostService.editComment(userId, commentId, comment);
        return sendApiResponse(res, 200, 'Comment edited successfully', result);
    } catch (err) {
        next(err);
    }
};

export const sharePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);

        const user = await UserRepository.findOne({
            where: { id: userId, isDeleted: false },
            relations: ['role'],
        });

        if (!user) throw new NotFoundError('User not found');
        if (user.role.name !== 'user') {
            throw new BadRequestError('Only users can share posts');
        }

        const result = await PostService.sharePost(userId, postId);
        return sendApiResponse(res, 200, 'Post shared successfully', result);
    } catch (err) {
        next(err);
    }
};

export const getPostStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = Number(req.params.postId);

        const stats = await PostService.getPostStatistics(postId);
        return sendApiResponse(res, 200, 'Statistics retrieved successfully.', {
            postId,
            stats,
        });
    } catch (error) {
        next(error);
    }
};

export const toggleFollowProducer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;

        const parsed = toggleFollowSchema.parse(req.body);
        const result = await PostService.toggleFollow(userId, parsed.producerId, parsed.followedUserId);
        return sendApiResponse(res, 200, result.message, result.data);
    } catch (error) {
        next(error);
    }
};

export const approvedRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const followId = Number(req.params.followId);

        const result = await PostService.approvedRequest(userId, followId);
        return sendApiResponse(res, 200, result.message, result.data);
    } catch (error) {
        next(error);
    }
};

export const getFollowingRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const result = await PostService.getFollowingRequest(userId);
        return sendApiResponse(res, 200, 'Following requests retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

export * as PostController from './post.controller';