import { Router } from 'express';
import UserAuthRouter from './auth.router';
import UserProfileRouter from './profile.router';
import BookingRouter from './booking.route';
import ProducerBlockRouter from '../producer/block.routes';
import ProducerReportRouter from '../producer/report.routes';
import UserInterestRouter from './interest.router';
import UserMapRouter from './maps.routes';

const AppRouter = Router();
AppRouter.get('/', (req, res) => {
  res.send('Hit App route');
});

AppRouter.use('/auth', UserAuthRouter);
AppRouter.use('/profile', UserProfileRouter);
AppRouter.use('/booking', BookingRouter);
AppRouter.use('/blocking', ProducerBlockRouter);
AppRouter.use('/report', ProducerReportRouter);
AppRouter.use('/interest', UserInterestRouter);
AppRouter.use('/maps', UserMapRouter);

export default AppRouter;
