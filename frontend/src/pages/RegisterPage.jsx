import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, WalletCards } from 'lucide-react';
import { useAuth } from '../contexts/useAuth.js';
import { errorMessage } from '../lib/utils.js';
import { Button } from '../components/ui/button.jsx';
import { ErrorMessage } from '../components/ui/feedback.jsx';
import { Field, Input } from '../components/ui/input.jsx';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/app/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(values);
      navigate('/app/dashboard', { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError, 'We could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <Link to="/login" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white"><WalletCards size={19} /></span>
          Ledgerly
        </Link>
        <div className="mb-7 mt-8">
          <p className="text-sm font-semibold text-indigo-600">GET STARTED</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-2 text-slate-500">Set up your personal finance space in a minute.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage>{error}</ErrorMessage>
          <Field label="Full name" htmlFor="name">
            <Input id="name" autoComplete="name" required minLength={2} maxLength={80} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Your name" />
          </Field>
          <Field label="Email address" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" />
          </Field>
          <Field label="Password" htmlFor="password" hint="Use at least 12 characters.">
            <Input id="password" type="password" autoComplete="new-password" required minLength={12} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="Create a strong password" />
          </Field>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'} <ArrowRight size={17} />
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
