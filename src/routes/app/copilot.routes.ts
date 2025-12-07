import { Router } from "express";
import { authenticateBothJWT, checkStatus } from "../../middlewares/auth.middleware";
import { CopilotController } from "../../controllers/app/copilot.controller";

const CopilotRouter = Router();

CopilotRouter.use(authenticateBothJWT);
CopilotRouter.use(checkStatus);

CopilotRouter.post("/query", CopilotController.handleQuery);

export default CopilotRouter;
