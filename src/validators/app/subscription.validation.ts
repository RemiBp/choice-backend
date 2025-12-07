import { z } from "zod";
import { OwnerType } from "../../enums/OwnerType.enum";
import { SubscriptionPlan } from "../../enums/SubscriptionPlan.enum";

export const RevenueCatSubscriptionSchema = z.object({
  ownerType: z.nativeEnum(OwnerType),
  plan: z.nativeEnum(SubscriptionPlan),
  amount: z.number().nonnegative().default(0),

  revenueCatData: z.object({
    appUserId: z.string().min(1, "App User ID is required"),
    entitlement: z.string().min(1, "Entitlement key is required"),
    productIdentifier: z.string().min(1, "Product identifier is required"),
    platform: z.enum(["ios", "android"]),
    purchaseToken: z.string().min(1, "RevenueCat purchase token is required"),
  }),
});

export type RevenueCatSubscriptionInput = z.infer<typeof RevenueCatSubscriptionSchema>;
