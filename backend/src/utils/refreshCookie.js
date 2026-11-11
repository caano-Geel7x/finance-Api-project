import { config } from '../config/env.js';

const cookieOptions = Object.freeze({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  path: '/auth',
});

export function setRefreshCookie(response, token) {
  response.cookie('refreshToken', token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(response) {
  response.clearCookie('refreshToken', cookieOptions);
}

export function getRefreshCookie(request) {
  const cookieHeader = request.get('cookie') ?? '';
  const cookie = cookieHeader.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('refreshToken='));

  return cookie?.slice('refreshToken='.length) || null;
}
