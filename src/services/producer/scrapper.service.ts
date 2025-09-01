import { NotFoundError } from '../../errors/notFound.error';
import { PhotoRepository, ProducerRepository } from '../../repositories';
import s3Service from '../s3.service';

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


export * as ScrapperService from './scrapper.service';