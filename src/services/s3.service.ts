import { S3 } from '../factories/s3.factory';
import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  NoSuchKey,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getCloudfrontSignedUrl } from '@aws-sdk/cloudfront-signer';
import dotenv from 'dotenv';
import fs from 'fs';
import { sign } from 'crypto';
import { BadRequestError } from '../errors/badRequest.error';

dotenv.config();

const bucketName = process.env.AWS_BUCKET;
const AWS_S3_URI = process.env.AWS_S3_URI;

const cloudfrontDistributionDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;

const allowedContentTypesForAudio = ['audio/m4a'];

const allowedContentTypesForAttachments = [
  'image/png',
  'image/gif',
  'image/jpeg',
  'image/svg+xml',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/x-patch',
  'application/pdf',
  // 'application/zip',
  // 'application/gzip',
  // 'application/x-gzip',
  // 'application/x-tar',
  // 'video/mp4',
  // 'video/quicktime',
  // 'video/webm',
];

async function getPresignedUploadUrlForAudio(
  filename: string,
  contentType: string,
  ACL: boolean,
  purpose: string
): Promise<{ url: string; keyName: string }> {
  try {
    console.log('getPresignedUploadUrlForAudio called', { filename, contentType, ACL, purpose }, 'S3Service');
    if (!allowedContentTypesForAudio.includes(contentType)) {
      throw new BadRequestError(`Content type ${contentType} is not allowed`);
    }

    filename = filename.replace(/\s/g, '');
    const keyName = `${Date.now()}${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${purpose}/${keyName}`,
      ACL: ACL ? 'public-read' : 'private',
      ContentType: contentType,
    });

    const url = await getSignedUrl(S3, command, { expiresIn: 3600 });

    return { url, keyName: `${purpose}/${keyName}` };
  } catch (error) {
    console.log('Error in getPresignedUrlForAudio', { error, filename, contentType, ACL, purpose }, 'S3Service');

    throw error;
  }
}

async function getPresignedUploadUrlForAttachments(
  filename: string,
  contentType: string,
  ACL: boolean,
  purpose: string
): Promise<{ url: string; keyName: string }> {
  try {
    console.log('getPresignedUploadUrlForAttachments called', { filename, contentType, ACL, purpose }, 'S3Service');

    if (!allowedContentTypesForAttachments.includes(contentType)) {
      throw new BadRequestError(`Content type ${contentType} is not allowed`);
    }

    filename = filename.replace(/\s/g, '');
    const keyName = `${Date.now()}${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${purpose}/${keyName}`,
      ACL: ACL ? 'public-read' : 'private',
      ContentType: contentType,
    });

    const url = await getSignedUrl(S3, command, { expiresIn: 3600 });

    return { url, keyName: `${purpose}/${keyName}` };
  } catch (error) {
    console.log(
      'Error in getPresignedUploadUrlForAttachments',
      { error, filename, contentType, ACL, purpose },
      'S3Service'
    );

    throw error;
  }
}

async function getPresignedDownloadUrl(key: string): Promise<string> {
  try {
    console.log('getPresignedDownloadUrl called', { key }, 'S3Service');

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename=\"${key}\"`,
    });

    const url = await getSignedUrl(S3, command);

    return url;
  } catch (error) {
    console.log('Error in getPresignedDownloadUrl', { error, key }, 'S3Service');

    throw error;
  }
}

async function deleteObject(key: string, retry = 0) {
  try {
    console.log('deleteObject called', { key }, 'S3Service');

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await S3.send(command);
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const file = await S3.send(getObjectCommand);

    if (file) {
      if (retry > 2) {
        throw new BadRequestError('Failed to delete file');
      }

      await deleteObject(key, retry + 1);
    }

    return { message: 'File deleted successfully' };
  } catch (error) {
    console.error('Error in deleteObject', { error, key }, 'S3Service');

    if (error instanceof NoSuchKey) {
      return { message: 'File has already been deleted' };
    }

    if (retry > 2) {
      await deleteObject(key, retry + 1);
    }

    console.error('Failed to delete object', { error, key }, 'S3Service');
  }
}

async function duplicateObject(key: string): Promise<string> {
  try {
    const [purpose, filename] = key.split('/');
    const slicedObjectName = filename.slice(13);
    const newKey = purpose + '/' + Date.now() + slicedObjectName;

    const command = new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${key}`,
      ACL: 'private',
      Key: newKey,
    });

    await S3.send(command);

    return newKey;
  } catch (error) {
    console.error('Error in duplicateObject', { error, key }, 'S3Service');

    throw error;
  }
}

async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  ACL: boolean,
  purpose: string
): Promise<{ url: string; keyName: string }> {
  try {
    console.log('getPresignedUploadUrl called', { filename, contentType, ACL, purpose }, 'S3Service');

    if (!allowedContentTypesForAttachments.includes(contentType)) {
      throw new BadRequestError(`Content type ${contentType} is not allowed`);
    }

    filename = filename.replace(/\s/g, '');
    const keyName = `${Date.now()}${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${purpose}/${keyName}`,
      ACL: ACL ? 'public-read' : 'private',
      ContentType: contentType,
    });

    const url = await getSignedUrl(S3, command, { expiresIn: 3600 });

    return { url, keyName: `${AWS_S3_URI}/${purpose}/${keyName}` };
  } catch (error) {
    console.log('Error in getPresignedUploadUrlForImage', { error, filename, contentType, ACL, purpose }, 'S3Service');

    throw error;
  }
}

async function getViewUrl(key: string): Promise<{ url: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: 'inline',
    });

    const url = await getSignedUrl(S3, command, { expiresIn: 3600 });
    return { url };
  } catch (error) {
    console.error('Error generating view-only presigned URL', { key, error });
    throw error;
  }
}

export default {
  getPresignedUploadUrlForAudio,
  getPresignedDownloadUrl,
  deleteObject,
  getPresignedUploadUrlForAttachments,
  duplicateObject,
  getPresignedUploadUrl,
  getViewUrl,
};
