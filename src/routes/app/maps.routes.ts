import { Router } from 'express';
import { MapsController } from '../../controllers/producer/maps.controller';
import { authenticateBothJWT, checkStatus } from '../../middlewares/auth.middleware';

const UserMapRouter = Router();
UserMapRouter.get('/', (req, res) => {
    res.send('Hit Create Map route');
});

UserMapRouter.use(authenticateBothJWT);
UserMapRouter.use(checkStatus);

UserMapRouter.get('/getNearbyProducers', MapsController.getNearbyProducers);
UserMapRouter.get('/getProducerDetails/:id', MapsController.getProducerDetails);
UserMapRouter.get('/getNearbyUsers', MapsController.getNearbyUsers);
UserMapRouter.post('/createProducerOffer', MapsController.createProducerOffer);
UserMapRouter.get('/getOfferTemplates/:producerId', MapsController.getOfferTemplates);
UserMapRouter.get('/getProducerOffers/:producerId', MapsController.getProducerOffers);
UserMapRouter.get('/getProducerHeatmap/:id', MapsController.getProducerHeatmap);

export default UserMapRouter;