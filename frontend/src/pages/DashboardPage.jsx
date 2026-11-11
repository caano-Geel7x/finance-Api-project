import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Plus } from 'lucide-react';
import api from '../lib/api.js';
import { errorMessage, formatCurrency, monthLabel } from '../lib/utils.js';
import { StatCard } from '../components/StatCard.jsx';
import { TransactionTable } from '../components/TransactionTable.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { ErrorMessage, LoadingState } from '../components/ui/feedback.jsx';

const chartColors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function DashboardPage() {
  const [now] = useState(() => new Date());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/transactions/monthly-summary', {
        params: { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 },
      }),
      api.get('/transactions', { params: { page: 1, limit: 5 } }),
    ])
      .then(([summaryResponse, transactionResponse]) => {
        if (active) {
          setData({
            summary: summaryResponse.data.summary,
            transactions: transactionResponse.data.transactions,
          });
        }
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError, 'Your dashboard could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [now]);

  if (loading) return <LoadingState />;

  const summary = data?.summary;
  const spending = summary?.spendingByCategory ?? [];
  const totals = [
    { name: 'Income', amount: Number(summary?.income ?? 0), fill: '#10b981' },
    { name: 'Expenses', amount: Number(summary?.expense ?? 0), fill: '#f43f5e' },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">YOUR MONEY AT A GLANCE</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">{monthLabel(now.getUTCFullYear(), now.getUTCMonth() + 1, { month: 'long', year: 'numeric' })} summary</p>
        </div>
        <Button asChild><Link to="/app/transactions"><Plus size={17} /> New transaction</Link></Button>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Monthly balance" value={summary.balance} kind="balance" description="Income minus expenses this month" />
          <StatCard label="Income" value={summary.income} kind="income" description="Money received this month" />
          <StatCard label="Expenses" value={summary.expense} kind="expense" description="Money spent this month" />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Income and expenses</CardTitle>
              <CardDescription>A quick comparison for this month</CardDescription>
            </div>
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">USD</span>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {totals.every((item) => item.amount === 0)
                ? <div className="grid h-full place-items-center text-sm text-slate-400">Add transactions to see your monthly overview.</div>
                : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={totals} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#eef1f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={72}>
                        {totals.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </div>
            <div className="mt-3 flex flex-wrap gap-5 text-xs text-slate-500">
              {totals.map((item) => <span className="flex items-center gap-2" key={item.name}><i className="size-2.5 rounded-full" style={{ backgroundColor: item.fill }} />{item.name}</span>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where your money goes</CardTitle>
            <CardDescription>Expense categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            {spending.length
              ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={spending} dataKey="amount" nameKey="category" innerRadius={52} outerRadius={78} paddingAngle={3}>
                          {spending.map((item, index) => <Cell key={item.categoryId} fill={chartColors[index % chartColors.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {spending.slice(0, 4).map((item, index) => (
                      <div className="flex items-center justify-between gap-3 text-sm" key={item.categoryId}>
                        <span className="flex min-w-0 items-center gap-2 text-slate-600"><i className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="truncate">{item.category}</span></span>
                        <span className="font-semibold text-slate-800">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )
              : <div className="grid min-h-56 place-items-center text-center text-sm text-slate-400">No expense categories to show yet.</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Your latest money activity</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/app/transactions">View all <ArrowRight size={15} /></Link></Button>
        </CardHeader>
        <TransactionTable transactions={data?.transactions ?? []} compact />
      </Card>
    </div>
  );
}
