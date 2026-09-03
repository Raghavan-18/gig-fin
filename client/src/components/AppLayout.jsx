import { Link } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import MobileBottomNav from './MobileBottomNav';
import Logo from './Logo';
import Toast from './Toast';
import SimulationBadge from './SimulationBadge';
import { User, Settings, ShieldCheck } from 'lucide-react';

export default function AppLayout({ children, maxWidth = 'max-w-6xl' }) {
  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-emerald-600/5 blur-3xl rounded-full" />
      </div>

      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-3 h-14 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
          <Logo size="sm" showBadge={false} />
          <SimulationBadge size="xs" className="hidden sm:inline-flex" />
          <div className="flex items-center gap-2">
            <Link
              to="/consent-management"
              className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              title="Consent Status"
            >
              <ShieldCheck className="w-4 h-4" />
            </Link>
            <Link
              to="/settings"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <Link
              to="/profile"
              className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs"
            >
              <User className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 ${maxWidth}`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Toast provider */}
      <Toast />
    </div>
  );
}
