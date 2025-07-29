import { Request, Response, NextFunction } from 'express';
import { createPostSchema, createProducerPostSchema, CreateRatingSchema, EmotionSchema, updatePostSchema } from '../../validators/producer/post.validation';
import { PostService } from '../../services/producer/post.service';
import { sendApiResponse } from '../../utils/sendApiResponse';
import { BadRequestError } from '../../errors/badRequest.error';

export const createUserPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) throw new BadRequestError('User ID is required');

        const parsed = createPostSchema.parse(req.body);

        const result = await PostService.createUserPost(userId, parsed);
        return sendApiResponse(res, 200, 'Post created successfully.', result);
    } catch (error) {
        next(error);
    }
};

export const createProducerPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = (req as any).roleName;

        if (!userId || !roleName) {
            throw new BadRequestError('User ID or role is missing');
        }

        const parsed = createProducerPostSchema.parse(req.body);

        const result = await PostService.createProducerPost(userId, roleName, parsed);
        return sendApiResponse(res, 201, 'Producer post created successfully.', result);
    } catch (error) {
        next(error);
    }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = (req as any).roleName;

        if (!userId || !roleName) {
            throw new BadRequestError('User ID or role is missing');
        }

        const posts = await PostService.getPosts(userId, roleName);
        return sendApiResponse(res, 200, 'Posts retrieved successfully.', posts);
    } catch (error) {
        next(error);
    }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) throw new BadRequestError('User ID is required');

        const postId = Number(req.params.postId);
        if (!postId || isNaN(postId)) throw new BadRequestError('Valid postId is required');

        const post = await PostService.getPostById(userId, postId);
        return sendApiResponse(res, 200, 'Post retrieved successfully.', post);
    } catch (error) {
        next(error);
    }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = Number(req.params.id);
        const parsed = updatePostSchema.safeParse({ ...req.body, postId });
        if (!parsed.success) {
            return res.status(400).json(parsed.error.format());
        }

        const updatedPost = await PostService.updatePost(parsed.data);
        return sendApiResponse(res, 200, 'Post updated successfully', updatedPost);
    } catch (err) {
        next(err);
    }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) throw new BadRequestError('User ID is required');

        const postId = Number(req.params.postId);
        if (!postId || isNaN(postId)) throw new BadRequestError('Valid postId is required');

        const result = await PostService.deletePost(userId, postId);
        return sendApiResponse(res, 200, 'Post deleted successfully.', result);
    } catch (error) {
        next(error);
    }
};

export const saveRatings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) throw new BadRequestError('User ID is required');

        const postId = Number(req.params.postId);
        if (!postId || isNaN(postId)) throw new BadRequestError('Valid postId is required');

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
        if (!userId) throw new BadRequestError('User ID is required');

        const postId = Number(req.params.postId);
        if (!postId || isNaN(postId)) throw new BadRequestError('Valid postId is required');

        const parsed = EmotionSchema.parse(req.body);

        const result = await PostService.saveEmotions(userId, postId, parsed);

        return sendApiResponse(res, 201, 'Emotion saved.', result);
    } catch (err) {
        next(err);
    }
};

export const updatePostEmotions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) throw new BadRequestError('User ID is required');

        const postId = Number(req.params.postId);
        if (isNaN(postId)) throw new BadRequestError('Valid postId is required');

        const parsed = EmotionSchema.parse(req.body);

        const result = await PostService.updatePostEmotions(userId, postId, parsed);

        return sendApiResponse(res, 200, 'Emotion updated successfully.', result);
    } catch (err) {
        next(err);
    }
};

export const togglePostLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const postId = Number(req.params.postId);
        if (!userId || !postId) throw new BadRequestError('Missing userId or postId');

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

        if (!userId || !postId || !comment) {
            throw new BadRequestError('userId, postId, and comment are required');
        }

        const result = await PostService.addCommentToPost(userId, postId, comment);
        return sendApiResponse(res, 200, 'Comment added successfully', result);
    } catch (err) {
        next(err);
    }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = Number(req.params.postId);
        if (isNaN(postId)) {
            throw new BadRequestError('Invalid post ID');
        }

        const comments = await PostService.getComments(postId);
        return sendApiResponse(res, 200, 'Comments retrieved successfully', comments);
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const commentId = Number(req.params.commentId);

        if (!userId || !commentId) throw new BadRequestError('userId and commentId are required');

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

        if (!userId || !commentId || !comment) {
            throw new BadRequestError('userId, commentId, and comment are required');
        }

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

        if (!userId || !postId) throw new BadRequestError('userId and postId are required');

        const result = await PostService.sharePost(userId, postId);
        return sendApiResponse(res, 200, 'Post shared successfully', result);
    } catch (err) {
        next(err);
    }
};

export const getPostStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = Number(req.params.postId);
        if (isNaN(postId)) {
            throw new BadRequestError('Invalid post ID');
        }

        const stats = await PostService.getPostStatistics(postId);

        return sendApiResponse(res, 200, 'Statistics retrieved successfully.', {
            postId,
            stats,
        });
    } catch (error) {
        next(error);
    }
};


export * as PostController from './post.controller';