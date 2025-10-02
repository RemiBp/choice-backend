import { BookMarkRepository } from "../../repositories";
import { Not } from "typeorm";
import { ToggleBookmarkInput } from "../../validators/app/bookmark.validator";

export const toggleBookmark = async (userId: number, body: ToggleBookmarkInput) => {
  const { postId, producerId } = body;

  const where: any = { userId };
  if (postId) where.postId = postId;
  if (producerId) where.producerId = producerId;

  const existing = await BookMarkRepository.findOne({ where });

  if (existing) {
    await BookMarkRepository.remove(existing);
    return { bookmarked: false };
  }

  const bookmark = BookMarkRepository.create({ userId, postId, producerId });
  await BookMarkRepository.save(bookmark);
  return { bookmarked: true };
};

export const getBookmarkedPosts = async (userId: number) => {
  const bookmarks = await BookMarkRepository.find({
    where: { userId, postId: Not(null) },
    relations: ["post"],
    order: { createdAt: "DESC" },
  });

  return bookmarks.map((b: any) => ({
    id: b.id,
    createdAt: b.createdAt,
    post: b.post
      ? {
        id: b.post.id,
        description: b.post.description,
        coverImage: b.post.coverImage,
        type: b.post.type,
      }
      : null,
  }));
};

export const getBookmarkedProducers = async (userId: number) => {
  const bookmarks = await BookMarkRepository.find({
    where: { userId, producerId: Not(null) },
    relations: ["producer", "producer.photos"],
    order: { createdAt: "DESC" },
  });

  return bookmarks.map((b: any) => ({
    id: b.id,
    createdAt: b.createdAt,
    producer: b.producer
      ? {
        id: b.producer.id,
        name: b.producer.name,
        type: b.producer.type,
        city: b.producer.city,
        country: b.producer.country,
        photos: b.producer.photos?.map((p: any) => p.url) || [],
      }
      : null,
  }));
};

export * as BookmarkService from "./bookmark.service";
