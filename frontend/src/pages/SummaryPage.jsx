import { useEffect, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import api from '../lib/api.js';
import { errorMessage, formatCurrency } from '../lib/utils.js';
import { StatCard } from '../components/StatCard.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { ErrorMessage, LoadingState } from '../components/ui/feedback.jsx';

const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function SummaryPage() {
  const today = new Date();
  const [monthValue, setMonthValue] = useState(`${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const [year, month] = monthValue.split('-').map(Number);
    let active = true;
    setLoading(true);
    setError('');
    api.get('/transactions/monthly-summary', { params: { year, month } })
      .then(({ data }) => { if (active) setSummary(data.summary); })
      .catch((requestError) => { if (active) setError(errorMessage(requestError, 'The monthly summary could not be loaded.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [monthValue]);

  const spending = summary?.spendingByCategory ?? [];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">MONTHLY REVIEW</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Financial summary</h1>
          <p className="mt-1 text-sm text-slate-500">See what came in, what went out, and how the month ended.</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="summary-month" className="text-sm font-medium text-slate-600">Month</label>
          <input id="summary-month" type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm" />
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingState label="Preparing your monthly summary…" /> : summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Balance" value={summary.balance} kind="balance" description="Income after expenses" />
            <StatCard label="Income" value={summary.income} kind="income" description="Total money received" />
            <StatCard label="Expenses" value={summary.expense} kind="expense" description="Total money spent" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Spending breakdown</CardTitle>
              <CardDescription>Expenses grouped by category for the selected month.</CardDescription>
            </CardHeader>
            <CardContent>
              {spending.length ? (
                <div className="grid items-center gap-8 md:grid-cols-[minmax(240px,0.8fr)_1fr]">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={spending} dataKey="amount" nameKey="category" innerRadius={75} outerRadius={112} paddingAngle={3}>
                          {spending.map((item, index) => <Cell key={item.categoryId} fill={colors[index % colors.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {spending.map((item, index) => (
                      <div key={item.categoryId} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
                        <span className="flex items-center gap-3 text-sm text-slate-600"><i className="size-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />{item.category}</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="py-16 text-center text-sm text-slate-400">There are no expenses for this month yet.</div>}
            </CardContent>
          </Card>
        </>
      )}
      {!loading && !error && !summary && <Button onClick={() => setMonthValue(`${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`)}>Try again</Button>}
    </div>
  );
}
