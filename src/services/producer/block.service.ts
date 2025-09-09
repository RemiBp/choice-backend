import { BadRequestError } from "../../errors/badRequest.error";
import { NotFoundError } from "../../errors/notFound.error";
import { BlockRepository, UserRepository } from "../../repositories";
import { CreateBlockInput } from "../../validators/producer/block.validation";

export const createBlock = async (userId: number, input: CreateBlockInput) => {
  if (userId === input.blockedUserId) {
    throw new BadRequestError("You cannot block yourself");
  }

  const blocker = await UserRepository.findOne({ where: { id: userId } });
  if (!blocker) throw new NotFoundError("Blocker user not found");

  const blockedUser = await UserRepository.findOne({ where: { id: input.blockedUserId } });
  if (!blockedUser) throw new NotFoundError("User to block not found");

  const existing = await BlockRepository.findOne({
    where: { blockerId: userId, blockedUserId: input.blockedUserId },
  });
  if (existing) throw new BadRequestError("You already blocked this user");

  const newBlock = await BlockRepository.save({
    blockerId: userId,
    blockedUserId: input.blockedUserId,
  });

  return newBlock;
};

export const getMyBlocks = async (userId: number) => {
  return await BlockRepository.find({
    where: { blockerId: userId },
    relations: ["blockedUser"],
  });
};

export const unblockUser = async (blockId: number, userId: number) => {
  const block = await BlockRepository.findOne({
    where: { id: blockId, blockerId: userId },
  });
  if (!block) throw new Error("Block not found");

  return await BlockRepository.remove(block);
};

export * as BlockService from './block.service';