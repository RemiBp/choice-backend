import { Router } from 'express';
import { AuthController } from '../../controllers/producer/auth.controller';
import { authenticateBothJWT, authenticateJWT } from '../../middlewares/auth.middleware';
import { authRateLimit, otpRateLimit } from '../../middlewares/rate-limit.middleware';

const ProducerAuthRouter = Router();
ProducerAuthRouter.get('/', (req, res) => {
  res.send('Hit Technician auth route');
});

// For scrapping
ProducerAuthRouter.post('/createProducer', AuthController.createProducer);

ProducerAuthRouter.post('/register', authRateLimit, AuthController.register);
ProducerAuthRouter.post('/login', authRateLimit, AuthController.login);
ProducerAuthRouter.post('/verifyOtp', otpRateLimit, AuthController.verifyOtp);
ProducerAuthRouter.post('/switchProfile', authenticateJWT, AuthController.switchProfile );
ProducerAuthRouter.post('/saveDocument', authenticateJWT, AuthController.saveDocument);
ProducerAuthRouter.get('/getProducerDocuments', authenticateJWT, AuthController.getProducerDocuments);
ProducerAuthRouter.put('/updateDocuments', authenticateJWT, AuthController.updateProducerDocuments);
ProducerAuthRouter.delete("/deleteDocument", authenticateJWT,AuthController.deleteDocument);
ProducerAuthRouter.post('/getPreSignedUrl', authenticateBothJWT, AuthController.getPreSignedUrl);
ProducerAuthRouter.post('/submitDocuments', authenticateJWT, AuthController.submitDocuments);
ProducerAuthRouter.post('/resendSignUpOtp', otpRateLimit, AuthController.resendSignUpOtp);
ProducerAuthRouter.post('/forgotPassword', authRateLimit, AuthController.forgotPassword);
ProducerAuthRouter.post('/resendForgotPasswordOtp', otpRateLimit, AuthController.resendForgotPasswordOtp);
ProducerAuthRouter.post('/verifyForgotPasswordOtp', otpRateLimit, AuthController.verifyForgotPasswordOtp);
ProducerAuthRouter.post('/resetPassword', authRateLimit, AuthController.resetPassword);
ProducerAuthRouter.post('/refreshAccessToken', AuthController.refreshAccessToken);
ProducerAuthRouter.post('/socialLogin', AuthController.socialLogin);
ProducerAuthRouter.post('/checkTokenDetails', AuthController.checkTokenDetails);
ProducerAuthRouter.get('/getCuisineTypes', AuthController.getCuisineTypes);
export default ProducerAuthRouter;
