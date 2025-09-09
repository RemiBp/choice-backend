import { Request, Response, NextFunction } from "express";
import { CreateBlockSchema } from "../../validators/producer/block.validation";
import { BlockService } from "../../services/producer/block.service";
import { sendApiResponse } from "../../utils/sendApiResponse";

export const createBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const validated = CreateBlockSchema.parse(req.body);
        const block = await BlockService.createBlock(userId, validated);
        return sendApiResponse(res, 200, "User blocked successfully", block);
    } catch (err) {
        next(err);
    }
};

export const getMyBlocks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const blocks = await BlockService.getMyBlocks(userId);
        return sendApiResponse(res, 200, "blocklist fetch successfully", blocks);
    } catch (err) {
        next(err);
    }
};

export const unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const blockId = Number(req.params.blockId);
        const result = await BlockService.unblockUser(blockId, userId);
        return sendApiResponse(res, 200, "UnBlock user successfully", result);
    } catch (err) {
        next(err);
    }
};

export * as BlockController from './block.controller';
