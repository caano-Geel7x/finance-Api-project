import { getOverview } from '../services/adminService.js';

export async function overview(_request, response) {
  response.status(200).json({ overview: await getOverview() });
}
