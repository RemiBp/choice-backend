import { BadRequestError } from "../../errors/badRequest.error";
import { NotFoundError } from "../../errors/notFound.error";
import { CopilotAgent } from "../../mcp/agent";
import { UserRepository } from "../../repositories";

export const CopilotAgentService = {
    async handle(userId: number, role: string | undefined, query: string) {
        if (!userId) throw new BadRequestError("User ID is required");
        if (!query) throw new BadRequestError("Query text is required");

        // Always fetch user from DB (to infer role properly)
        const user = await UserRepository.findOne({
            where: { id: userId },
            select: ["id", "fullName", "email", "role", "latitude", "longitude"],
            relations: ["producer"],
        });

        if (!user) throw new NotFoundError("User not found");

        // If role is missing, infer it from DB
        const inferredRole = role || user.role || (user.producer ? "producer" : "user");

        const coords =
            user.latitude && user.longitude
                ? { latitude: user.latitude, longitude: user.longitude }
                : undefined;

        const producer = user.producer
            ? {
                id: user.producer.id,
                name: user.producer.name,
                type: user.producer.type,
            }
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

        const result = await CopilotAgent.handle(query, context);
        return result;
    },
};
