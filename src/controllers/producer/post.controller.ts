import { Request, Response, NextFunction } from 'express';
import { createPostSchema, createProducerPostSchema, CreateRatingSchema, EmotionSchema, updatePostSchema } from '../../validators/producer/post.validation';
import { PostService } from '../../services/producer/post.service';
import { sendApiResponse } from '../../utils/sendApiResponse';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { UserRepository } from '../../repositories';

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

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);

        const post = await PostService.getPostById(userId, postId);
        return sendApiResponse(res, 200, 'Post retrieved successfully.', post);
    } catch (error) {
        next(error);
    }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = req.params.id;
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
        return sendApiResponse(res, 200, 'Rating submitted successfully.', result);
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
        const { producerId, followedUserId } = req.body;

        const result = await PostService.toggleFollow(userId, producerId, followedUserId);
        return sendApiResponse(res, 200, result.message, result.data);
    } catch (error) {
        next(error);
    }
};

export * as PostController from './post.controller';