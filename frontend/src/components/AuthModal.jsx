import { useState, useEffect } from 'react';
import {
  Eye, EyeOff, Mail, Lock, User as UserIcon,
  AlertCircle, X, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Spinner ────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

/* ─── AuthField — pixel-perfect input with icon ──────────────────────────── */
/*
 * Layout:
 *   <label />                    ← 11px, semibold, secondary color
 *   <div row>                    ← h-10 (40px), border, rounded, flex
 *     <icon />                   ← 14px, centered, left-3 (12px)
 *     <input />                  ← flex-1, no extra padding top/bottom
 *     [<PwToggle />]             ← optional, right-2
 *   </div>
 *   [<p error />]               ← 11px, rose
 */
function AuthField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  disabled,
  rightSlot,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-semibold tracking-wide select-none"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div
        className={[
          'flex items-center h-10 rounded-lg border transition-colors',
          'bg-[var(--color-card)]',
          'focus-within:ring-2 focus-within:ring-amber-400/50 focus-within:border-amber-400/70',
          error
            ? 'border-rose-400 focus-within:ring-rose-300/50 focus-within:border-rose-400'
            : 'border-[var(--color-border)] hover:border-gray-400/70',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {Icon && (
          <span className="flex items-center justify-center w-9 shrink-0 pointer-events-none">
            <Icon size={14} className="text-gray-400" />
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={type === 'password' ? 'current-password' : undefined}
          className={[
            'flex-1 bg-transparent text-sm outline-none',
            'text-[var(--color-text-primary)] placeholder:text-gray-400',
            'disabled:cursor-not-allowed',
            rightSlot ? 'pr-1' : 'pr-3',
          ].join(' ')}
        />
        {rightSlot && (
          <span className="flex items-center justify-center w-9 shrink-0">
            {rightSlot}
          </span>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-rose-500 font-medium leading-tight">{error}</p>
      )}
    </div>
  );
}

/* ─── PwToggle ───────────────────────────────────────────────────────────── */
function PwToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}

/* ─── OAuthButton ────────────────────────────────────────────────────────── */
function OAuthButton({ icon, label, onClick, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'w-full flex items-center justify-center gap-2.5',
        'h-10 px-4 rounded-lg border text-xs font-semibold',
        'transition-all select-none',
        disabled || loading
          ? 'opacity-40 cursor-not-allowed border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-card)]'
          : 'border-[var(--color-border)] text-[var(--color-text-primary)] bg-[var(--color-card)] hover:bg-gray-100/30 dark:hover:bg-gray-700/40',
      ].join(' ')}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : icon}
      <span>{label}</span>
    </button>
  );
}

/* ─── Google icon ────────────────────────────────────────────────────────── */
const GoogleIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/* ─── GitHub icon ────────────────────────────────────────────────────────── */
const GitHubIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

/* ─── OR Divider ─────────────────────────────────────────────────────────── */
function OrDivider({ label = 'or' }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)] select-none">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  );
}

