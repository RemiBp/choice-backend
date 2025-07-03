import { S3 } from '../factories/s3.factory';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from 'dotenv';

config();

const bucketName = process.env.AWS_S3_BUCKET_NAME || '';

export const getPresignedUploadUrl = async (
  filename: string,
  contentType: string,
  ACL: boolean,
  purpose: string
) => {
  try {
    const keyName = `${Date.now()}_${filename}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${purpose}/${keyName}`,
      ACL: ACL ? 'public-read' : 'private',
      ContentType: contentType,
    });
    const url = await getSignedUrl(S3, command, { expiresIn: 3600 });
    const s3BucketUri = process.env.S3_BUCKET_URI;
    return { url, keyName: `${s3BucketUri}${purpose}/${keyName}` };
  } catch (error) {
    throw error;
  }
};
