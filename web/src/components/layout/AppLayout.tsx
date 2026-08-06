import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  MessageCircle,
  CreditCard,
  Link2,
  LogOut,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../lib/auth';

const nav = [
  { to: '/', label: 'Ringkasan', icon: LayoutGrid },
  { to: '/connect', label: 'Hubungkan', icon: Link2 },
  { to: '/inbox', label: 'Inbox', icon: MessageCircle },
  { to: '/payments', label: 'Pembayaran', icon: CreditCard },
];

export function AppLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-full bg-ink-950 bg-mesh-light">
      <aside className="fixed inset-y-0 left-0 w-60 border-r border-white/5 bg-ink-900/70 backdrop-blur-xl hidden md:flex flex-col p-4">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <Logo />
          <div className="leading-tight">
            <div className="font-display font-bold text-white text-lg">DtmX</div>
            <div className="text-[11px] text-zinc-500">WA Automation</div>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-aurora-600/20 to-violet-500/20 text-white shadow-inset ring-1 ring-aurora-500/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`
              }
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
          >
            <LogOut size={17} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <nav className="md:hidden sticky top-0 z-20 flex items-center gap-2 border-b border-white/5 bg-ink-900/80 backdrop-blur px-3 py-2 overflow-x-auto">
        <Logo size={26} />
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                isActive
                  ? 'bg-aurora-600/20 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}