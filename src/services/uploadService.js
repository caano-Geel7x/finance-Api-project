import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import { getCloudinaryClient } from '../config/cloudinary.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';

const supportedImageFormats = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxFileSize = 5 * 1024 * 1024;

export async function detectSupportedImage(buffer) {
  const detectedType = await fileTypeFromBuffer(buffer);

  if (!detectedType || !supportedImageFormats.has(detectedType.mime)) {
    throw new HttpError(415, 'File content must be a JPEG, PNG, or WebP image');
  }

  return detectedType;
}

function uploadBuffer(cloudinary, buffer, format, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: 'image',
      folder: 'personal-finance/profile-pictures',
      public_id: `${userId}-${randomUUID()}`,
      format,
      allowed_formats: ['jpg', 'png', 'webp'],
      overwrite: false,
      transformation: [{ width: 512, height: 512, crop: 'limit' }],
    }, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

export async function updateProfilePicture(user, file) {
  if (file.size > maxFileSize) {
    throw new HttpError(413, 'Image must be 5 MB or smaller');
  }

  const detectedType = await detectSupportedImage(file.buffer);
  const cloudinary = getCloudinaryClient();
  const previousPublicId = await User.findById(user.id).select('+profilePicturePublicId');
  const uploaded = await uploadBuffer(cloudinary, file.buffer, detectedType.ext, user.id);

  try {
    const updateResult = await User.updateOne(
      { _id: user.id },
      {
        $set: {
          profilePictureUrl: uploaded.secure_url,
          profilePicturePublicId: uploaded.public_id,
        },
      },
    );
    if (updateResult.matchedCount !== 1) {
      throw new HttpError(404, 'User not found');
    }
  } catch (error) {
    try {
      await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: 'image' });
    } catch {
      console.error('New profile image cleanup failed after database update error');
    }
    throw error;
  }

  if (previousPublicId?.profilePicturePublicId) {
    try {
      const deletion = await cloudinary.uploader.destroy(
        previousPublicId.profilePicturePublicId,
        { resource_type: 'image' },
      );
      if (deletion.result !== 'ok' && deletion.result !== 'not found') {
        console.error('Previous profile image cleanup was not confirmed');
      }
    } catch {
      console.error('Previous profile image cleanup failed');
    }
  }

  return { profilePictureUrl: uploaded.secure_url };
}
