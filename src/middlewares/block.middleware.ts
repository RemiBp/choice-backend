import { Request, Response, NextFunction } from "express";
import { BlockRepository } from "../repositories";
import Block from "../models/Block";

export const attachBlockedUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUserId = Number(req.userId);

    const blocks = await BlockRepository.find({
      where: [
        { blockerId: currentUserId },
        { blockedUserId: currentUserId },
      ],
    });

    const blockedIds =
      blocks?.map((b: Block) =>
        b.blockerId === currentUserId ? b.blockedUserId : b.blockerId
      ) || [];

    req.blockedUserIds = blockedIds.length > 0 ? blockedIds : [];

    next();
  } catch (err) {
    console.error("Error in attachBlockedUsers middleware:", err);
    return res.status(500).json({ message: "Failed to process block list" });
  }
};
