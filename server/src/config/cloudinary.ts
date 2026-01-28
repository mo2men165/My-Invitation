// server/src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

export const configureCloudinary = (): void => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      logger.warn('Cloudinary credentials missing - image uploads disabled');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true // Use HTTPS
    });

    logger.info('Cloudinary configured');
  } catch (error) {
    logger.error('Cloudinary configuration failed:', error);
    throw error;
  }
};

export { cloudinary };

