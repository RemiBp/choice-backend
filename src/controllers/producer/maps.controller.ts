import { MapsService } from '../../services/producer/maps.service';
import { sendApiResponse } from '../../utils/sendApiResponse';
import { ChoiceMapSchema, createOfferSchema, getFilteredRestaurantsSchema, GetProducerHeatmapSchema, GetProducerOffersSchema, NearbyProducersSchema, SendOfferNotificationSchema } from '../../validators/producer/maps.validation';
import { Request, Response, NextFunction } from 'express';

export const getNearbyProducers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const input = NearbyProducersSchema.parse(req.query);
        const data = await MapsService.getNearbyProducers(input);
        return sendApiResponse(res, 200, "Nearby producers fetched", data);
    } catch (err) {
        next(err);
    }
};

export const getNearbyUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const input = ChoiceMapSchema.parse(req.query);
        const data = await MapsService.getNearbyUsers(input);
        return sendApiResponse(res, 200, "Nearby users fetched successfully", data);
    } catch (err) {
        console.error("Error in getNearbyUsers controller:", err);
        next(err);
    }
};

export const createProducerOffer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = createOfferSchema.parse(req.body);
        const offer = await MapsService.createProducerOffer(validatedData);
        return sendApiResponse(res, 200, "Offer Created successfully", offer);
    } catch (err) {
        console.error("Error in createProducerOffer controller:", err);
        next(err);
    }
};

export const getOfferTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const producerId = Number(req.params.producerId);
        const data = await MapsService.getOfferTemplates(producerId);

        return sendApiResponse(res, 200, "Offer templates fetched successfully", data);
    } catch (err) {
        next(err);
    }
};

export const getProducerOffers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = GetProducerOffersSchema.parse(req);
        const { producerId } = parsed.params;

        const offers = await MapsService.getProducerOffers(producerId);
        return sendApiResponse(res, 200, "Producer offers fetched successfully", offers);
    } catch (err) {
        console.error("Error in getProducerOffersController:", err);
        next(err);
    }
};

export const getUserLiveOffers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.userId);
        const data = await MapsService.getUserLiveOffers(userId);
        sendApiResponse(res, 200, "Live offers fetched successfully", data);
    } catch (error) {
        next(error);
    }
};

export const getProducerDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const data = await MapsService.getProducerDetails(id);

        return sendApiResponse(res, 200, "Producers fetched successfully", data);
    } catch (err) {
        next(err);
    }
};

export const getProducerHeatmap = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = GetProducerHeatmapSchema.parse({
            producerId: Number(req.params.id),
        });

        const data = await MapsService.getProducerHeatmap(parsed);
        sendApiResponse(res, 200, "Heatmap data fetched successfully", data);
    } catch (error) {
        next(error);
    }
};

export const sendOfferNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = SendOfferNotificationSchema.parse(req.body);
        const response = await MapsService.sendOfferNotification(parsed);

        sendApiResponse(res, 200, "Offer notification sent successfully", response);
    } catch (error) {
        next(error);
    }
};

export * as MapsController from './maps.controller';