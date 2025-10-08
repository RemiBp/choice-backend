import { Router } from 'express';
import { InterestController } from '../../controllers/app/interest.controller';

const UserInterestRouter = Router();
UserInterestRouter.get('/', (req, res) => {
    res.send('Hit user interest route');
});

UserInterestRouter.post('/createInterest', InterestController.createInterest);

export default UserInterestRouter;
