import { Router } from 'express';
import { PostController } from '../../controllers/producer/post.controller';
import { authenticateJWTForBooking, checkStatus, checkPostCreationPermission, validatePostTypeByRole } from '../../middlewares/post.auth.middleware';
import Producer from '../../models/Producer';
import { attachBlockedUsers } from '../../middlewares/block.middleware';

const ProducerPostRouter = Router();
ProducerPostRouter.get('/', (req, res) => {
    res.send('Hit Create Choice/post route');
});

ProducerPostRouter.use(authenticateJWTForBooking);
ProducerPostRouter.use(checkStatus);
ProducerPostRouter.use(attachBlockedUsers);
// ProducerPostRouter.use(checkPostCreationPermission);

ProducerPostRouter.get('/getProducerPlaces', PostController.getProducerPlaces);
ProducerPostRouter.post('/createProducerPost', validatePostTypeByRole, PostController.createProducerPost);
ProducerPostRouter.get('/getPostsByProducer', PostController.getPostsByProducer);
ProducerPostRouter.post('/createUserPost', checkPostCreationPermission, PostController.createUserPost);
ProducerPostRouter.get('/getUserPosts', PostController.getPosts);
ProducerPostRouter.get('/getMyPosts', PostController.getMyPosts);
ProducerPostRouter.get('/getUserPostById/:postId', PostController.getUserPostById);
ProducerPostRouter.get('/getProducerPostById/:postId', PostController.getProducerPostById);
ProducerPostRouter.put('/updatePost/:postId', PostController.updatePost);
ProducerPostRouter.delete('/deletePost/:postId', PostController.deletePost);
ProducerPostRouter.post('/saveRatings/:postId', checkPostCreationPermission, PostController.saveRatings);
ProducerPostRouter.post('/createServiceRatings', checkPostCreationPermission, PostController.createServiceRatings);
ProducerPostRouter.post('/createEventRatings', checkPostCreationPermission, PostController.createEventRatings);
ProducerPostRouter.post('/createDishRatings', checkPostCreationPermission, PostController.createDishRatings);
ProducerPostRouter.get('/getDishRatings/:postId', PostController.getDishRatings);
ProducerPostRouter.post('/saveEmotions/:postId', checkPostCreationPermission, PostController.saveEmotions);
ProducerPostRouter.post('/togglePostLike/:postId', PostController.togglePostLike);
ProducerPostRouter.post('/addCommentToPost/:postId', PostController.addCommentToPost);
ProducerPostRouter.get('/getCommentsByPost/:postId', PostController.getCommentsByPost);
ProducerPostRouter.delete('/deleteComment/:commentId', PostController.deleteComment);
ProducerPostRouter.put('/editComment/:commentId', PostController.editComment);
ProducerPostRouter.post('/sharePost/:postId', PostController.sharePost);
ProducerPostRouter.get('/getPostStatistics/:postId', PostController.getPostStatistics);
ProducerPostRouter.post('/toggleFollowProducer', PostController.toggleFollowProducer);
ProducerPostRouter.post('/approvedRequest/:followId', PostController.approvedRequest);
ProducerPostRouter.get('/getFollowingRequest', PostController.getFollowingRequest);

export default ProducerPostRouter;