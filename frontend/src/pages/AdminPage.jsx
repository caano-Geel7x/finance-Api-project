import { useEffect, useState } from 'react';
import { ShieldCheck, Users, WalletCards } from 'lucide-react';
import api from '../lib/api.js';
import { errorMessage, formatCurrency } from '../lib/utils.js';
import { useAuth } from '../contexts/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { ErrorMessage, LoadingState } from '../components/ui/feedback.jsx';

export default function AdminPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/admin/overview')
      .then(({ data }) => { if (active) setOverview(data.overview); })
      .catch((requestError) => { if (active) setError(errorMessage(requestError, 'Administrator data could not be loaded.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (user?.role !== 'admin') {
    return <ErrorMessage>Administrator access is required to view this page.</ErrorMessage>;
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-indigo-600">SYSTEM OVERVIEW</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Administration</h1>
        <p className="mt-1 text-sm text-slate-500">Aggregate platform insights. Individual users and transactions are not exposed here.</p>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingState label="Loading administrator overview…" /> : overview && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 pt-5 sm:pt-6">
                <span className="grid size-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Users size={21} /></span>
                <div><p className="text-sm text-slate-500">Registered users</p><p className="mt-1 text-2xl font-bold text-slate-900">{overview.totalUsers.toLocaleString()}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-5 sm:pt-6">
                <span className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck size={21} /></span>
                <div><p className="text-sm text-slate-500">Administrator role</p><p className="mt-1 text-lg font-bold text-slate-900">Restricted access</p></div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Top spending categories</CardTitle><CardDescription>Combined expense totals across the platform.</CardDescription></CardHeader>
            <CardContent>
              {overview.topSpendingCategories.length ? (
                <div className="divide-y divide-slate-100">
                  {overview.topSpendingCategories.map((category, index) => (
                    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0" key={category.categoryId}>
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><WalletCards size={16} /></span>
                        <span><span className="block text-xs text-slate-400">#{index + 1}</span><span className="font-medium text-slate-800">{category.name}</span></span>
                      </span>
                      <span className="font-semibold text-slate-900">{formatCurrency(category.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="py-8 text-center text-sm text-slate-400">No spending data is available yet.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
