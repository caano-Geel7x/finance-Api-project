import * as categoryService from '../services/categoryService.js';

export async function list(request, response) {
  const categories = await categoryService.listCategories(request.user.id);
  response.status(200).json({ categories });
}

export async function create(request, response) {
  const category = await categoryService.createCategory(request.user.id, request.body);
  response.status(201).json({ category });
}
