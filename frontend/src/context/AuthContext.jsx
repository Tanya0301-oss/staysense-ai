import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginApi, logoutApi, getMeApi } from '../services/api';

/**
 * AuthContext — provides authentication state to the entire application.
 *
 * On mount, automatically calls GET /api/auth/me to restore a session
 * from the existing HTTP-only cookie. This enables "stay logged in"
 * across page refreshes without storing any token in JS memory.
 *
 * Never stores the JWT — it lives exclusively in the HTTP-only cookie
 * managed by the browser and the server.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while checking existing session

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
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication state and actions.
 * @returns {{ user: object|null, loading: boolean, login: function, logout: function, checkAuth: function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
