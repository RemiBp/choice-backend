import { Router } from 'express';
import { ProfileController } from '../../controllers/app/profile.controller';
import { authenticateJWT, checkStatus } from '../../middlewares/auth.middleware';

const UserProfileRouter = Router();

UserProfileRouter.get('/', (req, res) => {
  res.send('Hit User profile route');
});
UserProfileRouter.delete('/deleteAccountByEmail', ProfileController.deleteAccountByEmail);

UserProfileRouter.use(authenticateJWT);
UserProfileRouter.use(checkStatus);

UserProfileRouter.put('/updateProfile', ProfileController.updateProfile);
UserProfileRouter.get('/getProfile', ProfileController.getProfile);

UserProfileRouter.post('/getPreSignedUrlForProfileImage', ProfileController.getPreSignedUrlForProfileImage);
UserProfileRouter.post('/changeCurrentPassword', ProfileController.changeCurrentPassword);
UserProfileRouter.get('/getDeleteReasons', ProfileController.getDeleteReasons);
UserProfileRouter.delete('/deleteAccount/:id', ProfileController.deleteAccount);
UserProfileRouter.get('/getContactSupport', ProfileController.getContactSupport);
UserProfileRouter.put('/addFavouriteRestaurant/:id', ProfileController.addFavouriteRestaurant);
UserProfileRouter.delete('/removeFavouriteRestaurant/:id', ProfileController.removeFavouriteRestaurant);
UserProfileRouter.get('/getFavouriteRestaurants', ProfileController.getFavouriteRestaurants);
UserProfileRouter.get( "/getNotifications", ProfileController.getNotifications);
UserProfileRouter.put("/readNotification/:id", ProfileController.readNotification);

export default UserProfileRouter;
