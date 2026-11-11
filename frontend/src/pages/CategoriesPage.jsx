import { useEffect, useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import api from '../lib/api.js';
import { errorMessage } from '../lib/utils.js';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { ErrorMessage, LoadingState } from '../components/ui/feedback.jsx';
import { Field, Input, Select } from '../components/ui/input.jsx';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [values, setValues] = useState({ name: '', type: 'expense' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    setError('');
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Categories could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCategories(); }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.post('/categories', values);
      setValues({ ...values, name: '' });
      setSuccess('Your category has been added.');
      await loadCategories();
    } catch (requestError) {
      setError(errorMessage(requestError, 'This category could not be added.'));
    } finally {
      setSaving(false);
    }
  }

  const incomeCategories = categories.filter((category) => category.type === 'income');
  const expenseCategories = categories.filter((category) => category.type === 'expense');

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-indigo-600">MAKE IT YOURS</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Categories</h1>
        <p className="mt-1 text-sm text-slate-500">Organize income and expenses in a way that makes sense to you.</p>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

      <Card>
        <CardHeader><CardTitle>Create a category</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
            <Field label="Category name" htmlFor="category-name">
              <Input id="category-name" required minLength={1} maxLength={50} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="e.g. Pet care" />
            </Field>
            <Field label="Category type" htmlFor="category-type">
              <Select id="category-type" value={values.type} onChange={(event) => setValues({ ...values, type: event.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </Field>
            <Button type="submit" disabled={saving}><Plus size={16} /> {saving ? 'Adding…' : 'Add category'}</Button>
          </form>
        </CardContent>
      </Card>

      {loading ? <LoadingState label="Loading categories…" /> : (
        <div className="grid gap-5 lg:grid-cols-2">
          {[
            { title: 'Expense categories', list: expenseCategories, tone: 'bg-rose-50 text-rose-600' },
            { title: 'Income categories', list: incomeCategories, tone: 'bg-emerald-50 text-emerald-600' },
          ].map(({ title, list, tone }) => (
            <Card key={title}>
              <CardHeader><CardTitle>{title} <span className="ml-1 text-sm font-normal text-slate-400">({list.length})</span></CardTitle></CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {list.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}><Tag size={16} /></span>
                      <span className="truncate text-sm font-medium text-slate-700">{category.name}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${category.custom ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      {category.custom ? 'Custom' : 'Default'}
                    </span>
                  </div>
                ))}
                {!list.length && <p className="col-span-2 py-5 text-center text-sm text-slate-400">No categories found.</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
