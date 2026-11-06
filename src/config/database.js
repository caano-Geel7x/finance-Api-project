import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('strictQuery', true);

export async function connectToDatabase(uri = config.mongoUri) {
  if (!uri) {
    throw new Error('MONGODB_URI is required to start the API');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
}
