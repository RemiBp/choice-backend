import { Router } from 'express';
import { ProfileController } from '../../controllers/app/profile.controller';
import { authenticateJWT, authenticateUserJWT, checkStatus } from '../../middlewares/auth.middleware';
import { attachBlockedUsers } from '../../middlewares/block.middleware';

const UserProfileRouter = Router();

UserProfileRouter.get('/', (req, res) => {
  res.send('Hit User profile route');
});
UserProfileRouter.delete('/deleteAccountByEmail', ProfileController.deleteAccountByEmail);

UserProfileRouter.use(authenticateUserJWT);
UserProfileRouter.use(checkStatus);

UserProfileRouter.put('/updateProfile', ProfileController.updateProfile);
UserProfileRouter.get('/getProfile', ProfileController.getProfile);
UserProfileRouter.get('/searchUsers', attachBlockedUsers, ProfileController.searchUsers);
UserProfileRouter.get('/getUserDetail/:userId', attachBlockedUsers, ProfileController.getUserDetail);
UserProfileRouter.delete('/deleteProfile', ProfileController.deleteProfile);

UserProfileRouter.post('/getPreSignedUrlForProfileImage', ProfileController.getPreSignedUrlForProfileImage);
UserProfileRouter.post('/changeCurrentPassword', ProfileController.changeCurrentPassword);
UserProfileRouter.get('/getDeleteReasons', ProfileController.getDeleteReasons);
UserProfileRouter.delete('/deleteAccount/:id', ProfileController.deleteAccount);
UserProfileRouter.get('/getContactSupport', ProfileController.getContactSupport);
UserProfileRouter.put('/addFavouriteRestaurant/:id', ProfileController.addFavouriteRestaurant);
UserProfileRouter.delete('/removeFavouriteRestaurant/:id', ProfileController.removeFavouriteRestaurant);
UserProfileRouter.get('/getFavouriteRestaurants', ProfileController.getFavouriteRestaurants);
UserProfileRouter.get("/getNotifications", ProfileController.getNotifications);
UserProfileRouter.put("/readNotification/:id", ProfileController.readNotification);

UserProfileRouter.get("/getLocationPrivacy", ProfileController.getLocationPrivacy);
UserProfileRouter.post("/updateLocationPrivacy", ProfileController.updateLocationPrivacy);
UserProfileRouter.get("/checkViewerAccess/:ownerUserId", ProfileController.checkViewerAccess);

export default UserProfileRouter;
