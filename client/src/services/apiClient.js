/**
 * Base API Client configured for future FastAPI integration.
 * In development without backend, resolves realistic mock responses with simulated network delay.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

// Helper to simulate network latency for realism
export const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiRequest(endpoint, options = {}) {
  if (USE_MOCK_API) {
    // In mock mode, the calling service handles mock response
    throw new Error('Using mock services');
  }

  const token = localStorage.getItem('gigfinance_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export { API_BASE_URL, USE_MOCK_API };
