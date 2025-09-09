import { In } from 'typeorm';
import { BusinessRole } from '../../enums/Producer.enum';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { PhotoRepository, ProducerRepository, WellnessRepository, WellnessServiceRepository, WellnessServiceTypeRepository } from '../../repositories';
import s3Service from '../s3.service';
import { SetServiceTypeInput } from '../../validators/producer/scrapper.validation';
import WellnessServiceType from '../../models/WellnessServiceTypes';
import WellnessService from '../../models/WellnessServices';

export const getPreSignedUrl = async (input: {
  fileName: string;
  contentType: string;
  folderName?: string;
}) => {
  const { fileName, contentType, folderName } = input;

  const { url, keyName } = await s3Service.getPresignedUploadUrl(
    fileName,
    contentType,
    true,
    folderName ?? ''
  );

  return { url, keyName };
};

export const setGalleryImages = async (producerId: number, images: { url: string }[]) => {
  const producer = await ProducerRepository.findOne({ where: { id: producerId } });
  if (!producer) {
    throw new NotFoundError("Producer not found");
  }

  for (const img of images) {
    (img as any).producer = producer;
  }

  await PhotoRepository.save(images);

  return {
    message: "Gallery images saved successfully.",
    count: images.length,
  };
};

export const setServiceType = async (input: SetServiceTypeInput) => {
  const { producerId, serviceTypeIds } = input;

  // 1. Find producer
  const producer = await ProducerRepository.findOne({ where: { id: producerId } });
  if (!producer) throw new NotFoundError("Producer not found");
  if (producer.type !== BusinessRole.WELLNESS) {
    throw new BadRequestError("Only wellness producers can have service types");
  }

  // 2. Ensure wellness profile exists
  let wellness = await WellnessRepository.findOne({
    where: { producerId },
    relations: ["selectedServices", "selectedServices.serviceType"],
  });
  if (!wellness) {
    wellness = await WellnessRepository.save({ producerId });
  }

  // 3. Get already selected serviceTypeIds
  // const existingIds = (wellness.selectedServices ?? []).map(
  //   (s: any) => s.serviceType.id
  // );

  const existingIds = (wellness.selectedServices ?? []).map(
    (s: WellnessService) => s.serviceType.id
  );

  // 4. Filter out duplicates
  const newIds = serviceTypeIds.filter((id) => !existingIds.includes(id));
  if (newIds.length === 0) {
    return {
      producerId,
      serviceTypes: wellness.selectedServices ?? [],
    };
  }

  // 5. Validate only new IDs
  const validTypes = await WellnessServiceTypeRepository.find({ where: { id: In(newIds) } });
  if (validTypes.length !== newIds.length) {
    throw new BadRequestError("One or more serviceTypeIds are invalid");
  }

  // 6. Save only new ones
  // const saved = await WellnessServiceRepository.save(
  //   validTypes.map((type: any) => ({ wellness, serviceType: type }))
  // );

  const saved = await WellnessServiceRepository.save(
    validTypes.map((type: WellnessServiceType) => ({ wellness, serviceType: type }))
  );

  // 7. Merge and return updated services
  return {
    producerId,
    serviceTypes: [...(wellness.selectedServices ?? []), ...saved],
  };
};

export * as ScrapperService from './scrapper.service';