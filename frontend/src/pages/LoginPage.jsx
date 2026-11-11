import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, WalletCards } from 'lucide-react';
import { useAuth } from '../contexts/useAuth.js';
import { errorMessage } from '../lib/utils.js';
import { Button } from '../components/ui/button.jsx';
import { ErrorMessage } from '../components/ui/feedback.jsx';
import { Field, Input } from '../components/ui/input.jsx';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/app/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(values);
      navigate('/app/dashboard', { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError, 'We could not sign you in with those details.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.85fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-12 inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white"><WalletCards size={19} /></span>
            Ledgerly
          </Link>
          <div className="mb-8">
            <p className="text-sm font-semibold text-indigo-600">WELCOME BACK</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Sign in to your account</h1>
            <p className="mt-2 text-slate-500">A clearer view of your money starts here.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorMessage>{error}</ErrorMessage>
            <Field label="Email address" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input id="password" type="password" autoComplete="current-password" required value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="Enter your password" />
            </Field>
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} />
            </Button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">
            New to Ledgerly? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Create an account</Link>
          </p>
        </div>
      </section>
      <aside className="hidden overflow-hidden bg-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="self-end rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-indigo-100"><ShieldCheck size={14} className="mr-2 inline" />Private by design</div>
        <div className="mx-auto max-w-lg">
          <div className="mb-8 grid size-16 place-items-center rounded-2xl bg-white/10"><WalletCards size={30} /></div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Make every dollar feel a little more organized.</h2>
          <p className="mt-5 max-w-md text-lg leading-8 text-indigo-100">See your income, keep an eye on spending, and make confident decisions with a dashboard built for you.</p>
        </div>
        <p className="text-sm text-indigo-200">Your finances, clearly.</p>
      </aside>
    </main>
  );
}
