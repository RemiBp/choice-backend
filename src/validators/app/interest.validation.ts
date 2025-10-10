import { z } from "zod";

export const CreateInterestSchema = z.object({
  type: z.enum(["Producer", "Event"]),
  producerId: z.number().optional(),
  eventId: z.number().optional(),
  slotId: z.number().optional(),
  suggestedTime: z.string().optional(),
  message: z.string().optional(),
  invitedUserIds: z.array(z.number()).optional(),
});

export type CreateInterestInput = z.infer<typeof CreateInterestSchema>;

export const AcceptInterestInviteSchema = z.object({
  interestId: z.number({
    required_error: "Interest ID is required.",
    invalid_type_error: "Interest ID must be a number.",
  }),
})

export type AcceptInterestInviteInput = z.infer<typeof AcceptInterestInviteSchema>;

export const DeclineInterestInviteSchema = z.object({
  interestId: z.number({
    required_error: "Interest ID is required.",
  }),
  reason: z
    .string()
    .min(1, "Reason must not be empty.")
    .max(300, "Reason too long.")
    .optional(),
});

export type DeclineInterestInviteInput = z.infer<typeof DeclineInterestInviteSchema>;

export const SuggestNewTimeSchema = z
  .object({
    interestId: z.number({
      required_error: "Interest ID is required.",
    }),
    slotId: z.number().optional(),
    suggestedTime: z.string().optional(),
    message: z.string().optional(),
  })
  .refine((data) => data.slotId || data.suggestedTime, {
    message: "Either slotId or suggestedTime must be provided.",
    path: ["slotId"],
  });

export type SuggestNewTimeInput = z.infer<typeof SuggestNewTimeSchema>;

export const EditSlotSchema = z.object({
  newSlotId: z.number().min(1, "Slot ID is required"),
  message: z.string().optional(),
  interestId: z.number({
    required_error: "Interest ID is required.",
  }),
});

export type EditSlotInput = z.infer<typeof EditSlotSchema>;

export const ReserveInterestSchema = z.object({
  interestId: z
    .number({
      required_error: "interestId is required",
      invalid_type_error: "interestId must be a number",
    })
    .positive("interestId must be a positive number"),

  timeZone: z
    .string({
      required_error: "timeZone is required",
      invalid_type_error: "timeZone must be a string",
    })
    .min(1, "timeZone cannot be empty"),

  guestCount: z
    .number()
    .int("guestCount must be an integer")
    .min(1, "guestCount must be at least 1")
    .optional(),

  specialRequest: z
    .string()
    .max(300, "specialRequest cannot exceed 300 characters")
    .optional(),

  date: z
    .string({
      required_error: "date is required",
      invalid_type_error: "date must be a string",
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
});

export type ReserveInterestInput = z.infer<typeof ReserveInterestSchema>;
