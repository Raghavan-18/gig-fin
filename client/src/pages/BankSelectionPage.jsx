import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Logo from '../components/Logo';
import PageHeader from '../components/PageHeader';
import BankCard from '../components/BankCard';
import SimulationBadge from '../components/SimulationBadge';
import { consentService } from '../services/consentService';
import { useApp } from '../context/useApp';
import { Search, ShieldAlert, ArrowLeft, Database } from 'lucide-react';

export default function BankSelectionPage() {
  const navigate = useNavigate();
  const { selectedBank, setSelectedBank, showToast } = useApp();
  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBanks() {
      try {
        const list = await consentService.getSupportedBanks();
        setBanks(list);
      } catch {
        showToast('Failed to load bank list', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadBanks();
  }, [showToast]);

  const filteredBanks = banks.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.shortName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    showToast(`Loaded simulated stream for ${bank.name}`, 'info');
    navigate('/consent/review');
  };

  return (
    <Layout showNavbar={false} showFooter={false} maxWidth="max-w-xl">
      <div className="min-h-[90vh] flex flex-col justify-center py-8">
        <div className="flex justify-center mb-5">
          <Logo size="lg" />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/consent')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Consent Details</span>
          </button>
          <SimulationBadge size="xs" />
        </div>

        <PageHeader
          title="Select Simulated Bank Stream"
          subtitle="Choose which synthetic bank account data stream to link to this demo session"
          badge="Simulated AA Gateway"
        />

        {/* Notice */}
        <div className="p-3 mb-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
          <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>Each bank selection loads an isolated synthetic statement profile.</span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search simulated bank (e.g. SBI, HDFC)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
          />
        </div>

        {/* Bank Cards Grid / List */}
        <div className="space-y-3">
          {filteredBanks.map((bank) => (
            <BankCard
              key={bank.id}
              bank={{
                ...bank,
                name: `${bank.name} (Simulated)`,
              }}
              isSelected={selectedBank?.id === bank.id}
              onSelect={handleSelectBank}
            />
          ))}

          {filteredBanks.length === 0 && !loading && (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-sm">No matching simulated banks found.</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Simulated environment · No live bank connectivity
          </p>
        </div>
      </div>
    </Layout>
  );
}
