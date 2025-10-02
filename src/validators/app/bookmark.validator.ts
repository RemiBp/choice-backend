import { z } from "zod";

export const toggleBookmarkSchema = z.object({
    body: z.object({
        postId: z.number().optional(),
        producerId: z.number().optional(),
    }).refine((data) => data.postId || data.producerId, {
        message: "Either postId or producerId is required",
        path: ["postId"],
    }),
});

export type ToggleBookmarkInput = z.infer<typeof toggleBookmarkSchema>["body"];
