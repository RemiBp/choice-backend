import { Router } from "express";
import { authenticateBothJWT } from "../../middlewares/auth.middleware";
import { SubscriptionController } from "../../controllers/app/subscription.controller";

const SubscriptionRouter = Router();

SubscriptionRouter.use(authenticateBothJWT);
SubscriptionRouter.get("/status", SubscriptionController.status);
SubscriptionRouter.post("/verify", SubscriptionController.verify);
SubscriptionRouter.post("/cancel", SubscriptionController.cancel);
SubscriptionRouter.get("/transactions", SubscriptionController.transactions);

export default SubscriptionRouter;
