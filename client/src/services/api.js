/**
 * Dhara Centralized API Client.
 * Connects directly to FastAPI REST API via VITE_API_BASE_URL.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    Accept: 'application/json',
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      let errorPayload = null;
      try {
        errorPayload = await response.json();
        errorDetail = errorPayload.detail || errorPayload.message || errorDetail;
      } catch {
        // use default
      }
      const message = typeof errorDetail === 'string' ? errorDetail : (errorDetail.message || JSON.stringify(errorDetail));
      const error = new Error(message);
      error.status = response.status;
      error.payload = errorPayload;
      error.detail = errorDetail;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network or server down error
    throw new Error(
      `Unable to connect to Dhara server at ${API_BASE_URL}. Ensure the backend is running.`,
      { cause: err }
    );
  }
}

export { API_BASE_URL };
