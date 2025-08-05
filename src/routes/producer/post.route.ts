import { Router } from 'express';
// import {  } from '../../middlewares/booking.auth.middleware';
import { PostController } from '../../controllers/producer/post.controller';
import { authenticateJWTForBooking, checkStatus, checkPostCreationPermission, validatePostTypeByRole } from '../../middlewares/post.auth.middleware';

const ProducerPostRouter = Router();
ProducerPostRouter.get('/', (req, res) => {
    res.send('Hit Create Choice/post route');
});

ProducerPostRouter.use(authenticateJWTForBooking);
ProducerPostRouter.use(checkStatus);
// ProducerPostRouter.use(checkPostCreationPermission);

ProducerPostRouter.post('/createProducerPost', validatePostTypeByRole, PostController.createProducerPost);
ProducerPostRouter.get('/getPostsByProducer', PostController.getPostsByProducer);
ProducerPostRouter.post('/createUserPost', checkPostCreationPermission, PostController.createUserPost);
ProducerPostRouter.get('/getUserPosts', PostController.getPosts);
ProducerPostRouter.get('/getPost/:postId', PostController.getPostById);
ProducerPostRouter.put('/updatePost/:postId', PostController.updatePost);
ProducerPostRouter.delete('/deletePost/:postId', PostController.deletePost);
ProducerPostRouter.post('/saveRatings/:postId', checkPostCreationPermission, PostController.saveRatings);
ProducerPostRouter.put('/updatePostEmotions/:postId', checkPostCreationPermission, PostController.updatePostEmotions);
ProducerPostRouter.post('/saveEmotions/:postId', checkPostCreationPermission, PostController.saveEmotions);
ProducerPostRouter.post('/togglePostLike/:postId', PostController.togglePostLike);
ProducerPostRouter.post('/addCommentToPost/:postId', PostController.addCommentToPost);
ProducerPostRouter.get('/getCommentsByPost/:postId', PostController.getCommentsByPost);
ProducerPostRouter.delete('/deleteComment/:commentId', PostController.deleteComment);
ProducerPostRouter.put('/editComment/:commentId', PostController.editComment);
ProducerPostRouter.post('/sharePost/:postId', PostController.sharePost);
ProducerPostRouter.get('/getPostStatistics/:postId', PostController.getPostStatistics);
ProducerPostRouter.post('/toggleFollowProducer', PostController.toggleFollowProducer);

export default ProducerPostRouter;