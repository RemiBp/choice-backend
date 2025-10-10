import { Request, Response, NextFunction } from "express";
import { AcceptInterestInviteSchema, CreateInterestSchema, DeclineInterestInviteSchema, EditSlotSchema, ReserveInterestSchema, SuggestNewTimeSchema } from "../../validators/app/interest.validation";
import { InterestService } from "../../services/app/interest.service";
import { sendApiResponse } from "../../utils/sendApiResponse";

export const createInterest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const validatedObject = CreateInterestSchema.parse(req.body);
        const response = await InterestService.createInterest(userId, validatedObject);
        sendApiResponse(res, 201, "Interest created successfully", response);
    } catch (error) {
        next(error);
    }
};

export const getProducerSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const producerId = Number(req.params.producerId);
        const response = await InterestService.getProducerSlots(producerId);
        sendApiResponse(res, 200, "Producer slots fetched successfully", response);
    } catch (error) {
        next(error);
    }
};

export const getInvited = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const data = await InterestService.getInvited(userId);

        return sendApiResponse(res, 200, "Invited interests fetched successfully", data);
    } catch (error) {
        next(error);
    }
};

export const invitedDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const interestId = Number(req.params.id);
        const userId = Number(req.userId);

        const data = await InterestService.invitedDetails(userId, interestId);

        return sendApiResponse(res, 200, "Interest details fetched successfully", data);
    } catch (error) {
        next(error);
    }
};

export const acceptInterestInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const data = AcceptInterestInviteSchema.parse(req.body);

        const result = await InterestService.acceptInterestInvite(userId, data);
        return sendApiResponse(res, 200, "Interest invite accepted successfully", result);
    } catch (error) {
        next(error);
    }
};

export const declineInterestInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const data = DeclineInterestInviteSchema.parse(req.body);

        const result = await InterestService.declineInterestInvite(userId, data);
        return sendApiResponse(res, 200, "Interest invite declined successfully", result);
    } catch (error) {
        next(error);
    }
};

export const suggestNewTime = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const data = SuggestNewTimeSchema.parse(req.body);

        const result = await InterestService.suggestNewTime(userId, data);
        return sendApiResponse(res, 200, "New time suggested successfully", result);
    } catch (error) {
        next(error);
    }
};

export const getUserInterests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const response = await InterestService.getUserInterests(userId);
        sendApiResponse(res, 200, "User interests fetched successfully", response);
    } catch (error) {
        next(error);
    }
};

export const getInterestDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const interestId = Number(req.params.interestId);
        const response = await InterestService.getInterestDetails(userId, interestId);
        sendApiResponse(res, 200, "Interest details fetched successfully", response);
    } catch (error) {
        next(error);
    }
};

export const respondToInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const { interestId, response: inviteResponse } = req.body;
        const response = await InterestService.respondToInvite(userId, interestId, inviteResponse);
        sendApiResponse(res, 200, "Invite response recorded successfully", response);
    } catch (error) {
        next(error);
    }
};

export const editInterestSlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const parsed = EditSlotSchema.parse(req.body);

        const data = await InterestService.editInterestSlot(userId, parsed);

        return sendApiResponse(res, 200, "New slot suggested successfully", data);
    } catch (error) {
        next(error);
    }
};

export const reserveInterest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const parsedData = ReserveInterestSchema.parse(req.body);

        const data = await InterestService.reserveInterest(userId, parsedData);
        return sendApiResponse(res, 200, "Interest reserved successfully", data);
    } catch (error) {
        next(error);
    }
};

export * as InterestController from "./interest.controller";
