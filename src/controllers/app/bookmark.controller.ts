import { NextFunction, Request, Response } from "express";
import { BookmarkService } from "../../services/app/bookmark.service";
import { sendApiResponse } from "../../utils/sendApiResponse";
import { toggleBookmarkSchema } from "../../validators/app/bookmark.validator";

export const toggleBookmark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { body } = toggleBookmarkSchema.parse({ body: req.body });
        const userId = req.userId;

        const result = await BookmarkService.toggleBookmark(userId, body);
        sendApiResponse(res, 200, "Bookmark toggled successfully", result);
    } catch (error) {
        next(error);
    }
};

export const getBookmarkedPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const posts = await BookmarkService.getBookmarkedPosts(userId);
        sendApiResponse(res, 200, "Bookmarked posts fetched successfully", posts);
    } catch (error) {
        next(error);
    }
};

export const getBookmarkedProducers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const producers = await BookmarkService.getBookmarkedProducers(userId);
        sendApiResponse(res, 200, "Bookmarked producers fetched successfully", producers);
    } catch (error) {
        next(error);
    }
};

export * as BookmarkController from "./bookmark.controller";
