// validators/producer/dashboard.validation.ts
import { z } from "zod";
import { DashboardMetricEnum } from "../../enums/DashboardMetric.enums";

export const baseDashboardSchema = z.object({
    userId: z.number(),
    roleName: z.string(),
    from: z.string().optional(),
    to: z.string().optional(),
});

export const getOverviewSchema = baseDashboardSchema;
export const getUserInsightsSchema = baseDashboardSchema;
export const getTrendsSchema = baseDashboardSchema.extend({
    metric: z.nativeEnum(DashboardMetricEnum).default(DashboardMetricEnum.BOOKINGS),
});
export const getRatingsSchema = baseDashboardSchema;
export const getFeedbackSchema = baseDashboardSchema;
export const getBenchmarkSchema = baseDashboardSchema;
