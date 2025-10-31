
import dayjs from "dayjs";
import { BadRequestError } from "../../errors/badRequest.error";
import { CopilotUsageRepository } from "../../repositories";

const FREE_QUERY_LIMIT = 20;


// Get or create usage record for a user
export const getOrCreateUsage = async (userId: number) => {
    if (!userId) throw new BadRequestError("User ID is required");

    let usage = await CopilotUsageRepository.findOne({ where: { userId } });

    if (!usage) {
        usage = CopilotUsageRepository.create({
            userId,
            totalQueries: 0,
            monthlyQueries: 0,
            lastResetAt: new Date(),
        });
        await CopilotUsageRepository.save(usage);
    }

    // Auto-reset monthly usage at start of month
    const startOfMonth = dayjs().startOf("month");
    if (!usage.lastResetAt || dayjs(usage.lastResetAt).isBefore(startOfMonth)) {
        usage.monthlyQueries = 0;
        usage.lastResetAt = new Date();
        await CopilotUsageRepository.save(usage);
    }

    return usage;
};

// Check if user can make a new Copilot query
export const checkLimit = async (userId: number, isPro: boolean) => {
    const usage = await getOrCreateUsage(userId);

    if (isPro) {
        // Unlimited queries for Pro plan
        return { allowed: true, remaining: "unlimited" };
    }

    const remaining = FREE_QUERY_LIMIT - usage.monthlyQueries;
    const allowed = remaining > 0;

    return {
        allowed,
        remaining: Math.max(remaining, 0),
    };
};

// Increment Copilot usage count
export const incrementUsage = async (userId: number) => {
    const usage = await getOrCreateUsage(userId);

    usage.totalQueries += 1;
    usage.monthlyQueries += 1;
    await CopilotUsageRepository.save(usage);

    return usage;
};

// Reset Copilot usage manually (admin/debug)
export const resetUsage = async (userId: number) => {
    const usage = await getOrCreateUsage(userId);
    usage.monthlyQueries = 0;
    usage.lastResetAt = new Date();
    await CopilotUsageRepository.save(usage);
    return usage;
};

export * as CopilotUsageService from "./copilot.usage.service";
