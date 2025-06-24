import { Router } from 'express';
import { ProfileController } from '../../controllers/producer/profile.controller';
import { authenticateJWTForRestaurant, checkStatus } from '../../middlewares/restaurant.auth.middleware';

const RestaurantProfileRouter = Router();
RestaurantProfileRouter.get('/', (req, res) => {
  res.send('Hit Restaurant profile route');
});

RestaurantProfileRouter.use(authenticateJWTForRestaurant);
RestaurantProfileRouter.use(checkStatus);

RestaurantProfileRouter.put('/updateProfile', ProfileController.updateProfile);
RestaurantProfileRouter.get('/getProfile', ProfileController.getProfile);
RestaurantProfileRouter.post('/getPreSignedUrl', ProfileController.getPreSignedUrl);
RestaurantProfileRouter.post('/changeCurrentPassword', ProfileController.changeCurrentPassword);
RestaurantProfileRouter.get('/getDeleteReasons', ProfileController.getDeleteReasons);
RestaurantProfileRouter.delete('/deleteAccount/:id', ProfileController.deleteAccount);
RestaurantProfileRouter.post('/uploadDocuments', ProfileController.uploadDocuments);
RestaurantProfileRouter.post('/uploadMenu', ProfileController.uploadMenu);
RestaurantProfileRouter.get('/getMenu', ProfileController.getMenu);
RestaurantProfileRouter.post('/setOperationalHours', ProfileController.setOperationalHours);
RestaurantProfileRouter.post('/setSlotDuration', ProfileController.setSlotDuration);
RestaurantProfileRouter.get('/getSlotDuration', ProfileController.getSlotDuration);
RestaurantProfileRouter.post('/addUnavailableSlot', ProfileController.addUnavailableSlot);
RestaurantProfileRouter.get('/getUnavailableSlots', ProfileController.getUnavailableSlots);

RestaurantProfileRouter.get('/getOperationalHours', ProfileController.getOperationalHours);
RestaurantProfileRouter.get('/getRestaurantSlots', ProfileController.getRestaurantSlots);
RestaurantProfileRouter.post('/updateRestaurantSlots', ProfileController.updateRestaurantSlots);
RestaurantProfileRouter.post('/uploadRestaurantImages', ProfileController.uploadRestaurantImages);
RestaurantProfileRouter.put('/setMainImage/:id', ProfileController.setMainImage);
RestaurantProfileRouter.get('/getRestaurantImages', ProfileController.getRestaurantImages);
RestaurantProfileRouter.delete('/deleteRestaurantImage/:id', ProfileController.deleteRestaurantImage);
RestaurantProfileRouter.get('/getContactSupport', ProfileController.getContactSupport);
RestaurantProfileRouter.get('/reviewsAndRating', ProfileController.reviewsAndRating);
RestaurantProfileRouter.get('/getReviewsByStar', ProfileController.getReviewsByStar);
RestaurantProfileRouter.get('/onBoardingDetail', ProfileController.onBoardingDetail);
RestaurantProfileRouter.get('/getPaymentMethods', ProfileController.getPaymentMethods);
RestaurantProfileRouter.post('/addPaymentMethods', ProfileController.addPaymentMethods);
RestaurantProfileRouter.post('/getRestaurantSlotsByDate', ProfileController.getRestaurantSlotsByDate);
RestaurantProfileRouter.get('/bookingChart', ProfileController.bookingChart);
RestaurantProfileRouter.get('/customerChart', ProfileController.customerChart);
RestaurantProfileRouter.get('/getRepeatAndNewCustomerCounts', ProfileController.getRepeatAndNewCustomerCounts);
RestaurantProfileRouter.get( "/getNotifications", ProfileController.getNotifications);
RestaurantProfileRouter.put("/readNotification/:id", ProfileController.readNotification);

export default RestaurantProfileRouter;
