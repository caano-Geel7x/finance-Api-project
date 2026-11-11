import { useCallback, useEffect, useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import api from '../lib/api.js';
import { errorMessage } from '../lib/utils.js';
import { TransactionDialog } from '../components/TransactionDialog.jsx';
import { TransactionTable } from '../components/TransactionTable.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { ErrorMessage, LoadingState } from '../components/ui/feedback.jsx';
import { Select } from '../components/ui/input.jsx';

function dateBound(value, endOfDay = false) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ type: '', categoryId: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 20,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.from ? { from: dateBound(filters.from) } : {}),
        ...(filters.to ? { to: dateBound(filters.to, true) } : {}),
      };
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Transactions could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data.categories))
      .catch((requestError) => setError(errorMessage(requestError, 'Categories could not be loaded.')));
  }, []);

  useEffect(() => { loadTransactions(1); }, [loadTransactions]);

  async function saveTransaction(values) {
    try {
      if (editing) await api.put(`/transactions/${editing.id}`, values);
      else await api.post('/transactions', values);
      setEditing(null);
      await loadTransactions(pagination.page);
    } catch (requestError) {
      throw new Error(errorMessage(requestError, 'Transaction could not be saved.'));
    }
  }

  async function deleteTransaction(transaction) {
    if (!window.confirm(`Delete “${transaction.title}”? This cannot be undone.`)) return;
    setError('');
    try {
      await api.delete(`/transactions/${transaction.id}`);
      const nextPage = transactions.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      await loadTransactions(nextPage);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Transaction could not be deleted.'));
    }
  }

  async function exportCurrentPageFilters() {
    setError('');
    try {
      const params = {
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.from ? { from: dateBound(filters.from) } : {}),
        ...(filters.to ? { to: dateBound(filters.to, true) } : {}),
      };
      const { data } = await api.get('/transactions/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'transactions.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(errorMessage(requestError, 'The CSV export could not be downloaded.'));
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">YOUR ACTIVITY</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">{pagination.total} transactions in your account</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCurrentPageFilters}><Download size={16} /> Export CSV</Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus size={17} /> Add transaction</Button>
        </div>
      </div>
      <ErrorMessage>{error}</ErrorMessage>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Search size={16} /> Filter transactions</div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Select aria-label="Filter by transaction type" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </Select>
            <Select aria-label="Filter by category" value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
              <option value="">All categories</option>
              {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </Select>
            <input aria-label="From date" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
            <input aria-label="To date" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
          </div>
        </div>
        {loading ? <LoadingState label="Loading transactions…" /> : (
          <TransactionTable
            transactions={transactions}
            onEdit={(transaction) => { setEditing(transaction); setDialogOpen(true); }}
            onDelete={deleteTransaction}
          />
        )}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => loadTransactions(pagination.page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => loadTransactions(pagination.page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
        categories={categories}
        onSave={saveTransaction}
      />
    </div>
  );
}
