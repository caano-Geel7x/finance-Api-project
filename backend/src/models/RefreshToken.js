import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    select: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0,
  },
}, {
  timestamps: true,
  strict: 'throw',
});

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
