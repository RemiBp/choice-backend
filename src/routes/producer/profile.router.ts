import { Router } from 'express';
import { ProfileController } from '../../controllers/producer/profile.controller';
import { authenticateBothJWT, authenticateJWT, checkStatus } from '../../middlewares/auth.middleware';
import Producer from '../../models/Producer';

const ProducerProfileRouter = Router();
ProducerProfileRouter.get('/', (req, res) => {
  res.send('Hit Restaurant profile route');
});

ProducerProfileRouter.get('/getAllServiceType', authenticateBothJWT, ProfileController.getAllServiceType);

ProducerProfileRouter.use(authenticateJWT);
ProducerProfileRouter.use(checkStatus);

ProducerProfileRouter.put('/updateProfile', ProfileController.updateProfile);
ProducerProfileRouter.get('/getProfile', ProfileController.getProfile);
ProducerProfileRouter.post('/setOperationalHours', ProfileController.setOperationalHours);
ProducerProfileRouter.get('/getOperationalDays', ProfileController.getOperationalDays);
ProducerProfileRouter.post('/capacity', ProfileController.setCapacity);
ProducerProfileRouter.post('/setServiceType', ProfileController.setServiceType);
ProducerProfileRouter.get('/getServiceType', ProfileController.getServiceType);
ProducerProfileRouter.post('/setGalleryImages', ProfileController.setGalleryImages);
ProducerProfileRouter.get('/getGalleryImages', ProfileController.getGalleryImages);

// ProducerProfileRouter.get('/getProfile', ProfileController.getProfile);
ProducerProfileRouter.post('/getPreSignedUrl', ProfileController.getPreSignedUrl);
ProducerProfileRouter.post('/changeCurrentPassword', ProfileController.changeCurrentPassword);
ProducerProfileRouter.get('/getDeleteReasons', ProfileController.getDeleteReasons);
ProducerProfileRouter.delete('/deleteAccount/:id', ProfileController.deleteAccount);
ProducerProfileRouter.post('/uploadDocuments', ProfileController.uploadDocuments);
ProducerProfileRouter.post('/uploadMenu', ProfileController.uploadMenu);
ProducerProfileRouter.get('/getMenu', ProfileController.getMenu);
ProducerProfileRouter.post('/setSlotDuration', ProfileController.setSlotDuration);
ProducerProfileRouter.get('/getSlotDuration', ProfileController.getSlotDuration);
ProducerProfileRouter.post('/addUnavailableSlot', ProfileController.addUnavailableSlot);
ProducerProfileRouter.get('/getUnavailableSlots', ProfileController.getUnavailableSlots);

ProducerProfileRouter.get('/getOperationalHours', ProfileController.getOperationalHours);
ProducerProfileRouter.get('/getRestaurantSlots', ProfileController.getRestaurantSlots);
ProducerProfileRouter.post('/updateRestaurantSlots', ProfileController.updateRestaurantSlots);
ProducerProfileRouter.post('/uploadRestaurantImages', ProfileController.uploadRestaurantImages);
ProducerProfileRouter.put('/setMainImage/:id', ProfileController.setMainImage);
ProducerProfileRouter.get('/getRestaurantImages', ProfileController.getRestaurantImages);
ProducerProfileRouter.delete('/deleteRestaurantImage/:id', ProfileController.deleteRestaurantImage);
ProducerProfileRouter.get('/getContactSupport', ProfileController.getContactSupport);
ProducerProfileRouter.get('/reviewsAndRating', ProfileController.reviewsAndRating);
ProducerProfileRouter.get('/getReviewsByStar', ProfileController.getReviewsByStar);
ProducerProfileRouter.get('/onBoardingDetail', ProfileController.onBoardingDetail);
ProducerProfileRouter.get('/getPaymentMethods', ProfileController.getPaymentMethods);
ProducerProfileRouter.post('/addPaymentMethods', ProfileController.addPaymentMethods);
ProducerProfileRouter.post('/getRestaurantSlotsByDate', ProfileController.getRestaurantSlotsByDate);
ProducerProfileRouter.get('/bookingChart', ProfileController.bookingChart);
ProducerProfileRouter.get('/customerChart', ProfileController.customerChart);
ProducerProfileRouter.get('/getRepeatAndNewCustomerCounts', ProfileController.getRepeatAndNewCustomerCounts);
ProducerProfileRouter.get("/getNotifications", ProfileController.getNotifications);
ProducerProfileRouter.put("/readNotification/:id", ProfileController.readNotification);
ProducerProfileRouter.post("/addMenuCategory", ProfileController.addMenuCategory);
ProducerProfileRouter.get("/getMenuCategories", ProfileController.getMenuCategories);
ProducerProfileRouter.post("/addMenuDish", ProfileController.addMenuDish);
ProducerProfileRouter.get("/getMenu", ProfileController.getMenu);
ProducerProfileRouter.get("/getCuisineTypes", ProfileController.getCuisineTypes);
ProducerProfileRouter.get("/getCuisineType/:id", ProfileController.getCuisineType);
ProducerProfileRouter.post("/setCuisineType", ProfileController.setCuisineType);


export default ProducerProfileRouter;
