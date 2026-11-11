import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { assertJwtSecret, createAccessToken } from '../middleware/authenticate.js';
import { HttpError } from '../utils/HttpError.js';

const passwordCost = 12;
const refreshTokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl,
  };
}

function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function createRefreshToken(userId) {
  const token = randomBytes(32).toString('base64url');
  await RefreshToken.create({
    userId,
    tokenHash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
  });
  return token;
}

async function createSession(user) {
  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user.id),
    refreshToken: await createRefreshToken(user.id),
  };
}

export async function register({ name, email, password }) {
  assertJwtSecret();
  const passwordHash = await bcrypt.hash(password, passwordCost);
  let user;

  try {
    user = await User.create({ name, email, passwordHash });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    throw error;
  }

  return createSession(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordMatches) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return createSession(user);
}

export function getProfile(user) {
  return toPublicUser(user);
}

export async function refreshSession(token) {
  if (!token) {
    throw new HttpError(401, 'Refresh token is required');
  }

  const refreshToken = await RefreshToken.findOneAndDelete({
    tokenHash: hashRefreshToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!refreshToken) {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(refreshToken.userId);
  if (!user) {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  return createSession(user);
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  await RefreshToken.deleteOne({ tokenHash: hashRefreshToken(token) });
}
