import { Router } from "express";
import { ReportController } from "../../controllers/producer/report.controller";
import { authenticateJWT, checkStatus } from "../../middlewares/auth.middleware";

const ProducerReportRouter = Router();
ProducerReportRouter.get('/', (req, res) => {
    res.send('Hit Report route');
});

ProducerReportRouter.use(authenticateJWT);
ProducerReportRouter.use(checkStatus);

ProducerReportRouter.post("/createReport", ReportController.createReport);
ProducerReportRouter.get("/getMyReports", ReportController.getMyReports);
ProducerReportRouter.put("/updateReportStatus/:reportId", ReportController.updateReportStatus);

export default ProducerReportRouter;
