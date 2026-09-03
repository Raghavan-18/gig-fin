/**
 * Dhara Centralized API Client.
 * Connects directly to FastAPI REST API via VITE_API_BASE_URL.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || errorDetail;
      } catch {
        // use default
      }
      const error = new Error(errorDetail);
      error.status = response.status;
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
