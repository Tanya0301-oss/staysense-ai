const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT_MS = 60000; // 60 second timeout for batch processing

/**
 * Base fetch wrapper that includes credentials (cookies) on every request.
 * Throws an error for non-2xx responses with a structured error object.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} [timeoutMs]
 */
async function apiFetch(url, options = {}, timeoutMs = 10000) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      // credentials: 'include' sends HTTP-only cookies automatically on every request
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: abortController.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      // If any non-auth API call returns 401, broadcast session-expired event
      // so AuthContext can clear state and redirect to login.
      // Exclude auth endpoints themselves — a failed login isn't a session expiry.
      if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }

      const error = new Error(data.error?.message || data.message || `API error (HTTP ${response.status})`);
      error.code = data.error?.code || 'API_ERROR';
      error.status = response.status;
      error.details = data.error;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please try again.');
      timeoutError.code = 'TIMEOUT_ERROR';
      timeoutError.isRetryable = true;
      throw timeoutError;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to the backend. Please ensure the server is running.');
      networkError.code = 'NETWORK_ERROR';
      networkError.isRetryable = true;
      throw networkError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Auth API ──────────────────────────────────────────────

/**
 * Authenticate a user. The server sets an HTTP-only cookie on success.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, data: {user: object}}>}
 */
export async function loginApi(email, password) {
  return apiFetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Register a new user. The server sets an HTTP-only cookie on success (auto-login).
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {Promise<{success: boolean, data: {user: object}}>}
 */
export async function registerApi(name, email, password, confirmPassword) {
  return apiFetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, confirmPassword }),
  });
}

/**
 * End the session. The server clears the HTTP-only cookie.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function logoutApi() {
  return apiFetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
}

/**
 * Fetch the currently authenticated user's profile.
 * Used on app mount to restore a session from an existing cookie.
 * @returns {Promise<{success: boolean, data: {user: object}}>}
 */
export async function getMeApi() {
  return apiFetch(`${API_BASE_URL}/api/auth/me`);
}

// ── Review Analysis API ───────────────────────────────────

/**
 * Submit one or more reviews for AI analysis.
 *
 * @param {string[]} reviews - Array of review texts to analyze
 * @returns {Promise<{success: boolean, count: number, data: Array}>}
 */
export async function analyzeReviewsApi(reviews) {
  try {
    const data = await apiFetch(
      `${API_BASE_URL}/api/reviews/analyze`,
      { method: 'POST', body: JSON.stringify({ reviews }) },
      API_TIMEOUT_MS
    );

    // Validate response structure
    if (!data.success || !Array.isArray(data.data)) {
      const error = new Error('Invalid response format from API');
      error.code = 'INVALID_RESPONSE';
      throw error;
    }

    return data;
  } catch (error) {
    if (error.code) {
      console.error('API service error:', error.code, error.message);
      throw error;
    }
    const genericError = new Error(error.message || 'An unexpected error occurred');
    genericError.code = 'UNKNOWN_ERROR';
    throw genericError;
  }
}

/**
 * Check backend health and connectivity.
 * @returns {Promise<boolean>} True if backend is healthy
 */
export async function checkBackendHealth() {
  try {
    const data = await apiFetch(`${API_BASE_URL}/api/reviews/health`, {}, 5000);
    return data.success && data.status === 'healthy';
  } catch {
    return false;
  }
}

// ── History API ───────────────────────────────────────────

/**
 * Retrieve the authenticated user's analysis history.
 *
 * @param {number} page - Page number (starts at 1)
 * @param {number} limit - Items per page
 */
export async function getHistoryApi(page = 1, limit = 10) {
  return apiFetch(`${API_BASE_URL}/api/history?page=${page}&limit=${limit}`);
}

/**
 * Delete a historical session owned by the authenticated user.
 *
 * @param {string} requestId - UUID of the session to delete
 */
export async function deleteSessionApi(requestId) {
  return apiFetch(`${API_BASE_URL}/api/history/${requestId}`, { method: 'DELETE' });
}

/**
 * Retrieve dynamic alerts generated from the authenticated user's data.
 */
export async function getAlertsApi() {
  return apiFetch(`${API_BASE_URL}/api/history/alerts`);
}

/**
 * Retrieve weekly summary stats for the authenticated user.
 */
export async function getWeeklySummaryApi() {
  return apiFetch(`${API_BASE_URL}/api/history/weekly-summary`);
}

/**
 * Retrieve daily historical trends for the authenticated user.
 */
export async function getTrendsApi() {
  return apiFetch(`${API_BASE_URL}/api/history/trends`);
}

/**
 * Mark one or more alerts as read for the authenticated user.
 *
 * @param {string[]} alertIds - Array of alert ID strings to mark as read
 */
export async function markAlertsReadApi(alertIds) {
  return apiFetch(`${API_BASE_URL}/api/history/alerts/read`, {
    method: 'POST',
    body: JSON.stringify({ alertIds }),
  });
}
