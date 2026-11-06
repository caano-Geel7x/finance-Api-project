import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { findAvailableCategory } from './categoryService.js';
import { HttpError } from '../utils/HttpError.js';

export function buildOwnedTransactionFilter(ownerId, transactionId) {
  return { _id: transactionId, ownerId };
}

function serializeTransaction(transaction) {
  return {
    id: transaction.id,
    title: transaction.title,
    amount: transaction.amount.toString(),
    type: transaction.type,
    category: transaction.categoryId && typeof transaction.categoryId === 'object'
      ? {
          id: transaction.categoryId.id,
          name: transaction.categoryId.name,
          type: transaction.categoryId.type,
        }
      : transaction.categoryId.toString(),
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

async function assertCategoryMatches(categoryId, userId, type) {
  const category = await findAvailableCategory(categoryId, userId);

  if (!category) {
    throw new HttpError(400, 'Category is not available');
  }

  if (category.type !== type) {
    throw new HttpError(400, 'Category type must match transaction type');
  }

  return category;
}

export async function createTransaction(userId, input) {
  await assertCategoryMatches(input.categoryId, userId, input.type);

  const transaction = await Transaction.create({
    ...input,
    amount: mongoose.Types.Decimal128.fromString(input.amount),
    categoryId: input.categoryId,
    date: new Date(input.date),
    ownerId: userId,
  });

  await transaction.populate('categoryId', 'name type');
  return serializeTransaction(transaction);
}

export async function listTransactions(userId, query) {
  const filter = { ownerId: userId };
  if (query.type) filter.type = query.type;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }

  if (query.categoryId) {
    const category = await findAvailableCategory(query.categoryId, userId);
    if (!category) throw new HttpError(404, 'Category not found');
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('categoryId', 'name type'),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions: transactions.map(serializeTransaction),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function updateTransaction(userId, transactionId, changes) {
  const transaction = await Transaction.findOne(
    buildOwnedTransactionFilter(userId, transactionId),
  );
  if (!transaction) throw new HttpError(404, 'Transaction not found');

  const nextType = changes.type ?? transaction.type;
  const nextCategoryId = changes.categoryId ?? transaction.categoryId;
  await assertCategoryMatches(nextCategoryId, userId, nextType);

  const update = { ...changes };
  if (changes.amount) {
    update.amount = mongoose.Types.Decimal128.fromString(changes.amount);
  }
  if (changes.date) update.date = new Date(changes.date);

  const updated = await Transaction.findOneAndUpdate(
    buildOwnedTransactionFilter(userId, transactionId),
    { $set: update },
    { new: true, runValidators: true },
  ).populate('categoryId', 'name type');

  return serializeTransaction(updated);
}

export async function deleteTransaction(userId, transactionId) {
  const deleted = await Transaction.findOneAndDelete(
    buildOwnedTransactionFilter(userId, transactionId),
  );

  if (!deleted) throw new HttpError(404, 'Transaction not found');
}

export async function getMonthlySummary(userId, { year, month }) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [totals, categories] = await Promise.all([
    Transaction.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: null,
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', mongoose.Types.Decimal128.fromString('0')],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', mongoose.Types.Decimal128.fromString('0')],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          income: { $toString: '$income' },
          expense: { $toString: '$expense' },
          balance: { $toString: { $subtract: ['$income', '$expense'] } },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      {
        $lookup: {
          from: Category.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          category: '$category.name',
          amount: { $toString: '$total' },
        },
      },
    ]),
  ]);

  return {
    year,
    month,
    income: totals[0]?.income ?? '0',
    expense: totals[0]?.expense ?? '0',
    balance: totals[0]?.balance ?? '0',
    spendingByCategory: categories,
  };
}
