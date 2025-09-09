import { Router } from "express";
import { BlockController } from "../../controllers/producer/block.controller";
import { authenticateBothJWT, checkStatus } from "../../middlewares/auth.middleware";

const ProducerBlockRouter = Router();
ProducerBlockRouter.get('/', (req, res) => {
  res.send('Hit Block route');
});

ProducerBlockRouter.use(authenticateBothJWT);
ProducerBlockRouter.use(checkStatus);

ProducerBlockRouter.post("/createBlock", BlockController.createBlock);
ProducerBlockRouter.get("/getMyBlocks", BlockController.getMyBlocks);
ProducerBlockRouter.delete("/unblockUser/:blockId", BlockController.unblockUser);

export default ProducerBlockRouter;
