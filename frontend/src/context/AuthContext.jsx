import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginApi, logoutApi, getMeApi, registerApi } from '../services/api';

/**
 * AuthContext — provides authentication state to the entire application.
 *
 * On mount, automatically calls GET /api/auth/me to restore a session
 * from the existing HTTP-only cookie. This enables "stay logged in"
 * across page refreshes without storing any token in JS memory.
 *
 * Never stores the JWT — it lives exclusively in the HTTP-only cookie
 * managed by the browser and the server.
 *
 * Listens for the global 'auth:session-expired' event dispatched by
 * apiFetch on any 401 response. When fired, clears user state and sets
 * the sessionExpired flag so the Auth page can display a message.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true); // true while checking existing session
  const [sessionExpired, setSessionExpired]   = useState(false);

  /**
   * Attempt to restore a session by calling the /me endpoint.
   * If the cookie is still valid the server returns the user profile.
   * If not, the user is left as null and we show the login page.
   */
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMeApi();
      // Backend response shape: { success: true, data: { user } }
      setUser(data.data?.user ?? null);
    } catch {
      // 401 or network error — no valid session
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run once on mount to restore any existing session
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ── Global session-expired listener ─────────────────────
  // Fired by apiFetch when any API call returns 401 mid-session.
  useEffect(() => {
    function handleExpired() {
      setUser(null);
      setSessionExpired(true);
    }
    window.addEventListener('auth:session-expired', handleExpired);
    return () => window.removeEventListener('auth:session-expired', handleExpired);
  }, []);

  /**
   * Clear the session-expired flag (called when the user starts interacting
   * with the login/signup form so the banner disappears).
   */
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  /**
   * Authenticate with email/password.
   * On success the server sets the HTTP-only cookie and returns the user.
   *
   * @param {string} email
   * @param {string} password
   * @throws {Error} if credentials are invalid (message from the API)
   */
  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password);
    // Backend response shape: { success: true, data: { user } }
    setUser(data.data?.user ?? null);
    setSessionExpired(false);
  }, []);

  /**
   * Register a new user and automatically log them in.
   * The server sets the HTTP-only cookie on success.
   *
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} confirmPassword
   * @throws {Error} if validation fails or email already exists
   */
  const register = useCallback(async (name, email, password, confirmPassword) => {
    const data = await registerApi(name, email, password, confirmPassword);
    // Backend response shape: { success: true, data: { user } }
    setUser(data.data?.user ?? null);
    setSessionExpired(false);
  }, []);

  /**
   * End the current session.
   * Calls the backend to clear the cookie, then clears local state.
   */
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Proceed with local logout even if the API call fails
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, checkAuth, sessionExpired, clearSessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication state and actions.
 * @returns {{ user: object|null, loading: boolean, login: function, logout: function, register: function, checkAuth: function, sessionExpired: boolean, clearSessionExpired: function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
