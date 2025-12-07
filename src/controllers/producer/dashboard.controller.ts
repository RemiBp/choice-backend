// controllers/producer/dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../../services/producer/dashboard.service";
import { getOverviewSchema, getUserInsightsSchema, getTrendsSchema, getRatingsSchema, getFeedbackSchema, getBenchmarkSchema } from "../../validators/producer/dashboard.validation";
import { sendApiResponse } from "../../utils/sendApiResponse";

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;
        const parsed = getOverviewSchema.parse({ ...req.query, userId, roleName });
        const data = await DashboardService.getOverview(parsed);
        return sendApiResponse(res, 200, "Dashboard overview fetched successfully.", data);
    } catch (error) {
        next(error);
    }
};

export const getUserInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;
        const parsed = getUserInsightsSchema.parse({ ...req.query, userId, roleName });
        const data = await DashboardService.getUserInsights(parsed);
        return sendApiResponse(res, 200, "User insights fetched successfully.", data);
    } catch (error) {
        next(error);
    }
};

export const getTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;
        const parsed = getTrendsSchema.parse({ ...req.query, userId, roleName });
        const data = await DashboardService.getTrends(parsed);
        return sendApiResponse(res, 200, "Trends data fetched successfully.", data);
    } catch (error) {
        next(error);
    }
};

export const getRatings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;
        const parsed = getRatingsSchema.parse({ ...req.query, userId, roleName });
        const data = await DashboardService.getRatings(parsed);
        return sendApiResponse(res, 200, "Ratings summary fetched successfully.", data);
    } catch (error) {
        next(error);
    }
};

export const getFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;
        const parsed = getFeedbackSchema.parse({ ...req.query, userId, roleName });
        const data = await DashboardService.getFeedback(parsed);
        return sendApiResponse(res, 200, "Feedback fetched successfully.", data);
    } catch (error) {
        next(error);
    }
};

export const getBenchmark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const roleName = req.roleName;
        const parsed = getBenchmarkSchema.parse({ ...req.query, userId, roleName });
        const data = await DashboardService.getBenchmark(parsed);
        return sendApiResponse(res, 200, "Benchmark data fetched successfully.", data);
    } catch (error) {
        next(error);
    }
};

export * as DashboardController from './dashboard.controller';