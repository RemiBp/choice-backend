import { Router } from 'express';
import ProducerAuthRouter from './auth.route';
import ProducerProfileRouter from './profile.router';
import ProducerBookingRouter from './booking.route';
import ProducerEventRouter from './event.router';
import ProducerPostRouter from './post.route';
import ProducerMapRouter from './maps.routes';
import ProducerServiceRouter from './service.router';

const ProducerRouter = Router();

ProducerRouter.get('/', (req, res) => {
  res.send('Hit Producer route');
});

ProducerRouter.use('/auth', ProducerAuthRouter);
ProducerRouter.use('/profile', ProducerProfileRouter);
ProducerRouter.use('/event', ProducerEventRouter);
ProducerRouter.use('/services', ProducerServiceRouter);
ProducerRouter.use('/booking', ProducerBookingRouter);
ProducerRouter.use('/post', ProducerPostRouter);
ProducerRouter.use('/maps', ProducerMapRouter);

export default ProducerRouter;
