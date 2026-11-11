import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils.js';
import { Button } from './ui/button.jsx';
import { EmptyState } from './ui/feedback.jsx';

export function TransactionTable({ transactions, onEdit, onDelete, compact = false }) {
  if (!transactions.length) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Add your first income or expense to start seeing your finances clearly."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[590px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-5 py-3 sm:px-6">Transaction</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Amount</th>
            {!compact && <th className="px-5 py-3 text-right sm:px-6">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((transaction) => {
            const income = transaction.type === 'income';
            const Icon = income ? ArrowDownLeft : ArrowUpRight;
            return (
              <tr key={transaction.id} className="group hover:bg-slate-50/80">
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${income ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      <Icon size={17} />
                    </span>
                    <span className="font-medium text-slate-800">{transaction.title}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-500">{transaction.category?.name ?? 'Category'}</td>
                <td className="px-4 py-4 text-slate-500">{formatDate(transaction.date, { month: 'short', day: 'numeric' })}</td>
                <td className={`px-4 py-4 text-right font-semibold ${income ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {income ? '+' : '−'}{formatCurrency(transaction.amount)}
                </td>
                {!compact && (
                  <td className="px-5 py-3 text-right sm:px-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(transaction)} aria-label={`Edit ${transaction.title}`}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="size-9 text-slate-400 hover:text-rose-600" onClick={() => onDelete(transaction)} aria-label={`Delete ${transaction.title}`}>
                        <MoreHorizontal size={18} />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
