import {
  ProducerRepository,
  WellnessRepository,
  ProducerServiceRepository,
  WellnessServiceRepository,
  WellnessServiceTypeRepository,
} from '../../repositories';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { CreateServiceInput } from '../../validators/producer/service.validation';
import { BusinessRole } from '../../enums/Producer.enum';

export const getServiceTypes = async (input: { userId: number }) => {
  const { userId } = input;

  const producer = await ProducerRepository.findOne({ where: { userId } });
  if (!producer) throw new NotFoundError("Producer not found");

  if (producer.type !== BusinessRole.WELLNESS) {
    throw new BadRequestError("Only wellness producers have service types");
  }

  const wellness = await WellnessRepository.findOne({
    where: { producerId: producer.id },
    relations: ["selectedServices", "selectedServices.serviceType"],
  });

  if (!wellness) {
    return {
      producerId: producer.id,
      serviceTypes: [],
    };
  }

  return {
    producerId: producer.id,
    serviceTypes: (wellness.selectedServices ?? []).map((s: { serviceType: { id: any; name: any; criteria: any; }; }) => ({
      id: s.serviceType.id,
      name: s.serviceType.name,
      criteria: s.serviceType.criteria,
    })),
  };
};

export const createService = async (userId: number, data: CreateServiceInput) => {
  const producer = await ProducerRepository.findOne({ where: { userId } });
  if (!producer) throw new NotFoundError("Producer not found");

  if (producer.type !== BusinessRole.WELLNESS) {
    throw new BadRequestError("Only wellness producers can create services");
  }

  const wellness = await WellnessRepository.findOne({
    where: { producerId: producer.id },
    relations: ["selectedServices", "selectedServices.serviceType"],
  });
  if (!wellness) throw new NotFoundError("Wellness record not found for this producer");

  if (!data.serviceTypeId) throw new BadRequestError("Service type is required");

  const selectedService = wellness.selectedServices.find(
    (s: { serviceType: { id: number; }; }) => s.serviceType.id === data.serviceTypeId
  );
  if (!selectedService) {
    throw new BadRequestError("This service type was not selected during profile setup");
  }

  const exists = await ProducerServiceRepository.findOne({
    where: { wellnessId: wellness.id, serviceTypeId: data.serviceTypeId, isDeleted: false },
  });
  if (exists) {
    throw new BadRequestError("This service type already exists for your profile");
  }

  // ✅ Prevent duplicate slug (if provided)
  if (data.slug) {
    const slugExists = await ProducerServiceRepository.findOne({
      where: { slug: data.slug, isDeleted: false },
    });
    if (slugExists) {
      throw new BadRequestError("Slug already exists, please choose another");
    }
  }

  const newService = await ProducerServiceRepository.save({
    ...data,
    producerId: producer.id,
    wellnessId: wellness.id,
    serviceTypeId: data.serviceTypeId,
    isActive: true,
    isDeleted: false,
  });

  return {
    message: "Service created successfully.",
    service: newService,
  };
};

export const getAllServices = async (userId: number) => {
  const producer = await ProducerRepository.findOne({ where: { userId } });
  if (!producer) throw new NotFoundError("Producer not found");

  const wellness = await WellnessRepository.findOne({
    where: { producerId: producer.id },
  });
  if (!wellness) throw new NotFoundError("Wellness profile not found for this producer");

  const services = await ProducerServiceRepository.find({
    where: {
      wellnessId: wellness.id,
    },
    relations: ["serviceType"],
  });

  return services;
};

export const getServiceById = async (userId: number, serviceId: number) => {
  const producer = await ProducerRepository.findOne({ where: { userId } });
  if (!producer) throw new NotFoundError("Producer not found");

  const wellness = await WellnessRepository.findOne({ where: { producerId: producer.id } });
  if (!wellness) throw new NotFoundError("Wellness profile not found for this producer");

  const service = await ProducerServiceRepository.findOne({
    where: { id: serviceId, wellnessId: wellness.id, isDeleted: false },
    relations: ["serviceType", "wellness"],
  });

  if (!service) throw new NotFoundError("Service not found");

  return service;
};

export const updateService = async (userId: number, serviceId: number, data: Partial<CreateServiceInput>) => {
  const producer = await ProducerRepository.findOne({ where: { userId } });
  if (!producer) throw new NotFoundError("Producer not found");

  const wellness = await WellnessRepository.findOne({ where: { producerId: producer.id } });
  if (!wellness) throw new NotFoundError("Wellness profile not found for this producer");

  const service = await ProducerServiceRepository.findOne({
    where: { id: serviceId, wellnessId: wellness.id, isDeleted: false },
  });
  if (!service) throw new NotFoundError("Service not found");

  Object.assign(service, data);
  await ProducerServiceRepository.save(service);

  return {
    message: "Service updated successfully.",
    service,
  };
};

export const deleteService = async (userId: number, serviceId: number) => {
  const producer = await ProducerRepository.findOne({ where: { userId } });
  if (!producer) throw new NotFoundError("Producer not found");

  const wellness = await WellnessRepository.findOne({ where: { producerId: producer.id } });
  if (!wellness) throw new NotFoundError("Wellness profile not found for this producer");

  const service = await ProducerServiceRepository.findOne({
    where: { id: serviceId, wellnessId: wellness.id, isDeleted: false },
  });
  if (!service) throw new NotFoundError("Service not found");

  service.isDeleted = true;
  await ProducerServiceRepository.save(service);

  return {
    message: "Service deleted successfully.",
  };
};

export * as ServiceService from "./services.service";
