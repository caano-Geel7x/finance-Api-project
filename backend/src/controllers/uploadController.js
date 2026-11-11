import { updateProfilePicture } from '../services/uploadService.js';

export async function profilePicture(request, response) {
  const result = await updateProfilePicture(request.user, request.file);
  response.status(200).json(result);
}
