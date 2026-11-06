import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 120,
  },
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    validate: {
      validator(value) {
        return value && Number(value.toString()) > 0;
      },
      message: 'Amount must be greater than zero',
    },
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
  },
}, {
  timestamps: true,
  strict: 'throw',
});

transactionSchema.index({ ownerId: 1, date: -1 });
transactionSchema.index({ ownerId: 1, type: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
