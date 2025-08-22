import { NextFunction, Request, Response } from "express";
import { ServiceService } from "../../services/producer/services.service";
import { createServiceSchema } from "../../validators/producer/service.validation";

export const getServiceTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const result = await ServiceService.getServiceTypes({ userId: Number(userId) });

    res.status(200).json({
      message: "Selected service types fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) throw new Error("userId is required");

    const serviceData = createServiceSchema.parse(req.body);

    const result = await ServiceService.createService(userId, serviceData);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const services = await ServiceService.getAllServices(userId);

    res.status(200).json(services);
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) throw new Error("userId is required");

    const serviceId = parseInt(req.params.serviceId, 10);
    if (isNaN(serviceId)) throw new Error("Invalid service ID");

    const service = await ServiceService.getServiceById(userId, serviceId);

    res.status(200).json(service);
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) throw new Error("userId is required");

    const serviceId = parseInt(req.params.serviceId, 10);
    if (isNaN(serviceId)) throw new Error("Invalid service ID");

    const serviceData = createServiceSchema.partial().parse(req.body);

    const result = await ServiceService.updateService(userId, serviceId, serviceData);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) throw new Error("userId is required");

    const serviceId = parseInt(req.params.serviceId, 10);
    if (isNaN(serviceId)) throw new Error("Invalid service ID");

    const result = await ServiceService.deleteService(userId, serviceId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export * as ServiceController from "./service.controller";
