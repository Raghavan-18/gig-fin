import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  PiggyBank,
  GitCompare,
  User,
} from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Forecast', path: '/analytics', icon: TrendingUp },
    { label: 'Sweeps', path: '/savings', icon: PiggyBank },
    { label: 'Compare', path: '/comparison', icon: GitCompare },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl select-none">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center py-1 px-2.5 rounded-xl transition-all
                ${
                  isActive
                    ? 'text-blue-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
