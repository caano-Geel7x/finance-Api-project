import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';

const jwtIssuer = 'personal-finance-tracker-api';

export function assertJwtSecret() {
  if (!config.jwtSecret || Buffer.byteLength(config.jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes');
  }

  return config.jwtSecret;
}

export function createAccessToken(userId) {
  return jwt.sign({}, assertJwtSecret(), {
    algorithm: 'HS256',
    subject: userId.toString(),
    issuer: jwtIssuer,
    expiresIn: '15m',
  });
}

export async function authenticate(request, _response, next) {
  const authorization = request.get('authorization');
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);

  if (!match) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }

  let tokenPayload;
  const secret = assertJwtSecret();
  try {
    tokenPayload = jwt.verify(match[1], secret, {
      algorithms: ['HS256'],
      issuer: jwtIssuer,
    });
  } catch {
    next(new HttpError(401, 'Invalid or expired access token'));
    return;
  }

  const user = await User.findById(tokenPayload.sub)
    .select('name email role profilePictureUrl');

  if (!user) {
    next(new HttpError(401, 'Invalid or expired access token'));
    return;
  }

  request.user = user;
  next();
}

export function requireAdmin(request, _response, next) {
  if (request.user?.role !== 'admin') {
    next(new HttpError(403, 'Administrator access required'));
    return;
  }

  next();
}
