import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import SimulationBadge from '../components/SimulationBadge';
import { useApp } from '../context/useApp';
import { dharaApi } from '../services/dharaApi';
import {
  CheckCircle2,
  Bike,
  Car,
  Home,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function PersonaEntryPage() {
  const navigate = useNavigate();
  const { login, setSelectedBank, setConsent, showToast } = useApp();

  const [personas, setPersonas] = useState([
    {
      id: 'ravi',
      name: 'Ravi',
      role: 'Delivery partner',
      city: 'Bengaluru',
      active: true,
      blurb: 'Rides for two platforms. Bike EMI on the 5th. 180 days seeded financial data.',
    },
    {
      id: 'sunita',
      name: 'Sunita',
      role: 'Domestic worker',
      city: 'Jaipur',
      active: false,
      blurb: 'Five homes, cash wages. Saves in a chit fund. (Unseeded in this build)',
    },
    {
      id: 'imran',
      name: 'Imran',
      role: 'Cab driver',
      city: 'Pune',
      active: false,
      blurb: 'Grosses Rs 45,000, nets Rs 18,000. Annual insurance bill. (Unseeded in this build)',
    },
  ]);

  const [selectedPersonaId, setSelectedPersonaId] = useState('ravi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPersonas() {
      try {
        const list = await dharaApi.getPersonas();
        if (list && list.length > 0) {
          setPersonas(list);
        }
      } catch (err) {
        console.warn('Backend personas fetch notice:', err.message);
      }
    }
    loadPersonas();
  }, []);

  const selectedPersona =
    personas.find((p) => p.id === selectedPersonaId) || personas[0];

  const handleContinue = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create session on FastAPI backend: POST /api/session
      const sessionRes = await dharaApi.createSession(selectedPersona.id);

      login({
        id: sessionRes.persona.id,
        name: sessionRes.persona.name,
        workerType: `${sessionRes.persona.role} (${sessionRes.persona.city})`,
        city: sessionRes.persona.city,
        sessionId: sessionRes.session_id,
        asOf: sessionRes.as_of,
        daysOfHistory: sessionRes.days_of_history,
        simulatedBank: 'HDFC Bank (Simulated)',
        accountMask: 'XXXX XXXX 4521',
      });

      setSelectedBank({
        id: 'hdfc',
        name: 'HDFC Bank (Simulated)',
        shortName: 'HDFC (Sim)',
        accountMask: 'XXXX XXXX 4521',
      });

      if (sessionRes.consent) {
        setConsent({
          consentId: sessionRes.session_id,
          bankName: 'HDFC Bank (Simulated)',
          accountMask: 'XXXX XXXX 4521',
          status: 'ACTIVE',
          source: sessionRes.consent.source,
          purpose: sessionRes.consent.purpose,
        });
      }

      showToast(`Welcome, ${sessionRes.persona.name}! Loaded seeded financial history.`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
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
            Select a synthetic gig-worker persona. The FastAPI backend loads seeded 180-day statement histories and runs the cash-flow-indexed resilience models.
          </p>
        </div>

        {/* Error notification if unseeded persona is refused */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-left flex items-start gap-3 text-xs text-rose-200 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Backend Policy Refusal (HTTP 409)</p>
              <p className="text-slate-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Persona Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {personas.map((persona) => {
            const isSelected = persona.id === selectedPersonaId;
            const Icon =
              persona.id === 'ravi' ? Bike : persona.id === 'sunita' ? Home : Car;

            return (
              <Card
                key={persona.id}
                onClick={() => {
                  setSelectedPersonaId(persona.id);
                  setError(null);
                }}
                className={`p-5 border cursor-pointer transition-all relative select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500/60 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 shadow-xl shadow-blue-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        persona.active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {persona.active ? '180 Days Seeded' : 'Unseeded'}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {persona.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {persona.role}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug line-clamp-3">
                    {persona.blurb}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{persona.city}</span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {persona.active ? 'Seeded DB' : 'Simulated'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Action Button: POST /api/session -> /dashboard */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto px-10 py-3.5 text-base font-bold shadow-xl shadow-blue-600/25"
          >
            Continue as {selectedPersona.name} →
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calls POST /api/session · Loads active ledger snapshot</span>
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
