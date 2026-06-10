const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT_MS = 60000; // 60 second timeout for batch processing

/**
 * Service to interact with the Homestay Review Sentiment Classifier backend.
 * 
 * @param {string[]} reviews - Array of review texts to analyze
 * @returns {Promise<{success: boolean, count: number, data: Array}>}
 * @throws {Error} Various error types for different failure scenarios
 */
export async function analyzeReviewsApi(reviews) {
  try {
    // Create abort controller for timeout handling
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || data.message || `API error (HTTP ${response.status})`;
        const errorCode = data.error?.code || 'API_ERROR';
        
        // Create detailed error for specific scenarios
        const error = new Error(errorMsg);
        error.code = errorCode;
        error.status = response.status;
        error.details = data.error;
        
        throw error;
      }

      // Validate response structure
      if (!data.success || !Array.isArray(data.data)) {
        const error = new Error('Invalid response format from API');
        error.code = 'INVALID_RESPONSE';
        error.details = data;
        throw error;
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Enhance error with specific type information
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. The AI service took too long to respond. Please try with fewer reviews or try again later.');
      timeoutError.code = 'TIMEOUT_ERROR';
      timeoutError.isRetryable = true;
      console.error('API timeout:', error);
      throw timeoutError;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to the backend API. Please verify the API URL and ensure the backend server is running.');
      networkError.code = 'NETWORK_ERROR';
      networkError.isRetryable = true;
      console.error('Network error:', error);
      throw networkError;
    }

    // Pass through our enhanced errors
    if (error.code) {
      console.error('API service error:', error.code, error.message);
      throw error;
    }

    // Generic error fallback
    const genericError = new Error(error.message || 'An unexpected error occurred while contacting the API');
    genericError.code = 'UNKNOWN_ERROR';
    genericError.originalError = error;
    console.error('API service error:', genericError);
    throw genericError;
  }
}

/**
 * Service to check backend health and connectivity.
 * Used to verify API is reachable before submitting requests.
 * 
 * @returns {Promise<boolean>} True if backend is healthy, false otherwise
 */
export async function checkBackendHealth() {
  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000); // 5s timeout for health check

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/health`, {
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        console.warn(`Health check returned status ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      return data.success && data.status === 'healthy';
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.warn('Health check failed:', error.message);
    return false;
  }
}

/**
 * Service to retrieve analysis history.
 * 
 * @param {number} page - Page number (starts at 1)
 * @param {number} limit - Items per page
 * @returns {Promise<{success: boolean, sessions: Array, total: number, page: number, totalPages: number}>}
 */
export async function getHistoryApi(page = 1, limit = 10) {
  const response = await fetch(`${API_BASE_URL}/api/history?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Service to delete a historical session.
 * 
 * @param {string} requestId - UUID of the session to delete
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteSessionApi(requestId) {
  const response = await fetch(`${API_BASE_URL}/api/history/${requestId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete session (HTTP ${response.status})`);
  }
  return response.json();
}
