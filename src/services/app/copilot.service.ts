import { BadRequestError } from "../../errors/badRequest.error";
import { NotFoundError } from "../../errors/notFound.error";
import { CopilotAgent } from "../../mcp/agent";
import { UserRepository } from "../../repositories";
import { SubscriptionService } from "./subscription.service";
import { OwnerType } from "../../enums/OwnerType.enum";
import { SubscriptionPlan } from "../../enums/SubscriptionPlan.enum";
import { CopilotUsageService } from "./copilot.usage.service";

export const CopilotAgentService = {
    async handle(userId: number, role: string | undefined, query: string) {
        if (!userId) throw new BadRequestError("User ID is required");
        if (!query) throw new BadRequestError("Query text is required");

        // Fetch user with potential producer relation
        const user = await UserRepository.findOne({
            where: { id: userId },
            select: ["id", "fullName", "email", "role", "latitude", "longitude"],
            relations: ["producer"],
        });
        if (!user) throw new NotFoundError("User not found");

        // Determine role and owner info
        const inferredRole = role || user.role || (user.producer ? "producer" : "user");
        const ownerType = user.producer ? OwnerType.PRODUCER : OwnerType.USER;
        const ownerId = user.producer ? user.producer.id : user.id;

        // Get active subscription
        const sub = await SubscriptionService.getActiveSubscription(ownerId, ownerType);
        const isPro = sub.plan !== SubscriptionPlan.FREE;

        // Check query usage limit if on Free plan
        const usage = await CopilotUsageService.checkLimit(user.id, isPro);
        if (!usage.allowed) {
            return {
                message: "You’ve reached your free Copilot query limit. Upgrade to Pro to continue.",
                data: { plan: sub.plan, remaining: 0, upgrade: true },
            };
        }

        // Build Copilot context
        const coords =
            user.latitude && user.longitude
                ? { latitude: user.latitude, longitude: user.longitude }
                : undefined;

        const producer = user.producer
            ? { id: user.producer.id, name: user.producer.name, type: user.producer.type }
            : undefined;

        const context = {
            userId,
            role: inferredRole,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
            },
            coords,
            producer,
            today: new Date().toISOString().split("T")[0],
        };

        // Run the Copilot agent
        const result = await CopilotAgent.handle(query, context);

        // Increment usage if Free plan
        if (!isPro) await CopilotUsageService.incrementUsage(user.id);

        return { ...result, plan: sub.plan, remaining: usage.remaining };
    },
};
