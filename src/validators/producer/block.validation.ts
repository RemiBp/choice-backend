import { z } from "zod";

export const CreateBlockSchema = z.object({
  blockedUserId: z.number(),
});

export type CreateBlockInput = z.infer<typeof CreateBlockSchema>;
