import { delay } from './apiClient';

const CONSENT_STORAGE_KEY = 'gigfinance_consent';

const SUPPORTED_BANKS = [
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    code: 'SBIN',
    popular: true,
    logoBg: '#1a365d',
    textColor: '#ffffff',
    accountMask: 'XXXX XXXX 6192',
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC Bank',
    code: 'HDFC',
    popular: true,
    logoBg: '#004c8f',
    textColor: '#ffffff',
    accountMask: 'XXXX XXXX 4521',
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI Bank',
    code: 'ICIC',
    popular: true,
    logoBg: '#a81c1c',
    textColor: '#ffffff',
    accountMask: 'XXXX XXXX 8301',
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'Axis Bank',
    code: 'UTIB',
    popular: true,
    logoBg: '#97144d',
    textColor: '#ffffff',
    accountMask: 'XXXX XXXX 3314',
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak Bank',
    code: 'KKBK',
    popular: false,
    logoBg: '#ed1c24',
    textColor: '#ffffff',
    accountMask: 'XXXX XXXX 5578',
  },
  {
    id: 'other',
    name: 'Other Bank',
    shortName: 'Other',
    code: 'OTHER',
    popular: false,
    logoBg: '#334155',
    textColor: '#ffffff',
    accountMask: 'XXXX XXXX 9999',
  },
];

export const consentService = {
  /**
   * Get list of Account Aggregator supported banks
   */
  async getSupportedBanks() {
    await delay(300);
    return SUPPORTED_BANKS;
  },

  /**
   * Return terms, scopes, and legal AA framework metadata
   */
  async getConsentTerms() {
    await delay(200);
    return {
      purpose: 'Financial analysis and personalized resilience insights',
      duration: '3 Months',
      requestedData: [
        {
          id: 'transactions',
          label: 'Transaction History',
          description: 'To detect gig payouts, irregular income trends, and expenses',
          included: true,
        },
        {
          id: 'balance',
          label: 'Account Balance',
          description: 'To calculate real-time Safe-to-Save buffers and protect liquidity floor',
          included: true,
        },
        {
          id: 'info',
          label: 'Account Information',
          description: 'Account type, branch code, and verified holder verification',
          included: true,
        },
      ],
      compliance: {
        framework: 'RBI Account Aggregator Ecosystem',
        encryption: '256-bit End-to-End Encryption',
        revocable: 'Can be revoked at any time from settings',
      },
    };
  },

  /**
   * Submit approved consent artifact
   */
  async submitConsent({ bankId, bankName, accountMask }) {
    await delay(700);

    const consentRecord = {
      consentId: 'AA_CNS_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      bankId: bankId || 'hdfc',
      bankName: bankName || 'HDFC Bank',
      accountMask: accountMask || 'XXXX XXXX 4521',
      status: 'ACTIVE',
      purpose: 'Financial analysis and personalized resilience insights',
      duration: '3 Months',
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentRecord));

    return {
      success: true,
      consent: consentRecord,
    };
  },

  /**
   * Retrieve active consent state
   */
  getActiveConsent() {
    try {
      const data = localStorage.getItem(CONSENT_STORAGE_KEY);
      return data
        ? JSON.parse(data)
        : {
            consentId: 'AA_CNS_DEFAULT_HDFC',
            bankId: 'hdfc',
            bankName: 'HDFC Bank',
            accountMask: 'XXXX XXXX 4521',
            status: 'ACTIVE',
            purpose: 'Financial analysis and personalized resilience insights',
            duration: '3 Months',
            grantedAt: '2026-09-03T10:00:00.000Z',
            expiresAt: '2026-12-03T10:00:00.000Z',
          };
    } catch {
      return null;
    }
  },

  /**
   * Pause data aggregation feed
   */
  async pauseConsent() {
    await delay(300);
    const current = this.getActiveConsent();
    const updated = {
      ...current,
      status: current.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
    return {
      success: true,
      consent: updated,
      message: `Consent is now ${updated.status}`,
    };
  },

  /**
   * Revoke consent completely
   */
  async revokeConsent() {
    await delay(400);
    const current = this.getActiveConsent();
    const updated = {
      ...current,
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
    return {
      success: true,
      consent: updated,
      message: 'Account Aggregator consent successfully revoked.',
    };
  },
};

