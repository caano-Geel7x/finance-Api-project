import { AlertCircle, LoaderCircle } from 'lucide-react';

export function LoadingState({ label = 'Loading your information…' }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <LoaderCircle className="animate-spin text-indigo-600" size={24} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
        <span className="text-xl">—</span>
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
