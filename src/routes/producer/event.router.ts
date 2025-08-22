import { Router } from 'express';
import { EventController } from '../../controllers/producer/event.controller';
import { authenticateJWT, checkStatus } from '../../middlewares/auth.middleware';

const ProducerEventRouter = Router();
ProducerEventRouter.get('/', (req, res) => {
    res.send('Hit Event route');
});

ProducerEventRouter.use(authenticateJWT);
ProducerEventRouter.use(checkStatus);

ProducerEventRouter.get('/getEventTypes', EventController.getEventTypes);
ProducerEventRouter.post('/createEvent', EventController.createEvent);
ProducerEventRouter.get('/getAllEvents', EventController.getAllEvents);
ProducerEventRouter.get('/getEventById/:eventId', EventController.getEventById);
ProducerEventRouter.put('/updateEvent/:eventId', EventController.updateEvent);
ProducerEventRouter.delete('/deleteEvent/:eventId', EventController.deleteEvent);


export default ProducerEventRouter;
