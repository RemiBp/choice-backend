import { Request, Response, NextFunction } from "express";
import { LeisureRepository, RestaurantRatingRepository, WellnessRepository } from "../../repositories";
import { sendApiResponse } from "../../utils/sendApiResponse";
import { NotFoundError } from "../../errors/notFound.error";
import { z } from "zod";
import { BadRequestError } from "../../errors/badRequest.error";
import { ScrapperService } from "../../services/producer/scrapper.service";
import { presignedURLSchema } from "../../validators/producer/profile.validation";
import { LeisureAIRatingSchema, RestaurantAIRatingSchema, WellnessAIRatingSchema } from "../../validators/producer/scrapper.validation";


export const saveRestaurantAIRating = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const producerId = Number(req.params.producerId);
        const parsed = RestaurantAIRatingSchema.parse(req.body);

        const restaurant = await RestaurantRatingRepository.findOne({ where: { producerId } });
        if (!restaurant) throw new NotFoundError("Restaurant profile not found");

        Object.assign(restaurant, parsed);
        const saved = await RestaurantRatingRepository.save(restaurant);

        return sendApiResponse(res, 200, "Restaurant AI ratings updated successfully", saved);
    } catch (err) {
        next(err);
    }
};


export const saveLeisureAIRating = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const producerId = Number(req.params.producerId);
        const parsed = LeisureAIRatingSchema.parse(req.body);

        const leisure = await LeisureRepository.findOne({ where: { producerId } });
        if (!leisure) throw new NotFoundError("Leisure profile not found");

        Object.assign(leisure, parsed);
        const saved = await LeisureRepository.save(leisure);

        return sendApiResponse(res, 200, "Leisure AI ratings updated successfully", saved);
    } catch (err) {
        next(err);
    }
};

export const saveWellnessAIRating = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const producerId = Number(req.params.producerId);
        const parsed = WellnessAIRatingSchema.parse(req.body);

        const wellness = await WellnessRepository.findOne({ where: { producerId } });
        if (!wellness) throw new NotFoundError("Wellness profile not found");

        Object.assign(wellness, parsed);
        const saved = await WellnessRepository.save(wellness);

        return sendApiResponse(res, 200, "Wellness AI ratings updated successfully", saved);
    } catch (err) {
        next(err);
    }
};

export const getPreSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = presignedURLSchema.parse(req.body);

        const { fileName, contentType, folderName } = validatedData;

        const { url, keyName } = await ScrapperService.getPreSignedUrl({
            fileName,
            contentType,
            folderName: folderName || "scraping/gallery",
        });

        res.status(200).json({ url, keyName });
    } catch (error) {
        next(error);
    }
};

export const setGalleryImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { producerId, images } = req.body;

    if (!producerId) {
      throw new BadRequestError("producerId is required");
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new BadRequestError("images array is required");
    }

    await ScrapperService.setGalleryImages(Number(producerId), images);

    res.status(200).json({ message: "Gallery images saved successfully" });
  } catch (error) {
    next(error);
  }
};


export * as ScrapperController from './scrapper.controller';