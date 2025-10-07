import { Request, Response, NextFunction } from "express";
import { CreateInterestSchema } from "../../validators/app/interest.validation";
import { InterestService } from "../../services/app/interest.service";
import { sendApiResponse } from "../../utils/sendApiResponse";

export const createInterest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedObject = CreateInterestSchema.parse(req.body);
        const userId = Number(req.userId);
        const response = await InterestService.createInterest(userId, validatedObject);
        sendApiResponse(res, 201, "Interest created successfully", response);
    } catch (error) {
        next(error);
    }
};

export * as InterestController from "./interest.controller";
