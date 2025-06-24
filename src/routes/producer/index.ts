import { Router } from 'express';
import RestaurantAuthRouter from './auth.route';
import RestaurantProfileRouter from './profile.router';
import RestaurantBookingRouter from './booking.route';

const RestaurantRouter = Router();

RestaurantRouter.get('/', (req, res) => {
  res.send('Hit Restaurant route');
});

RestaurantRouter.use('/auth', RestaurantAuthRouter);
RestaurantRouter.use('/profile', RestaurantProfileRouter);
RestaurantRouter.use('/booking', RestaurantBookingRouter);

export default RestaurantRouter;
