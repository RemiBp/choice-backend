import { Router } from 'express';
import { EventController } from '../../controllers/producer/event.controller';
import { authenticateBothJWT, authenticateJWT, checkStatus } from '../../middlewares/auth.middleware';

const ProducerEventRouter = Router();
ProducerEventRouter.get('/', (req, res) => {
    res.send('Hit Event route');
});

ProducerEventRouter.use(authenticateBothJWT);
ProducerEventRouter.use(checkStatus);

// User-side (Explore)
ProducerEventRouter.get('/getAllEvents', EventController.getAllEvents);
ProducerEventRouter.get('/getEventById/:eventId', EventController.getEventById);

ProducerEventRouter.use(authenticateJWT);
ProducerEventRouter.use(checkStatus);

// Producer-side (create event, manage events)
ProducerEventRouter.get('/getEventTypes', EventController.getEventTypes);
console.log("getMyEvents route registered");
ProducerEventRouter.post('/createEvent', EventController.createEvent);
ProducerEventRouter.get('/getMyEvents', EventController.getMyEvents);
ProducerEventRouter.put('/updateEvent/:eventId', EventController.updateEvent);
ProducerEventRouter.delete('/deleteEvent/:eventId', EventController.deleteEvent);


export default ProducerEventRouter;
