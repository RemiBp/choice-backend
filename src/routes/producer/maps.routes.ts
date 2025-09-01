import { Router } from 'express';
import { authenticateJWTForBooking, checkStatus } from '../../middlewares/post.auth.middleware';
import { MapsController } from '../../controllers/producer/maps.controller';

const ProducerMapRouter = Router();
ProducerMapRouter.get('/', (req, res) => {
    res.send('Hit Create Map route');
});

ProducerMapRouter.use(authenticateJWTForBooking);
ProducerMapRouter.use(checkStatus);

ProducerMapRouter.get('/getNearbyProducers', MapsController.getNearbyProducers);
ProducerMapRouter.get('/getProducerDetails/:id', MapsController.getProducerDetails);

export default ProducerMapRouter;