import { z } from "zod";

export const ReportReasons = [
  "Spam or Fake Account",
  "Inappropriate Content",
  "Harassment or Bullying",
  "Hate Speech",
  "Scam or Fraud",
] as const;

export const CreateReportSchema = z
  .object({
    reportedUserId: z.number().optional(),
    reportedPostId: z.number().optional(),
    reportedCommentId: z.number().optional(),
    reason: z.enum(ReportReasons),
    details: z.string().optional(),
  })
  .refine(
    (data) => {
      const ids = [data.reportedUserId, data.reportedPostId, data.reportedCommentId].filter(
        (id) => id !== undefined
      );
      return ids.length === 1; 
    },
    {
      message: "You must provide exactly one of reportedUserId, reportedPostId, or reportedCommentId",
      path: ["reportedTarget"],
    }
  );

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
