import { Router } from 'express';
import UserAuthRouter from './auth.router';
import UserProfileRouter from './profile.router';
import BookingRouter from './booking.route';
import ProducerBlockRouter from '../producer/block.routes';
import ProducerReportRouter from '../producer/report.routes';
import UserInterestRouter from './interest.router';
import CopilotRouter from './copilot.routes';
import UserMapRouter from './maps.routes';
import SubscriptionRouter from './subscription.route';

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
AppRouter.use('/copilot', CopilotRouter);
AppRouter.use('/subscription', SubscriptionRouter);
AppRouter.use('/maps', UserMapRouter);

export default AppRouter;
