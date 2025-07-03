import { Router } from 'express';
import { EventController } from '../../controllers/producer/event.controller';
import { authenticateJWTForRestaurant, checkStatus } from '../../middlewares/restaurant.auth.middleware';

const ProducerEventRouter = Router();
ProducerEventRouter.get('/', (req, res) => {
    res.send('Hit Event route');
});

ProducerEventRouter.use(authenticateJWTForRestaurant);
ProducerEventRouter.use(checkStatus);

ProducerEventRouter.post('/createEvent', EventController.createEvent);
ProducerEventRouter.get('/getAllEvents', EventController.getAllEvents);
ProducerEventRouter.get('/getEventById/:eventId', EventController.getEventById);
ProducerEventRouter.put('/updateEvent/:eventId', EventController.updateEvent);
ProducerEventRouter.delete('/deleteEvent/:eventId', EventController.deleteEvent);


export default ProducerEventRouter;
