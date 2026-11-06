import * as authService from '../services/authService.js';

export async function register(request, response) {
  const result = await authService.register(request.body);
  response.status(201).json(result);
}

export async function login(request, response) {
  const result = await authService.login(request.body);
  response.status(200).json(result);
}

export function profile(request, response) {
  response.status(200).json({ user: authService.getProfile(request.user) });
}
