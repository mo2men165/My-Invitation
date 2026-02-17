// server/src/services/cloudinaryService.ts
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../config/logger';
import { Readable } from 'stream';
import { MulterFile } from '../types/multer';

// Lazy initialization state
let isCloudinaryConfigured = false;

/**
 * Ensures Cloudinary is configured before any operation.
 * Uses lazy initialization pattern for serverless compatibility.
 * Only configures once, subsequent calls are no-ops.
 */
function ensureCloudinaryConfigured(): void {
  if (isCloudinaryConfigured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const missing = [];
    if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
    
    logger.error('Cloudinary credentials missing:', { missing });
    throw new Error(`Cloudinary configuration failed: Missing ${missing.join(', ')}`);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  isCloudinaryConfigured = true;
  logger.info('Cloudinary configured (lazy initialization)');
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  allowed_formats?: string[];
  max_file_size?: number; // in bytes
  transformation?: any[];
  targetFormat?: 'png' | 'jpeg'; // Convert uploaded images to this format (default: 'jpeg')
}

export class CloudinaryService {
  /**
   * Upload a file buffer to Cloudinary
   */
  static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    // Ensure Cloudinary is configured (lazy initialization for serverless)
    ensureCloudinaryConfigured();
    
    try {
      const {
        folder = 'invitations',
        resource_type = 'image',
        allowed_formats = ['jpg', 'jpeg', 'png'],
        max_file_size = 10 * 1024 * 1024, // 10MB default
        transformation = [],
        targetFormat = 'jpeg' // Default to JPEG for better compression
      } = options;

      // Validate file size
      if (fileBuffer.length > max_file_size) {
        throw new Error(`File size exceeds maximum allowed size of ${max_file_size / 1024 / 1024}MB`);
      }

      // Prepare transformations - force format conversion in transformation array
      const uploadTransformations = [...transformation];
      uploadTransformations.push({ format: targetFormat }); // Force format conversion

      // Generate public_id with target format extension
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      const publicId = `${Date.now()}_${baseFileName}`;

      // Create a promise wrapper for the upload
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type,
            allowed_formats,
            transformation: uploadTransformations, // Force format conversion via transformations
            // Generate unique public_id from filename and timestamp
            public_id: publicId,
            overwrite: false,
            invalidate: true
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              logger.info('Cloudinary upload successful:', {
                public_id: result.public_id,
                url: result.secure_url,
                size: result.bytes
              });
              resolve({
                public_id: result.public_id,
                secure_url: result.secure_url || result.url || '',
                url: result.url || result.secure_url || '',
                format: result.format || '',
                width: result.width || 0,
                height: result.height || 0,
                bytes: result.bytes || 0,
                created_at: result.created_at || new Date().toISOString()
              });
            } else {
              reject(new Error('Upload completed but no result returned'));
            }
          }
        );

        // Convert buffer to stream and pipe to upload stream
        const bufferStream = Readable.from(fileBuffer);
        bufferStream.pipe(uploadStream);
      });
    } catch (error: any) {
      logger.error('Error uploading file to Cloudinary:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload a file from a path (for local files)
   */
  static async uploadFromPath(
    filePath: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    // Ensure Cloudinary is configured (lazy initialization for serverless)
    ensureCloudinaryConfigured();
    
    try {
      const {
        folder = 'invitations',
        resource_type = 'image',
        allowed_formats = ['jpg', 'jpeg', 'png'],
        transformation = [],
        targetFormat = 'jpeg' // Default to JPEG for better compression
      } = options;

      // Prepare transformations - force format conversion in transformation array
      const uploadTransformations = [...transformation];
      uploadTransformations.push({ format: targetFormat }); // Force format conversion

      // Generate public_id with target format extension
      const baseFileName = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'image';
      const publicId = `${Date.now()}_${baseFileName}`;

      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type,
        allowed_formats,
        transformation: uploadTransformations, // Force format conversion via transformations
        public_id: publicId,
        overwrite: false,
        invalidate: true
      });

      logger.info('Cloudinary upload successful:', {
        public_id: result.public_id,
        url: result.secure_url,
        size: result.bytes
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url || result.url || '',
        url: result.url || result.secure_url || '',
        format: result.format || '',
        width: result.width || 0,
        height: result.height || 0,
        bytes: result.bytes || 0,
        created_at: result.created_at || new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('Error uploading file to Cloudinary:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<void> {
    // Ensure Cloudinary is configured (lazy initialization for serverless)
    ensureCloudinaryConfigured();
    
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        logger.info('Cloudinary image deleted successfully:', { publicId });
      } else if (result.result === 'not found') {
        logger.warn('Cloudinary image not found for deletion:', { publicId });
      } else {
        logger.warn('Cloudinary deletion result:', { publicId, result: result.result });
      }
    } catch (error: any) {
      logger.error('Error deleting image from Cloudinary:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  static async deleteImages(publicIds: string[]): Promise<void> {
    // Ensure Cloudinary is configured (lazy initialization for serverless)
    ensureCloudinaryConfigured();
    
    try {
      if (publicIds.length === 0) return;

      const result = await cloudinary.api.delete_resources(publicIds, {
        type: 'upload',
        resource_type: 'image'
      });

      logger.info('Cloudinary bulk deletion completed:', {
        deleted: result.deleted,
        not_found: result.not_found
      });
    } catch (error: any) {
      logger.error('Error deleting images from Cloudinary:', error);
      throw new Error(`Failed to delete images: ${error.message}`);
    }
  }

  /**
   * Get image URL with transformations
   */
  static getImageUrl(publicId: string, transformations?: any[]): string {
    // Ensure Cloudinary is configured (lazy initialization for serverless)
    ensureCloudinaryConfigured();
    
    try {
      return cloudinary.url(publicId, {
        secure: true,
        transformation: transformations
      });
    } catch (error: any) {
      logger.error('Error generating Cloudinary URL:', error);
      throw new Error(`Failed to generate image URL: ${error.message}`);
    }
  }

  /**
   * Validate if a file is a valid image
   */
  static validateImageFile(file: MulterFile): { valid: boolean; error?: string } {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG فقط'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `حجم الملف كبير جداً. الحد الأقصى ${maxSize / 1024 / 1024} ميجابايت`
      };
    }

    return { valid: true };
  }
}

