// server/src/config/multer.ts
import multer from 'multer';
import { CloudinaryService } from '../services/cloudinaryService';
import { MulterFile } from '../types/multer';

// Configure multer to store files in memory (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter to only accept images
const fileFilter = (req: any, file: MulterFile, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single file upload
  }
});

// Middleware for single image upload
export const uploadSingleImage = upload.single('image');

// Middleware for multiple images (if needed in the future)
export const uploadMultipleImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Max 10 files
  }
}).array('images', 10);