/* ─── AuthModal (main export) ────────────────────────────────────────────── */
export default function AuthModal() {
  const {
    user,
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    sessionExpired,
    clearSessionExpired,
  } = useAuth();

  // login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  // signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [signupErrors, setSignupErrors] = useState({});

  // shared
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'github' | null

  // Escape closes modal
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeAuthModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthModalOpen, closeAuthModal]);

  // Lock body scroll
  useEffect(() => {
    if (!isAuthModalOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isAuthModalOpen]);

  // Check for OAuth failure flag in URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'failed') {
      setApiError('OAuth authentication failed. Please sign in with email/password.'); // eslint-disable-line react-hooks/set-state-in-effect
      // Clean query parameter from address bar
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // All hooks above — safe to early-return
  if (!isAuthModalOpen || user) return null;

  /* ── helpers ─────────────────────────────────────────────────────────── */
  const handleGoogleOAuth = () => {
    setOauthLoading('google');
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`;
  };

  const handleGithubOAuth = () => {
    setOauthLoading('github');
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/github`;
  };
  const clearError = () => {
    if (sessionExpired) clearSessionExpired();
    setApiError('');
  };

  const switchTab = (tab) => {
    setAuthModalTab(tab);
    setApiError('');
    setLoginErrors({});
    setSignupErrors({});
    clearError();
  };

  /* ── login ───────────────────────────────────────────────────────────── */
  const validateLogin = () => {
    const e = {};
    if (!loginEmail.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) e.email = 'Enter a valid email.';
    if (!loginPassword) e.password = 'Password is required.';
    setLoginErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async (ev) => {
    ev.preventDefault();
    clearError();
    if (!validateLogin()) return;
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setApiError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── signup ──────────────────────────────────────────────────────────── */
  const validateSignup = () => {
    const e = {};
    if (!signupName.trim()) e.name = 'Full name is required.';
    if (!signupEmail.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(signupEmail)) e.email = 'Enter a valid email.';
    if (!signupPassword) {
      e.password = 'Password is required.';
    } else if (signupPassword.length < 8) {
      e.password = 'Min 8 characters.';
    } else if (!/[A-Z]/.test(signupPassword)) {
      e.password = 'Needs an uppercase letter.';
    } else if (!/[a-z]/.test(signupPassword)) {
      e.password = 'Needs a lowercase letter.';
    } else if (!/\d/.test(signupPassword)) {
      e.password = 'Needs a digit.';
    }
    if (!signupConfirm) e.confirm = 'Please confirm your password.';
    else if (signupPassword !== signupConfirm) e.confirm = 'Passwords do not match.';
    setSignupErrors(e);
    return !Object.keys(e).length;
  };

  const handleSignup = async (ev) => {
    ev.preventDefault();
    clearError();
    if (!validateSignup()) return;
    setIsLoading(true);
    try {
      await register(signupName, signupEmail, signupPassword, signupConfirm);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={closeAuthModal}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[420px] rounded-2xl border shadow-2xl z-10 overflow-hidden"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Close */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 p-1.5 rounded-full z-20 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Close"
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <X size={17} />
        </button>

        {/* Back arrow (login / signup only) */}
        {authModalTab !== 'welcome' && (
          <button
            onClick={() => switchTab('welcome')}
            className="absolute left-4 top-4 p-1.5 rounded-full z-20 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Back"
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <ArrowLeft size={17} />
          </button>
        )}

        <div className="px-8 pt-8 pb-7">

          {/* Brand */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
              style={{ background: '#FBBF24' }}
            >
              <span className="text-gray-900 font-black text-sm leading-none">S</span>
            </div>
            <h1
              className="text-[17px] font-extrabold tracking-tight leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              StaySense AI
            </h1>
          </div>



          {/* API error banner */}
          {apiError && (
            <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg border border-rose-300/60 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-700 dark:text-rose-400">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <p className="text-xs font-semibold leading-snug">{apiError}</p>
            </div>
          )}

          {/* ── WELCOME ─────────────────────────────────────────────────── */}
          {authModalTab === 'welcome' && (
            <div className="space-y-5">
              <div className="text-center space-y-1.5">
                <h2
                  className="text-[15px] font-bold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >

                </h2>
                <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Sign in or create an account
                </p>
              </div>

              {/* OAuth */}
              <div className="space-y-2">
                <OAuthButton
                  icon={GoogleIcon}
                  label="Continue with Google"
                  loading={oauthLoading === 'google'}
                  onClick={handleGoogleOAuth}
                />
                <OAuthButton
                  icon={<span style={{ color: 'var(--color-text-primary)' }}>{GitHubIcon}</span>}
                  label="Continue with GitHub"
                  loading={oauthLoading === 'github'}
                  onClick={handleGithubOAuth}
                />
              </div>



              {/* Email CTAs */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="welcome-signin"
                  onClick={() => switchTab('login')}
                  className="h-10 rounded-lg border text-xs font-bold transition-all"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-card)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card)'; }}
                >
                  Sign In
                </button>
                <button
                  id="welcome-signup"
                  onClick={() => switchTab('signup')}
                  className="h-10 rounded-lg text-xs font-bold transition-all text-gray-900"
                  style={{ background: '#FBBF24' }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.93)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* ── SIGN IN ─────────────────────────────────────────────────── */}
          {authModalTab === 'login' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Sign In
                </h2>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Enter your credentials to continue
                </p>
              </div>

              {/* OAuth — also on sign-in screen */}
              <div className="space-y-2">
                <OAuthButton
                  icon={GoogleIcon}
                  label="Continue with Google"
                  loading={oauthLoading === 'google'}
                  onClick={handleGoogleOAuth}
                />
                <OAuthButton
                  icon={<span style={{ color: 'var(--color-text-primary)' }}>{GitHubIcon}</span>}
                  label="Continue with GitHub"
                  loading={oauthLoading === 'github'}
                  onClick={handleGithubOAuth}
                />
              </div>

              <OrDivider />

              <form onSubmit={handleLogin} noValidate className="space-y-3">
                <AuthField
                  id="modal-login-email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); clearError(); }}
                  icon={Mail}
                  error={loginErrors.email}
                  disabled={isLoading}
                />
                <AuthField
                  id="modal-login-password"
                  label="Password"
                  type={showLoginPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); clearError(); }}
                  icon={Lock}
                  error={loginErrors.password}
                  disabled={isLoading}
                  rightSlot={<PwToggle show={showLoginPw} onToggle={() => setShowLoginPw(p => !p)} />}
                />

                <button
                  id="modal-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-1 rounded-lg text-xs font-bold text-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: '#FBBF24' }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.filter = 'brightness(0.93)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                  {isLoading ? <><Spinner /> Signing in…</> : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                No account?{' '}
                <button
                  onClick={() => switchTab('signup')}
                  className="font-bold hover:underline"
                  style={{ color: '#FBBF24' }}
                >
                  Create one
                </button>
              </p>
            </div>
          )}

          {/* ── SIGN UP ─────────────────────────────────────────────────── */}
          {authModalTab === 'signup' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Create Account
                </h2>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Set up your AI workspace in seconds
                </p>
              </div>

              {/* OAuth — also on signup screen */}
              <div className="space-y-2">
                <OAuthButton
                  icon={GoogleIcon}
                  label="Continue with Google"
                  loading={oauthLoading === 'google'}
                  onClick={handleGoogleOAuth}
                />
                <OAuthButton
                  icon={<span style={{ color: 'var(--color-text-primary)' }}>{GitHubIcon}</span>}
                  label="Continue with GitHub"
                  loading={oauthLoading === 'github'}
                  onClick={handleGithubOAuth}
                />
              </div>

              <OrDivider />

              <form onSubmit={handleSignup} noValidate className="space-y-3">
                <AuthField
                  id="modal-signup-name"
                  label="Full Name"
                  type="text"
                  placeholder="Your full name"
                  value={signupName}
                  onChange={(e) => { setSignupName(e.target.value); clearError(); }}
                  icon={UserIcon}
                  error={signupErrors.name}
                  disabled={isLoading}
                />
                <AuthField
                  id="modal-signup-email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => { setSignupEmail(e.target.value); clearError(); }}
                  icon={Mail}
                  error={signupErrors.email}
                  disabled={isLoading}
                />
                <AuthField
                  id="modal-signup-password"
                  label="Password"
                  type={showSignupPw ? 'text' : 'password'}
                  placeholder="Min 8 chars, A–Z a–z 0–9"
                  value={signupPassword}
                  onChange={(e) => { setSignupPassword(e.target.value); clearError(); }}
                  icon={Lock}
                  error={signupErrors.password}
                  disabled={isLoading}
                  rightSlot={<PwToggle show={showSignupPw} onToggle={() => setShowSignupPw(p => !p)} />}
                />
                <AuthField
                  id="modal-signup-confirm"
                  label="Confirm Password"
                  type={showSignupConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={signupConfirm}
                  onChange={(e) => { setSignupConfirm(e.target.value); clearError(); }}
                  icon={Lock}
                  error={signupErrors.confirm}
                  disabled={isLoading}
                  rightSlot={<PwToggle show={showSignupConfirm} onToggle={() => setShowSignupConfirm(p => !p)} />}
                />

                <button
                  id="modal-signup-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-1 rounded-lg text-xs font-bold text-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: '#FBBF24' }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.filter = 'brightness(0.93)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                  {isLoading ? <><Spinner /> Creating account…</> : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Already have an account?{' '}
                <button
                  onClick={() => switchTab('login')}
                  className="font-bold hover:underline"
                  style={{ color: '#FBBF24' }}
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
