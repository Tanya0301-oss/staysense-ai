import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';

/**
 * Auth Page — Multi-User Login & Sign Up
 *
 * Two-tab interface: "Log In" and "Sign Up".
 * On successful registration, the user is automatically logged in and
 * redirected to the dashboard (handled by AuthContext setting the user).
 *
 * Displays a "Session expired" banner when the user's cookie expires
 * mid-session, driven by the global auth:session-expired event.
 */
export default function Auth() {
  const { login, register, sessionExpired, clearSessionExpired } = useAuth();

  // Tab state: 'login' or 'signup'
  const [activeTab, setActiveTab] = useState('login');

  // ── Login state ──────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  // ── Sign-up state ────────────────────────────────────────
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [signupErrors, setSignupErrors] = useState({});

  // ── Shared state ─────────────────────────────────────────
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear session-expired banner when user starts interacting
  useEffect(() => {
    if (sessionExpired) {
      // The banner is visible; it will be cleared on first interaction
    }
  }, [sessionExpired]);

  const handleInteraction = () => {
    if (sessionExpired) clearSessionExpired();
    setApiError('');
  };

  /* ── Tab switch ──────────────────────────────────────────── */
  const switchTab = (tab) => {
    setActiveTab(tab);
    setApiError('');
    setLoginErrors({});
    setSignupErrors({});
    handleInteraction();
  };

  /* ── Login validation ────────────────────────────────────── */
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
    handleInteraction();
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

  /* ── Sign-up validation ──────────────────────────────────── */
  const validateSignup = () => {
    const errs = {};
    if (!signupName.trim()) errs.name = 'Full name is required.';
    if (!signupEmail.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(signupEmail)) errs.email = 'Enter a valid email.';
    if (!signupPassword) {
      errs.password = 'Password is required.';
    } else {
      if (signupPassword.length < 8) errs.password = 'Must be at least 8 characters.';
      else if (!/[A-Z]/.test(signupPassword)) errs.password = 'Must contain an uppercase letter.';
      else if (!/[a-z]/.test(signupPassword)) errs.password = 'Must contain a lowercase letter.';
      else if (!/\d/.test(signupPassword)) errs.password = 'Must contain a digit.';
    }
    if (!signupConfirm) errs.confirm = 'Please confirm your password.';
    else if (signupPassword !== signupConfirm) errs.confirm = 'Passwords do not match.';
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    handleInteraction();
    if (!validateSignup()) return;

    setIsLoading(true);
    setApiError('');
    try {
      await register(signupName, signupEmail, signupPassword, signupConfirm);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Shared UI helpers ─────────────────────────────────────── */
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

          </p>
        </div>

        {/* ── Session Expired Banner ────────────────────────── */}
        {sessionExpired && (
          <div className="mb-4 p-3 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            Session expired. Please log in again.
          </div>
        )}

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
          {/* ── Tab Bar ─────────────────────────────────────── */}
          <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 text-xs font-bold tracking-wide transition-all ${activeTab === 'login'
                  ? 'text-[#FBBF24] border-b-2 border-[#FBBF24]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              Log In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => switchTab('signup')}
              className={`flex-1 py-3 text-xs font-bold tracking-wide transition-all ${activeTab === 'signup'
                  ? 'text-[#FBBF24] border-b-2 border-[#FBBF24]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6">
            {/* ── API Error Banner ─────────────────────────── */}
            {apiError && (
              <div className="mb-4 p-3 rounded-lg text-xs font-semibold text-rose-700 bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-500 shrink-0" />
                {apiError}
              </div>
            )}

            {/* ── Login Form ──────────────────────────────── */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} noValidate className="space-y-4 animate-fade-in">
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
                    onChange={(e) => { setLoginEmail(e.target.value); handleInteraction(); }}
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
                    onChange={(e) => { setLoginPassword(e.target.value); handleInteraction(); }}
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
            )}

            {/* ── Sign Up Form ────────────────────────────── */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} noValidate className="space-y-4 animate-fade-in">
                {/* Full Name */}
                <div className="relative">
                  <User
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none mt-3"
                    style={{ top: signupErrors.name ? 'calc(50% - 10px)' : undefined }}
                  />
                  <Input
                    id="signup-name"
                    label="Full Name"
                    type="text"
                    placeholder="Your full name"
                    value={signupName}
                    onChange={(e) => { setSignupName(e.target.value); handleInteraction(); }}
                    error={signupErrors.name}
                    className="[&_input]:pl-9"
                    disabled={isLoading}
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none mt-3"
                    style={{ top: signupErrors.email ? 'calc(50% - 10px)' : undefined }}
                  />
                  <Input
                    id="signup-email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => { setSignupEmail(e.target.value); handleInteraction(); }}
                    error={signupErrors.email}
                    className="[&_input]:pl-9"
                    disabled={isLoading}
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 text-gray-400 pointer-events-none mt-3"
                    style={{ top: signupErrors.password ? 'calc(50% - 10px)' : '50%', transform: 'translateY(-50%)' }}
                  />
                  <Input
                    id="signup-password"
                    label="Password"
                    type={showSignupPw ? 'text' : 'password'}
                    placeholder="Min 8 chars, A-Z, a-z, 0-9"
                    value={signupPassword}
                    onChange={(e) => { setSignupPassword(e.target.value); handleInteraction(); }}
                    error={signupErrors.password}
                    className="[&_input]:pl-9 [&_input]:pr-9"
                    disabled={isLoading}
                  />
                  <PwToggle
                    show={showSignupPw}
                    onToggle={() => setShowSignupPw((p) => !p)}
                  />
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 text-gray-400 pointer-events-none mt-3"
                    style={{ top: signupErrors.confirm ? 'calc(50% - 10px)' : '50%', transform: 'translateY(-50%)' }}
                  />
                  <Input
                    id="signup-confirm"
                    label="Confirm Password"
                    type={showSignupConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={signupConfirm}
                    onChange={(e) => { setSignupConfirm(e.target.value); handleInteraction(); }}
                    error={signupErrors.confirm}
                    className="[&_input]:pl-9 [&_input]:pr-9"
                    disabled={isLoading}
                  />
                  <PwToggle
                    show={showSignupConfirm}
                    onToggle={() => setShowSignupConfirm((p) => !p)}
                  />
                </div>

                {/* Password strength hints */}
                <div className="text-[10px] text-[var(--color-text-secondary)] font-medium leading-relaxed px-1">
                  Password must be at least 8 characters with uppercase, lowercase, and a digit.
                </div>

                <Button
                  id="signup-submit"
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
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6 font-medium">
          2025 StaySense AI
        </p>
      </div>
    </div>
  );
}
