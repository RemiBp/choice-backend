import { Router } from 'express';
import { BookingController } from '../../controllers/app/booking.controller';
import { authenticateJWT, authenticateUserJWT, checkStatus } from '../../middlewares/auth.middleware';

const BookingRouter = Router();
BookingRouter.get('/', (req, res) => {
  res.send('Hit Customer Booking route');
});

BookingRouter.use(authenticateUserJWT);
BookingRouter.use(checkStatus);

BookingRouter.post('/findRestaurantsNearby', BookingController.findRestaurantsNearby);
BookingRouter.post('/findRestaurantsByCuisine', BookingController.findRestaurantsByCuisine);
BookingRouter.get('/getRestaurant/:id', BookingController.getRestaurant);
BookingRouter.get('/getRestaurantSlots/:id', BookingController.getRestaurantSlots);
BookingRouter.post('/createBooking', BookingController.createBooking);
BookingRouter.put('/updateBooking/:id', BookingController.updateBooking);
BookingRouter.get('/getBookings', BookingController.getBookings);
BookingRouter.get('/getBooking/:id', BookingController.getBooking);
BookingRouter.put('/cancel/:id', BookingController.cancel);
BookingRouter.put('/addReview/:id', BookingController.addReview);
BookingRouter.get('/getCuisineTypes', BookingController.getCuisineTypes);
BookingRouter.put('/updateBookingTemp/:id', BookingController.updateBookingTemp);
BookingRouter.get('/getRestaurantImages/:id', BookingController.getRestaurantImages);

export default BookingRouter;
