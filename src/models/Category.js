import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  normalizedName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    select: false,
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'],
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: undefined,
  },
}, {
  timestamps: true,
  strict: 'throw',
});

categorySchema.index(
  { ownerId: 1, normalizedName: 1, type: 1 },
  { unique: true },
);

export const Category = mongoose.model('Category', categorySchema);
