import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/useAuth.js';
import AppLayout from './components/AppLayout.jsx';
import { LoadingState } from './components/ui/feedback.jsx';

const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const SummaryPage = lazy(() => import('./pages/SummaryPage.jsx'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage.jsx'));

function Page({ component: Component }) {
  return <Suspense fallback={<LoadingState />}><Component /></Suspense>;
}

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Restoring your secure session…" />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Page component={AdminPage} /> : <Navigate to="/app/dashboard" replace />;
}

function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Page not found</h1>
        <a href="/app/dashboard" className="mt-5 inline-block font-semibold text-indigo-600">Return to dashboard</a>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/login" element={<Page component={LoginPage} />} />
      <Route path="/register" element={<Page component={RegisterPage} />} />
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Page component={DashboardPage} />} />
          <Route path="transactions" element={<Page component={TransactionsPage} />} />
          <Route path="categories" element={<Page component={CategoriesPage} />} />
          <Route path="summary" element={<Page component={SummaryPage} />} />
          <Route path="reports" element={<Page component={ReportsPage} />} />
          <Route path="profile" element={<Page component={ProfilePage} />} />
          <Route path="admin" element={<RequireAdmin />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
