import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Tags,
  WalletCards,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth.js';
import { errorMessage } from '../lib/utils.js';
import { Button } from './ui/button.jsx';
import { ErrorMessage } from './ui/feedback.jsx';

const navigation = [
  { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/transactions', label: 'Transactions', icon: WalletCards },
  { to: '/app/categories', label: 'Categories', icon: Tags },
  { to: '/app/summary', label: 'Monthly summary', icon: BarChart3 },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  { to: '/app/profile', label: 'Profile', icon: CircleUserRound },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const links = user?.role === 'admin'
    ? [...navigation, { to: '/app/admin', label: 'Administration', icon: CircleUserRound }]
    : navigation;

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(errorMessage(error, 'Your local session ended, but the server could not revoke the refresh token.'));
    } finally {
      navigate('/login', { replace: true });
    }
  }

  function renderNavigation(mobile = false) {
    return links.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={() => setMenuOpen(false)}
        className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'} ${mobile ? 'w-full' : ''}`}
      >
        <Icon size={18} />
        {label}
      </NavLink>
    ));
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white px-4 py-6 lg:flex lg:flex-col">
        <NavLink to="/app/dashboard" className="mb-9 flex items-center gap-2.5 px-2 text-lg font-bold tracking-tight text-slate-900">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white"><WalletCards size={19} /></span>
          Ledgerly
        </NavLink>
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
        <nav className="space-y-1">{renderNavigation()}</nav>
        <div className="mt-auto rounded-2xl bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-900">Good with money starts with awareness.</p>
          <p className="mt-1 text-xs leading-5 text-indigo-700/80">Check in regularly to keep your plans on track.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
            <span className="text-sm font-semibold text-slate-800 lg:hidden">Ledgerly</span>
            <div className="hidden text-sm text-slate-500 sm:block">Personal finance workspace</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Personal account'}</p>
            </div>
            {user?.profilePictureUrl
              ? <img src={user.profilePictureUrl} alt="" className="size-9 rounded-full object-cover" />
              : <span className="grid size-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{user?.name?.slice(0, 1).toUpperCase()}</span>}
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={handleLogout}>
              <LogOut size={16} /> Sign out <ChevronDown size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={handleLogout} aria-label="Sign out"><LogOut size={18} /></Button>
          </div>
        </header>

        {logoutError && <div className="px-4 pt-4 sm:px-7"><ErrorMessage>{logoutError}</ErrorMessage></div>}

        {menuOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/25 lg:hidden" onClick={() => setMenuOpen(false)}>
            <nav className="h-full w-72 bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-7 flex items-center justify-between">
                <span className="font-bold text-slate-900">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></Button>
              </div>
              <div className="space-y-1">{renderNavigation(true)}</div>
            </nav>
          </div>
        )}

        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
