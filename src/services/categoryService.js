import { Category } from '../models/Category.js';
import { HttpError } from '../utils/HttpError.js';

const predefinedCategories = [
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Investment', type: 'income' },
  { name: 'Other Income', type: 'income' },
  { name: 'Housing', type: 'expense' },
  { name: 'Groceries', type: 'expense' },
  { name: 'Transportation', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Healthcare', type: 'expense' },
  { name: 'Dining', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Education', type: 'expense' },
  { name: 'Other Expense', type: 'expense' },
];

function serializeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    custom: Boolean(category.ownerId),
  };
}

async function ensurePredefinedCategories() {
  const operations = predefinedCategories.map(({ name, type }) => ({
    updateOne: {
      filter: {
        ownerId: { $exists: false },
        normalizedName: name.toLowerCase(),
        type,
      },
      update: {
        $setOnInsert: { name, normalizedName: name.toLowerCase(), type },
      },
      upsert: true,
    },
  }));

  await Category.bulkWrite(operations, { ordered: false });
}

export async function listCategories(userId) {
  await ensurePredefinedCategories();

  const categories = await Category.find({
    $or: [
      { ownerId: { $exists: false } },
      { ownerId: userId },
    ],
  }).sort({ type: 1, name: 1 });

  return categories.map(serializeCategory);
}

export async function createCategory(userId, { name, type }) {
  const normalizedName = name.toLowerCase();
  try {
    const category = await Category.create({
      name,
      normalizedName,
      type,
      ownerId: userId,
    });

    return serializeCategory(category);
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(409, 'A category with this name and type already exists');
    }

    throw error;
  }
}

export async function findAvailableCategory(categoryId, userId) {
  return Category.findOne({
    _id: categoryId,
    $or: [
      { ownerId: { $exists: false } },
      { ownerId: userId },
    ],
  });
}
