import { Router } from 'express';
import { AuthController } from '../../controllers/producer/auth.controller';

const RestaurantAuthRouter = Router();
RestaurantAuthRouter.get('/', (req, res) => {
  res.send('Hit Technician auth route');
});

RestaurantAuthRouter.post('/register', AuthController.register);
RestaurantAuthRouter.post('/login', AuthController.login);
RestaurantAuthRouter.post('/verifyOtp', AuthController.verifyOtp);
RestaurantAuthRouter.post('/resendSignUpOtp', AuthController.resendSignUpOtp);
RestaurantAuthRouter.post('/forgotPassword', AuthController.forgotPassword);
RestaurantAuthRouter.post('/resendForgotPasswordOtp', AuthController.resendForgotPasswordOtp);
RestaurantAuthRouter.post('/verifyForgotPasswordOtp', AuthController.verifyForgotPasswordOtp);
RestaurantAuthRouter.post('/resetPassword', AuthController.resetPassword);
RestaurantAuthRouter.post('/refreshAccessToken', AuthController.refreshAccessToken);
RestaurantAuthRouter.post('/socialLogin', AuthController.socialLogin);
RestaurantAuthRouter.post('/checkTokenDetails', AuthController.checkTokenDetails);
RestaurantAuthRouter.get('/getCuisineTypes', AuthController.getCuisineTypes);
export default RestaurantAuthRouter;
