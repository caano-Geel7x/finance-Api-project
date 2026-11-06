import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { assertJwtSecret, createAccessToken } from '../middleware/authenticate.js';
import { HttpError } from '../utils/HttpError.js';

const passwordCost = 12;

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl,
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

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user.id),
  };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordMatches) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user.id),
  };
}

export function getProfile(user) {
  return toPublicUser(user);
}
