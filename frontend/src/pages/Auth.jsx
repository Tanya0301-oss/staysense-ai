import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';

/**
 * Auth Page — Secure Multi-User Login
 */
export default function Auth() {
  const { login } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /* ── Validation ────────────────────────────────────────────────── */
  const validateLogin = () => {
    const errs = {};
    if (!loginEmail.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) errs.email = 'Enter a valid email.';
    if (!loginPassword) errs.password = 'Password is required.';
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);
    setApiError('');
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setApiError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Shared UI helpers ─────────────────────────────────────────── */
  const PwToggle = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-sm">

        {/* ── Brand ──────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md mb-3" style={{ background: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
            <span className="text-gray-900 font-black text-sm">S</span>
          </div>
          <h1 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            StaySense AI
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">
            Homestay review intelligence platform
          </p>
        </div>

        {/* ── Card ───────────────────────────────────────────── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            borderRadius: '20px',
            boxShadow: 'var(--card-shadow-md)',
          }}
        >
          <div className="p-6">
            {/* ── Login Form ─────────────────────────────────── */}
            <form onSubmit={handleLogin} noValidate className="space-y-4 animate-fade-in">
              {apiError && (
                <div className="p-3 rounded-lg text-xs font-semibold text-rose-700 bg-rose-500/10 border border-rose-500/20">
                  {apiError}
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none mt-3"
                  style={{ top: loginErrors.email ? 'calc(50% - 10px)' : undefined }}
                />
                <Input
                  id="login-email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  error={loginErrors.email}
                  className="[&_input]:pl-9"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 text-gray-400 pointer-events-none mt-3"
                  style={{ top: loginErrors.password ? 'calc(50% - 10px)' : '50%', transform: 'translateY(-50%)' }}
                />
                <Input
                  id="login-password"
                  label="Password"
                  type={showLoginPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  error={loginErrors.password}
                  className="[&_input]:pl-9 [&_input]:pr-9"
                  disabled={isLoading}
                />
                <PwToggle
                  show={showLoginPw}
                  onToggle={() => setShowLoginPw((p) => !p)}
                />
              </div>

              <Button
                id="login-submit"
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6 font-medium">
          2025 StaySense AI
        </p>
      </div>
    </div>
  );
}
