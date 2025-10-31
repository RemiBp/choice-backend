import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../../errors/badRequest.error";
import { CopilotAgentService } from "../../services/app/copilot.service";

export const handleQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.body;
        const userId = Number(req.userId);

        if (!query) throw new BadRequestError("Query text is required");

        const result = await CopilotAgentService.handle(userId, undefined, query);

        return res.status(200).json({
            success: true,
            query,
            result,
        });
    } catch (error) {
        next(error);
    }
};

export * as CopilotController from "./copilot.controller";
