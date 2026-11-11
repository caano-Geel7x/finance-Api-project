import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileBarChart } from 'lucide-react';
import api from '../lib/api.js';
import { errorMessage, formatCurrency, monthLabel } from '../lib/utils.js';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { ErrorMessage, LoadingState } from '../components/ui/feedback.jsx';
import { StatCard } from '../components/StatCard.jsx';

function dateBound(value, endOfDay = false) {
  return `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`;
}

function AxisTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      {payload.map((item) => <p className="text-sm font-semibold text-slate-800" key={item.dataKey}>{item.name}: {formatCurrency(item.value)}</p>)}
    </div>
  );
}

export default function ReportsPage() {
  const today = new Date();
  const [monthValue, setMonthValue] = useState(`${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`);
  const [trends, setTrends] = useState([]);
  const [days, setDays] = useState([]);
  const [range, setRange] = useState({
    from: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)).toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });
  const [rangeSummary, setRangeSummary] = useState(null);
  const [rangeType, setRangeType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    const [year, month] = monthValue.split('-').map(Number);
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/transactions/reports/monthly-trends'),
      api.get('/transactions/reports/daily-breakdown', { params: { year, month } }),
    ])
      .then(([trendResponse, dailyResponse]) => {
        if (active) {
          setTrends(trendResponse.data.trends.months.map((item) => ({
            ...item,
            label: monthLabel(item.year, item.month),
            incomeValue: Number(item.income),
            expenseValue: Number(item.expense),
          })));
          setDays(dailyResponse.data.breakdown.days.map((item) => ({
            ...item,
            label: item.date.slice(-2),
            incomeValue: Number(item.income),
            expenseValue: Number(item.expense),
          })));
        }
      })
      .catch((requestError) => { if (active) setError(errorMessage(requestError, 'Reports could not be loaded.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [monthValue]);

  async function loadRange(event) {
    event.preventDefault();
    setError('');
    setRangeSummary(null);
    setRangeLoading(true);
    try {
      const params = {
        from: dateBound(range.from),
        to: dateBound(range.to, true),
      };
      const { data } = await api.get('/transactions/reports/custom-range', { params });
      setRangeSummary(data.summary);
    } catch (requestError) {
      setError(errorMessage(requestError, 'The selected date range could not be loaded.'));
    } finally {
      setRangeLoading(false);
    }
  }

  async function exportRange() {
    setError('');
    setExporting(true);
    try {
      const params = {
        from: dateBound(range.from),
        to: dateBound(range.to, true),
        ...(rangeType ? { type: rangeType } : {}),
      };
      const { data } = await api.get('/transactions/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'finance-transactions.csv';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(errorMessage(requestError, 'The CSV report could not be downloaded.'));
    } finally {
      setExporting(false);
    }
  }

  const [year, month] = monthValue.split('-').map(Number);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-indigo-600">YOUR FINANCIAL STORY</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Explore trends, daily activity, and a date range that matters to you.</p>
      </div>
      <ErrorMessage>{error}</ErrorMessage>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><CardTitle>12-month trends</CardTitle><CardDescription>Monthly income and expense comparison.</CardDescription></div>
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">Last 12 months</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <LoadingState label="Loading your trends…" /> : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef1f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} />
                  <Tooltip content={<AxisTooltip />} />
                  <Bar dataKey="incomeValue" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenseValue" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><CardTitle>Daily breakdown</CardTitle><CardDescription>Income and spending by day for the selected month.</CardDescription></div>
            <input aria-label="Select report month" type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <LoadingState label="Loading daily totals…" /> : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef1f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} />
                  <Tooltip content={<AxisTooltip />} />
                  <Bar dataKey="incomeValue" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenseValue" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">{monthLabel(year, month, { month: 'long', year: 'numeric' })} · All dates use the server’s UTC calendar.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom date range</CardTitle>
          <CardDescription>Review a period and download its matching transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={loadRange} className="grid gap-3 sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end">
            <label className="space-y-2 text-sm font-medium text-slate-700">From<input required type="date" value={range.from} onChange={(event) => { setRange({ ...range, from: event.target.value }); setRangeSummary(null); }} className="block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal" /></label>
            <label className="space-y-2 text-sm font-medium text-slate-700">To<input required type="date" value={range.to} onChange={(event) => { setRange({ ...range, to: event.target.value }); setRangeSummary(null); }} className="block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal" /></label>
            <label className="space-y-2 text-sm font-medium text-slate-700">CSV export type<select value={rangeType} onChange={(event) => setRangeType(event.target.value)} className="block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal"><option value="">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select></label>
            <Button type="submit" disabled={rangeLoading}><FileBarChart size={16} /> {rangeLoading ? 'Loading…' : 'Show report'}</Button>
          </form>

          {rangeSummary && (
            <div className="mt-6 space-y-5 border-t border-slate-100 pt-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Range balance" value={rangeSummary.balance} kind="balance" description="Income after expenses" />
                <StatCard label="Range income" value={rangeSummary.income} kind="income" description="Money received" />
                <StatCard label="Range expenses" value={rangeSummary.expense} kind="expense" description="Money spent" />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Spending by category</p>
                  <p className="text-xs text-slate-500">Expense categories for the selected dates.</p>
                </div>
                <Button variant="outline" onClick={exportRange} disabled={exporting}><Download size={16} /> {exporting ? 'Preparing CSV…' : 'Download CSV'}</Button>
              </div>
              {rangeSummary.spendingByCategory.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rangeSummary.spendingByCategory.map((category) => (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3" key={category.categoryId}>
                      <span className="truncate text-sm text-slate-600">{category.category}</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(category.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">No expenses in the selected range.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
