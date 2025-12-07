import axios from "axios";
import { BadRequestError } from "../../errors/badRequest.error";
import { NotFoundError } from "../../errors/notFound.error";
import { OwnerType } from "../../enums/OwnerType.enum";
import { SubscriptionPlan } from "../../enums/SubscriptionPlan.enum";
import { SubscriptionStatus } from "../../enums/SubscriptionStatus.enum";
import { TransactionStatus, TransactionType } from "../../enums/Transaction.enums";
import { RevenueCatSubscriptionInput } from "../../validators/app/subscription.validation";
import { SubscriptionRepository, TransactionRepository } from "../../repositories";

// Sync RevenueCat Subscription (verify or upgrade)
export const syncRevenueCatSubscription = async (
    ownerId: number,
    input: RevenueCatSubscriptionInput
) => {
    const { ownerType, plan, revenueCatData } = input;
    if (!ownerId) throw new BadRequestError("ownerId is required");

    // Verify with RevenueCat
    const { appUserId, entitlement, platform, purchaseToken } = revenueCatData;

    const RC_API_KEY = process.env.REVENUECAT_SECRET_KEY!;
    const RC_BASE = "https://api.revenuecat.com/v1";

    const rcRes = await axios.get(`${RC_BASE}/subscribers/${appUserId}`, {
        headers: { Authorization: `Bearer ${RC_API_KEY}` },
    });

    const entitlements = rcRes.data.subscriber.entitlements || {};
    const activeEntitlement = entitlements[entitlement];

    if (!activeEntitlement || activeEntitlement.expires_date == null)
        throw new BadRequestError("No active RevenueCat entitlement found.");

    const now = new Date();
    const endDate = new Date(activeEntitlement.expires_date);

    // Create or update local subscription
    let subscription = await SubscriptionRepository.findOne({ where: { ownerId, ownerType } });

    if (!subscription) {
        subscription = SubscriptionRepository.create({
            ownerId,
            ownerType,
            plan,
            status: SubscriptionStatus.ACTIVE,
            startDate: now,
            endDate,
            autoRenew: true,
            provider: "revenuecat",
            providerSubscriptionId: purchaseToken,
        });
    } else {
        subscription.plan = plan;
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.startDate = now;
        subscription.endDate = endDate;
        subscription.provider = "revenuecat";
        subscription.providerSubscriptionId = purchaseToken;
    }

    await SubscriptionRepository.save(subscription);

    // Record Transaction
    const transaction = TransactionRepository.create({
        subscription,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.SUCCESS,
        plan,
        amount: 0, // handled by app stores
        currency: "USD",
        providerTransactionId: purchaseToken,
        message: "RevenueCat subscription synced successfully.",
    });

    await TransactionRepository.save(transaction);
    return subscription;
};

// Fetch active subscription
export const getActiveSubscription = async (ownerId: number, ownerType: OwnerType) => {
    if (!ownerId) throw new BadRequestError("ownerId is required");

    const subscription = await SubscriptionRepository.findOne({
        where: { ownerId, ownerType, status: SubscriptionStatus.ACTIVE },
        relations: ["transactions"],
    });

    if (!subscription) {
        const newSub = SubscriptionRepository.create({
            ownerId,
            ownerType,
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE,
        });
        return await SubscriptionRepository.save(newSub);
    }

    return subscription;
};

// Cancel local subscription
export const cancelSubscription = async (ownerId: number, ownerType: OwnerType) => {
    const subscription = await SubscriptionRepository.findOne({
        where: { ownerId, ownerType, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) throw new NotFoundError("Active subscription not found");

    subscription.status = SubscriptionStatus.CANCELED;
    subscription.autoRenew = false;
    await SubscriptionRepository.save(subscription);

    const transaction = TransactionRepository.create({
        subscription,
        type: TransactionType.DOWNGRADE,
        status: TransactionStatus.SUCCESS,
        plan: subscription.plan,
        amount: 0,
        currency: "USD",
        message: "Subscription canceled locally.",
    });
    await TransactionRepository.save(transaction);

    return subscription;
};

// Get transactions
export const getMyTransactions = async (ownerId: number, ownerType: OwnerType) => {
    const subscription = await SubscriptionRepository.findOne({
        where: { ownerId, ownerType },
        relations: ["transactions"],
    });

    if (!subscription) throw new NotFoundError("Subscription not found for this owner");
    return subscription.transactions;
};

export * as SubscriptionService from "./subscription.service";
