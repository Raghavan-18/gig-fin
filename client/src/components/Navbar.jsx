import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/useApp';
import Logo from './Logo';
import Button from './Button';
import SimulationBadge from './SimulationBadge';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Receipt,
  TrendingUp,
  PiggyBank,
  GitCompare,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = ['/login', '/signup', '/verify-otp'].includes(location.pathname);
  const isAppRoute = [
    '/dashboard',
    '/transactions',
    '/analytics',
    '/savings',
    '/gig-score',
    '/comparison',
    '/financial-guidance',
  ].includes(location.pathname);

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Forecast', path: '/analytics', icon: TrendingUp },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Sweeps', path: '/savings', icon: PiggyBank },
    { label: 'Traditional vs Dhara', path: '/comparison', icon: GitCompare },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Logo size="md" />

            {/* If in app route or logged in, show app links */}
            {isAppRoute || user ? (
              <div className="hidden md:flex items-center gap-1 text-xs font-medium">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all
                        ${
                          isActive
                            ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900'
                        }
                      `}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-300">
                <Link to="/comparison" className="hover:text-white transition-colors">
                  Traditional vs Dhara
                </Link>
                <Link to="/login" className="hover:text-white transition-colors">
                  Demo Personas
                </Link>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <SimulationBadge size="xs" />

            {user || isAppRoute ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {user?.name || 'Ramesh Patil'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Switch Persona"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isAuthPage ? (
              <Link to="/">
                <Button variant="ghost" size="sm">
                  Back to Home
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Launch Demo
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          {isAppRoute || user ? (
            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all
                      ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/comparison"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                Traditional vs Dhara
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                Choose Demo Persona
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
            <SimulationBadge size="xs" />
            {user || isAppRoute ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900">
                <span className="text-xs font-semibold text-slate-200">
                  {user?.name || 'Ramesh Patil'}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Switch Persona
                </Button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" fullWidth>
                  Launch Demo
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
