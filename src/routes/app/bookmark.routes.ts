import { Router } from "express";
import { BookmarkController } from "../../controllers/app/bookmark.controller";
import { authenticateUserJWT, checkStatus } from "../../middlewares/auth.middleware";

const BookMarkRouter = Router();

BookMarkRouter.use(authenticateUserJWT);
BookMarkRouter.use(checkStatus);

BookMarkRouter.post("/toggleBookmark", BookmarkController.toggleBookmark);
BookMarkRouter.get("/myBookmark/posts", BookmarkController.getBookmarkedPosts);
BookMarkRouter.get("/myBookmark/producers", BookmarkController.getBookmarkedProducers);

export default BookMarkRouter;