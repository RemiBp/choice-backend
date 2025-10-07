import { Router } from 'express';
import UserAuthRouter from './auth.router';
import UserProfileRouter from './profile.router';
import BookingRouter from './booking.route';
import UserInterestRouter from './interest.router';

const AppRouter = Router();
AppRouter.get('/', (req, res) => {
  res.send('Hit App route');
});

AppRouter.use('/auth', UserAuthRouter);
AppRouter.use('/profile', UserProfileRouter);
AppRouter.use('/booking', BookingRouter);
AppRouter.use('/interest', UserInterestRouter);

export default AppRouter;
