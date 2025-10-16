import { Router } from 'express';
import { authenticateJWTForBooking, checkStatus } from '../../middlewares/post.auth.middleware';
import { MapsController } from '../../controllers/producer/maps.controller';

const ProducerMapRouter = Router();
ProducerMapRouter.get('/', (req, res) => {
    res.send('Hit Create Map route');
});

ProducerMapRouter.use(authenticateJWTForBooking);
ProducerMapRouter.use(checkStatus);

// ProducerMapRouter.get('/getNearbyProducers', MapsController.getNearbyProducers);
// ProducerMapRouter.get('/getProducerDetails/:id', MapsController.getProducerDetails);
// ProducerMapRouter.get('/getNearbyUsers', MapsController.getNearbyUsers);
ProducerMapRouter.post('/createProducerOffer', MapsController.createProducerOffer);
ProducerMapRouter.get('/getOfferTemplates/:producerId', MapsController.getOfferTemplates);
ProducerMapRouter.get('/getProducerOffers/:producerId', MapsController.getProducerOffers);
ProducerMapRouter.get('/getUserLiveOffers', MapsController.getUserLiveOffers);
ProducerMapRouter.get('/getProducerHeatmap/:id', MapsController.getProducerHeatmap);
ProducerMapRouter.post('/sendOfferNotification', MapsController.sendOfferNotification);

export default ProducerMapRouter;