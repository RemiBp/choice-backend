import { Router } from 'express';
import { AuthController } from '../../controllers/producer/auth.controller';
import { ProfileController } from '../../controllers/producer/profile.controller';
import { ScrapperController } from '../../controllers/producer/scrapper.controller';

const ScrapperRouter = Router();
ScrapperRouter.get('/', (req, res) => {
    res.send('Hit scrapping route');
});

// For scrapping
ScrapperRouter.post('/createProducer', AuthController.createProducer);
ScrapperRouter.get('/getProducers', ProfileController.getProducers);
ScrapperRouter.get('/getProducerbyId/:id', ProfileController.getProducerbyId);

// AI ratings
ScrapperRouter.post('/ratings/restaurant/:producerId', ScrapperController.saveRestaurantAIRating);
ScrapperRouter.post('/ratings/leisure/:producerId', ScrapperController.saveLeisureAIRating);
ScrapperRouter.post('/ratings/wellness/:producerId', ScrapperController.saveWellnessAIRating);

// Menu / Services / Event ratings
ScrapperRouter.post('/menuratings', ScrapperController.saveMenuRating);
ScrapperRouter.post('/servicesratings', ScrapperController.saveServiceRating);
ScrapperRouter.post('/eventratings', ScrapperController.saveEventRating);

// Other scrapper endpoints
ScrapperRouter.post('/getPreSignedUrl', ScrapperController.getPreSignedUrl);
ScrapperRouter.post('/setGalleryImages', ScrapperController.setGalleryImages);
ScrapperRouter.post('/setOperationalHours', ProfileController.setOperationalHours);
ScrapperRouter.post('/setServiceType', ScrapperController.setServiceType);
ScrapperRouter.get('/getAllServiceTypes', ScrapperController.getAllServiceTypes);


export default ScrapperRouter;
