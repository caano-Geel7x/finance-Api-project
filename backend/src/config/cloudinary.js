import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';

export function getCloudinaryClient() {
  const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = config;

  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    const error = new Error('Image upload service is not configured');
    error.status = 503;
    throw error;
  }

  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
    secure: true,
  });

  return cloudinary;
}
