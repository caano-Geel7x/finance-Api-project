import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';

export async function getOverview() {
  const [totalUsers, topSpendingCategories] = await Promise.all([
    User.countDocuments(),
    Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1, _id: 1 } },
      { $limit: 5 },
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
          name: '$category.name',
          amount: { $toString: '$total' },
        },
      },
    ]),
  ]);

  return { totalUsers, topSpendingCategories };
}
