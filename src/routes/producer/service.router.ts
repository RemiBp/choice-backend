import { Router } from "express";
import { ServiceController } from "../../controllers/producer/service.controller";
import { authenticateJWT, checkStatus } from "../../middlewares/auth.middleware";

const ProducerServiceRouter = Router();

ProducerServiceRouter.get("/", (req, res) => {
  res.send("Hit Service route");
});

ProducerServiceRouter.use(authenticateJWT);
ProducerServiceRouter.use(checkStatus);

ProducerServiceRouter.get("/getServiceTypes", ServiceController.getServiceTypes);
ProducerServiceRouter.post("/createService", ServiceController.createService);
ProducerServiceRouter.get("/getAllServices", ServiceController.getAllServices);
ProducerServiceRouter.get("/getServiceById/:serviceId", ServiceController.getServiceById);
ProducerServiceRouter.put("/updateService/:serviceId", ServiceController.updateService);
ProducerServiceRouter.delete("/deleteService/:serviceId", ServiceController.deleteService);

export default ProducerServiceRouter;
