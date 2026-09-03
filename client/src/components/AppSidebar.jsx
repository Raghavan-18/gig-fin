import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import SimulationBadge from './SimulationBadge';
import { useApp } from '../context/useApp';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  PiggyBank,
  Award,
  Sparkles,
  GitCompare,
  User,
  ShieldCheck,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';

export default function AppSidebar() {
  const location = useLocation();
  const { user, selectedBank, consent, logout } = useApp();

  const mainNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Income & Forecast', path: '/analytics', icon: TrendingUp },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Smart Savings & Sweeps', path: '/savings', icon: PiggyBank },
    { label: 'Credit Resilience', path: '/gig-score', icon: Award },
    { label: 'Traditional vs Dhara', path: '/comparison', icon: GitCompare, badge: 'Core' },
    { label: 'Financial Assistant', path: '/financial-guidance', icon: Sparkles },
    { label: 'Profile (Demo)', path: '/profile', icon: User },
  ];

  const secondaryNav = [
    { label: 'Simulated Consent', path: '/consent-management', icon: ShieldCheck },
    { label: 'Demo Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-xl h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 space-y-2.5">
        <Logo size="md" />
        <SimulationBadge size="xs" />
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Cash-Flow Architecture
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group
                ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25 border border-blue-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }
              `}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Simulation & Data
        </div>
        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group
                ${
                  isActive
                    ? 'bg-slate-850 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Connected Account & User Footer */}
      <div className="p-3.5 border-t border-slate-800/80 space-y-2.5">
        {/* Connected Bank Pill */}
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white truncate max-w-[90px]">
              {selectedBank?.shortName || 'HDFC (Sim)'}
            </span>
          </div>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
              consent?.status === 'REVOKED'
                ? 'bg-rose-500/20 text-rose-300'
                : consent?.status === 'PAUSED'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {consent?.status || 'ACTIVE'}
          </span>
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center justify-between">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <p className="leading-tight truncate max-w-[100px]">{user?.name || 'Ramesh Patil'}</p>
              <span className="text-[10px] text-slate-500 font-normal truncate block max-w-[100px]">
                {user?.workerType || 'Bengaluru Delivery Rider'}
              </span>
            </div>
          </Link>

          <button
            onClick={logout}
            title="Switch Persona / Exit Demo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
