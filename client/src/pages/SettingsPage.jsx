import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import SimulationBadge from '../components/SimulationBadge';
import { useApp } from '../context/useApp';
import {
  User,
  ShieldCheck,
  Bell,
  LogOut,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Database,
  Cpu,
} from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, showToast } = useApp();

  const [notifications, setNotifications] = useState({
    safeToSaveAlert: true,
    surgeSkimAlert: true,
    shortfallEarlyWarning: true,
  });

  const [dataVisibility, setDataVisibility] = useState(true);

  const toggleNotif = (key) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      showToast(
        `${key.replace(/([A-Z])/g, ' $1')} notification ${next[key] ? 'enabled' : 'disabled'}`,
        'info'
      );
      return next;
    });
  };

  const handleSwitchPersona = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppLayout maxWidth="max-w-4xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Demo Settings & Controls"
            subtitle="Simulation environment controls, sweep notifications, and data visibility"
            badge="Dhara Preferences"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* 1. Simulated Data Environment Section */}
        <Card className="p-6 border-blue-500/25 bg-slate-900/80 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">
              Simulated Data Environment
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            This prototype operates entirely over synthetic seeded gig transactions.
            No live bank connections or real monetary transactions take place.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-slate-200">Synthetic Ledger Feeds</p>
              <p className="text-[11px] text-slate-500">
                Rule-based classification & quantile forecasting active
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
              MOCK SESSION
            </span>
          </div>
        </Card>

        {/* 2. Demo Persona Section */}
        <Card className="p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base text-white">Active Persona</h3>
            </div>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Switch Persona
              </Button>
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Current session mounted as Bengaluru Delivery Rider (Ramesh Patil).
          </p>
        </Card>

        {/* 3. Consent Management Section */}
        <Card className="p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">
                Simulated Account Aggregator Consent
              </h3>
            </div>
            <Link to="/consent-management">
              <Button variant="outline" size="sm" icon={ExternalLink} iconPosition="right">
                Manage Mandate
              </Button>
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Pause or revoke simulated statement ingestion and view data access scopes.
          </p>
        </Card>

        {/* 4. Notification Preferences */}
        <Card className="p-6 border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Nudges & Alerts</h3>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  Daily Safe-to-Save Limit Reminder
                </p>
                <p className="text-[11px] text-slate-400">
                  Morning notification showing today's safe allocation headroom
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleNotif('safeToSaveAlert')}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                {notifications.safeToSaveAlert ? (
                  <ToggleRight className="w-8 h-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  Surge Skim Sweep Notifications
                </p>
                <p className="text-[11px] text-slate-400">
                  Notification when weekend high earnings trigger a 10% micro-sweep
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleNotif('surgeSkimAlert')}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                {notifications.surgeSkimAlert ? (
                  <ToggleRight className="w-8 h-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  Early Shortfall Warning
                </p>
                <p className="text-[11px] text-slate-400">
                  Forecasted alert 6 days prior to room rent or EMI obligations
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleNotif('shortfallEarlyWarning')}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                {notifications.shortfallEarlyWarning ? (
                  <ToggleRight className="w-8 h-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </Card>

        {/* 5. Data Visibility */}
        <Card className="p-6 border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base text-white">Data Visibility</h3>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                Display Synthetic Badges
              </p>
              <p className="text-[11px] text-slate-400">
                Show "DEMO · SIMULATED AA · SYNTHETIC DATA" labels across views
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDataVisibility(!dataVisibility);
                showToast(`Simulation badges ${!dataVisibility ? 'enabled' : 'minimized'}`, 'info');
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {dataVisibility ? (
                <ToggleRight className="w-8 h-8 text-blue-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-600" />
              )}
            </button>
          </div>
        </Card>

        {/* 6. Switch / Exit Demo */}
        <Card className="p-6 border-rose-500/20 bg-rose-950/10 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <LogOut className="w-5 h-5" />
            <h3 className="font-bold text-base">Exit Demo Session</h3>
          </div>
          <p className="text-xs text-slate-400">
            Reset local simulated state and return to persona selection.
          </p>
          <div className="pt-1">
            <Button
              variant="danger"
              size="md"
              onClick={handleSwitchPersona}
              icon={LogOut}
              iconPosition="left"
            >
              Exit & Choose Another Persona
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
