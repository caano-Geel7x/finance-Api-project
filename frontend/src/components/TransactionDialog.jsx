import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog.jsx';
import { Button } from './ui/button.jsx';
import { ErrorMessage } from './ui/feedback.jsx';
import { Field, Input, Select } from './ui/input.jsx';

function toLocalInput(date) {
  const localTime = new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 16);
}

function initialValues(transaction) {
  return {
    title: transaction?.title ?? '',
    amount: transaction?.amount ?? '',
    type: transaction?.type ?? 'expense',
    categoryId: transaction?.category?.id ?? '',
    date: toLocalInput(transaction?.date ?? new Date()),
  };
}

export function TransactionDialog({ open, onOpenChange, transaction, categories, onSave }) {
  const [values, setValues] = useState(() => initialValues(transaction));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === values.type),
    [categories, values.type],
  );

  useEffect(() => {
    if (open) {
      setValues(initialValues(transaction));
      setError('');
    }
  }, [open, transaction]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({ ...values, date: new Date(values.date).toISOString() });
      onOpenChange(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{transaction ? 'Edit transaction' : 'Add a transaction'}</DialogTitle>
        <DialogDescription>Keep the details accurate so your summary stays useful.</DialogDescription>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ErrorMessage>{error}</ErrorMessage>
          <Field label="Description" htmlFor="transaction-title">
            <Input id="transaction-title" required maxLength={120} value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} placeholder="e.g. Monthly rent" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="transaction-type">
              <Select id="transaction-type" value={values.type} onChange={(event) => setValues({ ...values, type: event.target.value, categoryId: '' })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </Field>
            <Field label="Amount (USD)" htmlFor="transaction-amount">
              <Input id="transaction-amount" type="number" min="0.01" max="999999999.99" step="0.01" required value={values.amount} onChange={(event) => setValues({ ...values, amount: event.target.value })} placeholder="0.00" />
            </Field>
          </div>
          <Field label="Category" htmlFor="transaction-category">
            <Select id="transaction-category" required value={values.categoryId} onChange={(event) => setValues({ ...values, categoryId: event.target.value })}>
              <option value="">Select a category</option>
              {availableCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </Select>
          </Field>
          <Field label="Date" htmlFor="transaction-date">
            <Input id="transaction-date" type="datetime-local" required value={values.date} onChange={(event) => setValues({ ...values, date: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !availableCategories.length}>
              {saving ? 'Saving…' : transaction ? 'Save changes' : 'Add transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
