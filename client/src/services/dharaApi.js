import { request } from './api';

export const dharaApi = {
  /** Health check */
  getHealth() {
    return request('/api/health');
  },

  /** Available personas */
  getPersonas() {
    return request('/api/personas');
  },

  /** Create/Select session by persona_id ('ravi', 'sunita', 'imran') */
  createSession(personaId = 'ravi') {
    return request('/api/session', {
      method: 'POST',
      body: JSON.stringify({ persona_id: personaId }),
    });
  },

  /** Main dashboard data */
  getDashboard() {
    return request('/api/dashboard');
  },

  /** Quantile income forecast (p10, p20, p50, p90) */
  getForecast(days = 30) {
    return request(`/api/forecast?days=${days}`);
  },

  /** Income classification over events (rule-based) */
  getClassify(limit = 100) {
    return request(`/api/classify?limit=${limit}`);
  },

  /** 30-day timeline with daily states & events */
  getTimeline(days = 30) {
    return request(`/api/timeline?days=${days}`);
  },

  /** Day-by-day replay during simulation/drought */
  getReplay(start = 165, end = 179) {
    return request(`/api/replay?start=${start}&end=${end}`);
  },

  /** Step single day in simulation */
  simulateDay(day = 173, scenario = 'scripted') {
    return request('/api/simulate/day', {
      method: 'POST',
      body: JSON.stringify({ day, scenario }),
    });
  },

  /** Simulated money movement / withdrawal from buffer or sinking fund */
  withdraw(amount, bucket = 'buffer') {
    return request('/api/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount), bucket }),
    });
  },

  /** Credit underwriting policy evaluation & scorecard */
  applyCredit(amount = 5000, tenureMonths = 12, purpose = 'bike repair') {
    return request('/api/credit/apply', {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(amount),
        tenure_months: Number(tenureMonths),
        purpose,
      }),
    });
  },

  /** Grounded financial assistant with numeric validation */
  askAssistant(text, forceDeterministic = true) {
    return request('/api/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({
        text,
        force_deterministic: forceDeterministic,
      }),
    });
  },

  /** Multi-turn conversational chat assistant */
  chatAssistant(message, history = [], personaId = 'ravi', forceDeterministic = true) {
    return request('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
        persona_id: personaId,
        force_deterministic: forceDeterministic,
      }),
    });
  },


  /** Traditional vs Dhara cash-flow-indexed comparison engine */
  getComparison() {
    return request('/api/compare');
  },

  /** Unified transaction stream from FastAPI ledger & simulated AA */
  getTransactions({ filter = 'All', verification_status = 'All', search = '', limit = 200 } = {}) {
    const params = new URLSearchParams();
    if (filter && filter !== 'All') params.append('filter', filter);
    if (verification_status && verification_status !== 'All') params.append('verification_status', verification_status);
    if (search && search.trim()) params.append('search', search.trim());
    if (limit) params.append('limit', limit);
    const qs = params.toString();
    return request(`/api/transactions${qs ? `?${qs}` : ''}`);
  },

  /** Add manual cash transaction with optional receipt proof */
  addCashTransaction(formData) {
    return request('/api/transactions/cash', {
      method: 'POST',
      body: formData,
    });
  },

  /** Get transaction proof evidence summary */
  getTransactionEvidence() {
    return request('/api/transactions/evidence');
  },

  /** Get secure receipt URL */
  getReceiptUrl(identifier) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}/api/transactions/${identifier}/receipt`;
  },
};


export default dharaApi;
