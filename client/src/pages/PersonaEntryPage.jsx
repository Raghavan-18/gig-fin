import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import SimulationBadge from '../components/SimulationBadge';
import { useApp } from '../context/useApp';
import { DEMO_PERSONAS } from '../data/dharaData';
import {
  CheckCircle2,
  Bike,
  Car,
  MapPin,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
} from 'lucide-react';

export default function PersonaEntryPage() {
  const navigate = useNavigate();
  const { login, setSelectedBank, showToast } = useApp();
  const [selectedPersonaId, setSelectedPersonaId] = useState('bengaluru_rider');

  const selectedPersona =
    DEMO_PERSONAS.find((p) => p.id === selectedPersonaId) || DEMO_PERSONAS[0];

  const handleContinue = () => {
    login({
      id: selectedPersona.id,
      name: selectedPersona.name,
      workerType: selectedPersona.title,
      platform: selectedPersona.platforms.join(' & '),
      city: selectedPersona.city,
      simulatedBank: selectedPersona.simulatedBank,
      accountMask: selectedPersona.accountMask,
      monthlyGross: selectedPersona.monthlyGross,
      avgDailyEarnings: selectedPersona.avgDailyEarnings,
    });

    setSelectedBank({
      id: selectedPersona.id === 'bengaluru_rider' ? 'hdfc' : 'sbi',
      name: selectedPersona.simulatedBank,
      shortName: selectedPersona.id === 'bengaluru_rider' ? 'HDFC (Sim)' : 'SBI (Sim)',
      accountMask: selectedPersona.accountMask,
    });

    showToast(`Welcome, ${selectedPersona.name}! Loading Dhara Dashboard...`, 'success');
    navigate('/dashboard');
  };

  return (
    <Layout showNavbar={true} showFooter={true} maxWidth="max-w-4xl">
      <div className="py-6 sm:py-10 space-y-6 text-center">
        {/* Header */}
        <div className="space-y-3">
          <SimulationBadge size="md" className="mb-2" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
            Choose a Demo Persona
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Authentication and KYC have been cut from this prototype.
            Select a synthetic gig-worker persona to enter the actual Dhara financial resilience application.
          </p>
        </div>

        {/* Persona Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {DEMO_PERSONAS.map((persona) => {
            const isSelected = persona.id === selectedPersonaId;
            const Icon = persona.id === 'bengaluru_rider' ? Bike : Car;

            return (
              <Card
                key={persona.id}
                onClick={() => setSelectedPersonaId(persona.id)}
                className={`p-6 border cursor-pointer transition-all relative select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500/60 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 shadow-2xl shadow-blue-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {/* Selection Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {persona.badge}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  )}
                </div>

                {/* Persona Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {persona.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {persona.title}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{persona.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Platforms: <strong className="text-white">{persona.platforms.join(', ')}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Avg. Daily: <strong className="text-white font-mono">₹{persona.avgDailyEarnings}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Simulation Note */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Data Source:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{persona.simulatedBank}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Action Button: Direct to /dashboard */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto px-10 py-3.5 text-base font-bold shadow-xl shadow-blue-600/25"
          >
            Continue as {selectedPersona.name} →
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulated session · Synthetic dataset loaded automatically</span>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <Link
              to="/consent"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              Review Simulated AA Mandate
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
