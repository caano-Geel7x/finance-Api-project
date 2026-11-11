import * as authService from '../services/authService.js';
import {
  clearRefreshCookie,
  getRefreshCookie,
  setRefreshCookie,
} from '../utils/refreshCookie.js';

export async function register(request, response) {
  const result = await authService.register(request.body);
  setRefreshCookie(response, result.refreshToken);
  const { refreshToken: _refreshToken, ...authResponse } = result;
  response.status(201).json(authResponse);
}

export async function login(request, response) {
  const result = await authService.login(request.body);
  setRefreshCookie(response, result.refreshToken);
  const { refreshToken: _refreshToken, ...authResponse } = result;
  response.status(200).json(authResponse);
}

export function profile(request, response) {
  response.status(200).json({ user: authService.getProfile(request.user) });
}

export async function refresh(request, response) {
  try {
    const result = await authService.refreshSession(getRefreshCookie(request));
    setRefreshCookie(response, result.refreshToken);
    const { refreshToken: _refreshToken, ...authResponse } = result;
    response.status(200).json(authResponse);
  } catch (error) {
    if (error.status === 401) clearRefreshCookie(response);
    throw error;
  }
}

export async function logout(request, response) {
  try {
    await authService.revokeRefreshToken(getRefreshCookie(request));
  } finally {
    clearRefreshCookie(response);
  }
  response.status(204).end();
}
