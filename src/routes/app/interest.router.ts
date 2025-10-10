import { Router } from 'express';
import { InterestController } from '../../controllers/app/interest.controller';
import { authenticateUserJWT, checkStatus } from '../../middlewares/auth.middleware';

const UserInterestRouter = Router();
UserInterestRouter.get('/', (req, res) => {
    res.send('Hit user interest route');
});

UserInterestRouter.use(authenticateUserJWT);
UserInterestRouter.use(checkStatus);

UserInterestRouter.post('/createInterest', InterestController.createInterest);
UserInterestRouter.get('/producer-slots/:producerId', InterestController.getProducerSlots);
UserInterestRouter.get('/getInvited', InterestController.getInvited);
UserInterestRouter.get('/invitedDetails/:id', InterestController.invitedDetails);
UserInterestRouter.post('/acceptInterestInvite', InterestController.acceptInterestInvite);
UserInterestRouter.post('/declineInterestInvite', InterestController.declineInterestInvite);
UserInterestRouter.post('/suggestNewTime', InterestController.suggestNewTime);

UserInterestRouter.get('/myInterests', InterestController.getUserInterests);
UserInterestRouter.get('/interestDetails/:interestId', InterestController.getInterestDetails);
UserInterestRouter.post('/respondToInvite', InterestController.respondToInvite);
UserInterestRouter.post('/editInterestSlot', InterestController.editInterestSlot);
UserInterestRouter.post('/reserveInterest', InterestController.reserveInterest);

export default UserInterestRouter;
