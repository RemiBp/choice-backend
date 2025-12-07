import { Request, Response, NextFunction } from "express";
import { OwnerType } from "../../enums/OwnerType.enum";
import { RevenueCatSubscriptionSchema } from "../../validators/app/subscription.validation";
import { fromZodError } from "zod-validation-error";
import { BadRequestError } from "../../errors/badRequest.error";
import { SubscriptionService } from "../../services/app/subscription.service";

export const status = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ownerType = req.roleName === "producer" ? OwnerType.PRODUCER : OwnerType.USER;
        const subscription = await SubscriptionService.getActiveSubscription(req.userId, ownerType);

        return res.status(200).json({
            success: true,
            message: "Subscription status fetched successfully",
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

export const verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = RevenueCatSubscriptionSchema.safeParse(req.body);
        if (!parsed.success) throw new BadRequestError(fromZodError(parsed.error).message);

        const ownerType = req.roleName === "producer" ? OwnerType.PRODUCER : OwnerType.USER;
        const subscription = await SubscriptionService.syncRevenueCatSubscription(req.userId, {
            ...parsed.data,
            ownerType,
        });

        return res.status(200).json({
            success: true,
            message: "Subscription verified and synced successfully",
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ownerType = req.roleName === "producer" ? OwnerType.PRODUCER : OwnerType.USER;
        const canceled = await SubscriptionService.cancelSubscription(req.userId, ownerType);

        return res.status(200).json({
            success: true,
            message: "Subscription canceled successfully",
            data: canceled,
        });
    } catch (error) {
        next(error);
    }
};

export const transactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ownerType = req.roleName === "producer" ? OwnerType.PRODUCER : OwnerType.USER;
        const transactions = await SubscriptionService.getMyTransactions(req.userId, ownerType);

        return res.status(200).json({
            success: true,
            message: "Transaction history fetched successfully",
            data: transactions,
        });
    } catch (error) {
        next(error);
    }
};

export * as SubscriptionController from "./subscription.controller";
