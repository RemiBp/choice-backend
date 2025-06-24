import { Router } from 'express';
import { BookingController } from '../../controllers/producer/booking.controller';
import { authenticateJWTForRestaurant, checkStatus } from '../../middlewares/restaurant.auth.middleware';

const RestaurantBookingRouter = Router();
RestaurantBookingRouter.get('/', (req, res) => {
  res.send('Hit Customer Booking route');
});

RestaurantBookingRouter.use(authenticateJWTForRestaurant);
RestaurantBookingRouter.use(checkStatus);

RestaurantBookingRouter.get('/getBookings', BookingController.getBookings);
RestaurantBookingRouter.get('/getBooking/:id', BookingController.getBooking);
RestaurantBookingRouter.put('/cancel/:id', BookingController.cancel);
RestaurantBookingRouter.put('/checkIn/:id', BookingController.checkIn);
RestaurantBookingRouter.put('/updateBookingTemp/:id', BookingController.updateBookingTemp);

export default RestaurantBookingRouter;
