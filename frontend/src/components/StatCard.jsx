import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { Card, CardContent } from './ui/card.jsx';
import { cn, formatCurrency } from '../lib/utils.js';

const icons = {
  balance: Wallet,
  income: ArrowUpRight,
  expense: ArrowDownRight,
};

const tones = {
  balance: 'bg-indigo-50 text-indigo-600',
  income: 'bg-emerald-50 text-emerald-600',
  expense: 'bg-rose-50 text-rose-600',
};

export function StatCard({ label, value, kind, description }) {
  const Icon = icons[kind] ?? Wallet;
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-5 sm:pt-6">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(value)}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className={cn('grid size-11 shrink-0 place-items-center rounded-xl', tones[kind] ?? tones.balance)}>
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  );
}
