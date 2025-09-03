import { Router } from 'express';
import { AuthController } from '../../controllers/producer/auth.controller';
import { authenticateBothJWT, authenticateJWT } from '../../middlewares/auth.middleware';

const ProducerAuthRouter = Router();
ProducerAuthRouter.get('/', (req, res) => {
  res.send('Hit Technician auth route');
});

// For scrapping
ProducerAuthRouter.post('/createProducer', AuthController.createProducer);

ProducerAuthRouter.post('/register', AuthController.register);
ProducerAuthRouter.post('/login', AuthController.login);
ProducerAuthRouter.post('/verifyOtp', AuthController.verifyOtp);
ProducerAuthRouter.post('/saveDocument', authenticateJWT, AuthController.saveDocument);
ProducerAuthRouter.post('/getPreSignedUrl', authenticateBothJWT, AuthController.getPreSignedUrl);
ProducerAuthRouter.post('/submitDocuments', authenticateJWT, AuthController.submitDocuments);
ProducerAuthRouter.post('/resendSignUpOtp', AuthController.resendSignUpOtp);
ProducerAuthRouter.post('/forgotPassword', AuthController.forgotPassword);
ProducerAuthRouter.post('/resendForgotPasswordOtp', AuthController.resendForgotPasswordOtp);
ProducerAuthRouter.post('/verifyForgotPasswordOtp', AuthController.verifyForgotPasswordOtp);
ProducerAuthRouter.post('/resetPassword', AuthController.resetPassword);
ProducerAuthRouter.post('/refreshAccessToken', AuthController.refreshAccessToken);
ProducerAuthRouter.post('/socialLogin', AuthController.socialLogin);
ProducerAuthRouter.post('/checkTokenDetails', AuthController.checkTokenDetails);
ProducerAuthRouter.get('/getCuisineTypes', AuthController.getCuisineTypes);
export default ProducerAuthRouter;
