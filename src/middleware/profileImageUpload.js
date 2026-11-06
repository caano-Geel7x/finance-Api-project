import multer from 'multer';
import { HttpError } from '../utils/HttpError.js';

const maxFileSize = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isAllowedImageMimeType(mimeType) {
  return allowedMimeTypes.has(mimeType);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
    files: 1,
    fields: 0,
    parts: 1,
  },
  fileFilter(_request, file, callback) {
    if (!isAllowedImageMimeType(file.mimetype)) {
      callback(new HttpError(415, 'Only JPEG, PNG, or WebP images are allowed'));
      return;
    }

    callback(null, true);
  },
});

export function uploadProfileImage(request, response, next) {
  upload.single('image')(request, response, (error) => {
    if (error) {
      next(error);
      return;
    }

    if (!request.file) {
      next(new HttpError(400, 'An image file is required'));
      return;
    }

    next();
  });
}

export const profileImageConstraints = Object.freeze({
  maxFileSize,
  allowedMimeTypes,
});
