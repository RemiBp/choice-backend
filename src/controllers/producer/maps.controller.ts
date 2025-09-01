import { MapsService } from '../../services/producer/maps.service';
import { sendApiResponse } from '../../utils/sendApiResponse';
import { ChoiceMapSchema, getFilteredRestaurantsSchema, NearbyProducersSchema } from '../../validators/producer/maps.validation';
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

export const getProducerDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const data = await MapsService.getProducerDetails(id);

        return sendApiResponse(res, 200, "Producers fetched successfully", data);
    } catch (err) {
        next(err);
    }
};

export * as MapsController from './maps.controller';