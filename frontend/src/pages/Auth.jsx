import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button, Input } from '../components/ui';

/**
 * Auth Page — Login / Signup
 * Frontend-only. No backend calls required.
 *
 * @param {function} onAuthSuccess - Called when the user clicks Login or Create Account.
 *                                   Parent can use this to redirect to the main app.
 */
export default function Auth({ onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [signupErrors, setSignupErrors] = useState({});

  /* ── Validation ────────────────────────────────────────────────── */
  const validateLogin = () => {
    const errs = {};
    if (!loginEmail.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) errs.email = 'Enter a valid email.';
    if (!loginPassword) errs.password = 'Password is required.';
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs = {};
    if (!signupName.trim()) errs.name = 'Full name is required.';
    if (!signupEmail.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(signupEmail)) errs.email = 'Enter a valid email.';
    if (!signupPassword) errs.password = 'Password is required.';
    else if (signupPassword.length < 6) errs.password = 'At least 6 characters required.';
    if (!signupConfirm) errs.confirm = 'Please confirm your password.';
    else if (signupConfirm !== signupPassword) errs.confirm = 'Passwords do not match.';
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (validateLogin()) onAuthSuccess?.();
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (validateSignup()) onAuthSuccess?.();
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
          {/* Tab switcher */}
          <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                id={`auth-tab-${t}`}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-xs font-bold tracking-wide uppercase transition-all ${
                  tab === t
                    ? 'text-gray-900'
                    : 'hover:text-[var(--color-text-primary)]'
                }`}
                style={tab === t ? { background: '#FBBF24', color: '#111827' } : { color: 'var(--color-text-secondary)' }}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Login Form ─────────────────────────────────── */}
            {tab === 'login' && (
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
                    onChange={(e) => setLoginEmail(e.target.value)}
                    error={loginErrors.email}
                    className="[&_input]:pl-9"
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
                  className="w-full mt-2"
                >
                  Log In
                </Button>

                <p className="text-center text-xs text-[var(--color-text-secondary)] mt-2">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('signup')}
                    className="text-[#FFB703] font-bold hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            )}

            {/* ── Signup Form ─────────────────────────────────── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} noValidate className="space-y-4 animate-fade-in">
                <Input
                  id="signup-name"
                  label="Full Name"
                  placeholder="Jane Smith"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  error={signupErrors.name}
                />

                <Input
                  id="signup-email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  error={signupErrors.email}
                />

                <div className="relative">
                  <Input
                    id="signup-password"
                    label="Password"
                    type={showSignupPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    error={signupErrors.password}
                    className="[&_input]:pr-9"
                  />
                  <PwToggle
                    show={showSignupPw}
                    onToggle={() => setShowSignupPw((p) => !p)}
                  />
                </div>

                <div className="relative">
                  <Input
                    id="signup-confirm"
                    label="Confirm Password"
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    error={signupErrors.confirm}
                    className="[&_input]:pr-9"
                  />
                  <PwToggle
                    show={showConfirmPw}
                    onToggle={() => setShowConfirmPw((p) => !p)}
                  />
                </div>

                <Button
                  id="signup-submit"
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-2"
                >
                  Create Account
                </Button>

                <p className="text-center text-xs text-[var(--color-text-secondary)] mt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-[#FFB703] font-bold hover:underline"
                  >
                    Log in
                  </button>
                </p>
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
