import { z } from "zod";

export const CreateInterestSchema = z.object({
  type: z.enum(["Producer", "Event"]),
  producerId: z.number().optional(),
  eventId: z.number().optional(),
  suggestedTime: z.string().optional(), // only for producer
  message: z.string().optional(),
  invitedUserIds: z.array(z.number()).optional(),
});

export type CreateInterestInput = z.infer<typeof CreateInterestSchema>;
