import { Router } from "express";
import { DashboardController } from "../../controllers/producer/dashboard.controller";
import { authenticateJWT, checkStatus } from "../../middlewares/auth.middleware";

const DashboardRouter = Router();

DashboardRouter.use(authenticateJWT);
DashboardRouter.use(checkStatus);

DashboardRouter.get("/overview", DashboardController.getOverview);
DashboardRouter.get("/user-insights", DashboardController.getUserInsights);
DashboardRouter.get("/trends", DashboardController.getTrends);
DashboardRouter.get("/ratings", DashboardController.getRatings);
DashboardRouter.get("/feedback", DashboardController.getFeedback);
DashboardRouter.get("/benchmark", DashboardController.getBenchmark);

export default DashboardRouter;
