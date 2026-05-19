import { Router } from 'express';
import { AuthController } from '../../controllers/app/auth.controller';
import { authRateLimit, otpRateLimit } from '../../middlewares/rate-limit.middleware';

const UserAuthRouter = Router();
UserAuthRouter.get('/', (req, res) => {
  res.send('Hit user auth route');
});

UserAuthRouter.post('/register', authRateLimit, AuthController.register);
UserAuthRouter.post('/login', authRateLimit, AuthController.login);
UserAuthRouter.post('/verifyOtp', otpRateLimit, AuthController.verifyOtp);
UserAuthRouter.post('/resendSignUpOtp', otpRateLimit, AuthController.resendSignUpOtp);
UserAuthRouter.post('/forgotPassword', authRateLimit, AuthController.forgotPassword);
UserAuthRouter.post('/resendForgotPasswordOtp', otpRateLimit, AuthController.resendForgotPasswordOtp);
UserAuthRouter.post('/verifyForgotPasswordOtp', otpRateLimit, AuthController.verifyForgotPasswordOtp);
UserAuthRouter.post('/resetPassword', authRateLimit, AuthController.resetPassword);
UserAuthRouter.post('/refreshAccessToken', AuthController.refreshAccessToken);
UserAuthRouter.post('/socialLogin', AuthController.socialLogin);
UserAuthRouter.post('/checkTokenDetails', AuthController.checkTokenDetails);

export default UserAuthRouter;
