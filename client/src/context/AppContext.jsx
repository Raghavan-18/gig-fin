import { useState, useEffect } from 'react';
import { AppContext } from './context';
import { DEMO_PERSONAS } from '../data/dharaData';

const USER_STORAGE_KEY = 'dhara_user';
const CONSENT_STORAGE_KEY = 'dhara_consent';

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const defaultPersona = DEMO_PERSONAS[0];
    return {
      id: defaultPersona.id,
      name: defaultPersona.name,
      workerType: defaultPersona.title,
      platform: defaultPersona.platforms.join(' & '),
      city: defaultPersona.city,
      simulatedBank: defaultPersona.simulatedBank,
      accountMask: defaultPersona.accountMask,
      monthlyGross: defaultPersona.monthlyGross,
      avgDailyEarnings: defaultPersona.avgDailyEarnings,
    };
  });

  const [selectedBank, setSelectedBank] = useState(() => {
    return {
      id: 'hdfc',
      name: 'HDFC Bank (Simulated)',
      shortName: 'HDFC (Sim)',
      accountMask: 'XXXX XXXX 4521',
    };
  });

  const [consent, setConsent] = useState(() => {
    try {
      const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      consentId: 'AA_CNS_SIMULATED_4521',
      bankName: 'HDFC Bank (Simulated)',
      accountMask: 'XXXX XXXX 4521',
      status: 'ACTIVE',
      grantedAt: '2026-09-03T10:00:00.000Z',
    };
  });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
  };

  const clearToast = () => setToast(null);

  const login = (userData) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // ignore
    }
    setUser(userData);
  };

  const updateUser = (updated) => {
    const next = { ...user, ...updated };
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setUser(next);
  };

  const handleSetSelectedBank = (bank) => {
    setSelectedBank(bank);
  };

  const handleSetConsent = (consentData) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    } catch {
      // ignore
    }
    setConsent(consentData);
  };

  const logout = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // ignore
    }
    const defaultPersona = DEMO_PERSONAS[0];
    setUser({
      id: defaultPersona.id,
      name: defaultPersona.name,
      workerType: defaultPersona.title,
      platform: defaultPersona.platforms.join(' & '),
      city: defaultPersona.city,
      simulatedBank: defaultPersona.simulatedBank,
      accountMask: defaultPersona.accountMask,
      monthlyGross: defaultPersona.monthlyGross,
      avgDailyEarnings: defaultPersona.avgDailyEarnings,
    });
    showToast('Switched to persona selector', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        updateUser,
        selectedBank,
        setSelectedBank: handleSetSelectedBank,
        consent,
        setConsent: handleSetConsent,
        toast,
        showToast,
        clearToast,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
