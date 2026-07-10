const { loginUser, registerUser, getMe } = require("../services/authService");
const config = require("../config");
const AppError = require("../utils/AppError");
const passport = require("../config/passport");
const { signToken } = require("../utils/jwt");
const logger = require("../utils/logger");

// ── Cookie configuration ──────────────────────────────────
/**
 * Returns cookie options based on environment.
 * In production: secure=true (HTTPS only), sameSite=strict.
 * In development: secure=false (allows HTTP), sameSite=lax.
 */
function getCookieOptions() {
  const expiresInMs = parseDurationToMs(config.jwt.expiresIn);
  return {
    httpOnly: true,                      // Not accessible via document.cookie
    secure: config.cookie.secure,        // HTTPS only in production
    sameSite: config.cookie.sameSite,    // CSRF protection
    maxAge: expiresInMs,                 // Cookie lifetime matches token
    path: "/",
  };
}

/**
 * Convert a JWT duration string (e.g. "7d", "24h") to milliseconds.
 * Falls back to 7 days if format is unrecognised.
 *
 * @param {string} duration
 * @returns {number}
 */
function parseDurationToMs(duration) {
  if (!duration) return 7 * 24 * 60 * 60 * 1000;
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (multipliers[unit] || 86_400_000);
}

// ── Controllers ───────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Authenticates the user, issues a JWT stored in an HTTP-only cookie.
 * Returns the user object (never the raw token in the body).
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Basic presence validation before hitting the service
    if (!email || !password) {
      throw new AppError("Email and password are required.", 400, "MISSING_CREDENTIALS");
    }

    const { token, user } = await loginUser(email, password);

    // Set JWT as HTTP-only cookie — never accessible via JavaScript
    res.cookie("token", token, getCookieOptions());

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie. Requires valid auth (protect middleware).
 */
async function logout(req, res, next) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Requires valid auth (protect middleware).
 */
async function me(req, res, next) {
  try {
    // req.user is attached by authMiddleware.protect
    const user = await getMe(req.user._id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/register
 *
 * Creates a new user account and automatically logs them in.
 * Issues a JWT stored in an HTTP-only cookie so the user
 * is immediately authenticated — no separate login required.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password) {
      throw new AppError("Name, email, and password are required.", 400, "MISSING_FIELDS");
    }

    // Confirm password must match
    if (password !== confirmPassword) {
      throw new AppError("Passwords do not match.", 400, "PASSWORD_MISMATCH");
    }

    // Password strength checks
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters.", 400, "WEAK_PASSWORD");
    }
    if (!/[A-Z]/.test(password)) {
      throw new AppError("Password must contain at least one uppercase letter.", 400, "WEAK_PASSWORD");
    }
    if (!/[a-z]/.test(password)) {
      throw new AppError("Password must contain at least one lowercase letter.", 400, "WEAK_PASSWORD");
    }
    if (!/\d/.test(password)) {
      throw new AppError("Password must contain at least one digit.", 400, "WEAK_PASSWORD");
    }

    const { token, user } = await registerUser(name, email, password, role);

    // Auto-login: set JWT as HTTP-only cookie immediately after registration
    res.cookie("token", token, getCookieOptions());

    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// ── Google OAuth Handlers ──────────────────────────────────────────────────────────
function googleAuth(req, res, next) {
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
}

function googleCallback(req, res, next) {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      logger.error("Google OAuth authentication failed", { error: err?.message || info });
      return res.redirect(`${config.cors.origin}/?oauth=failed`);
    }

    try {
      const token = signToken({ id: user._id, role: user.role });
      res.cookie("token", token, getCookieOptions());
      return res.redirect(config.cors.origin);
    } catch (tokenErr) {
      return next(tokenErr);
    }
  })(req, res, next);
}

// ── GitHub OAuth Handlers ──────────────────────────────────────────────────────────
function githubAuth(req, res, next) {
  passport.authenticate("github", { session: false })(req, res, next);
}

function githubCallback(req, res, next) {
  passport.authenticate("github", { session: false }, (err, user, info) => {
    if (err || !user) {
      logger.error("GitHub OAuth authentication failed", { error: err?.message || info });
      return res.redirect(`${config.cors.origin}/?oauth=failed`);
    }

    try {
      const token = signToken({ id: user._id, role: user.role });
      res.cookie("token", token, getCookieOptions());
      return res.redirect(config.cors.origin);
    } catch (tokenErr) {
      return next(tokenErr);
    }
  })(req, res, next);
}

module.exports = { login, logout, me, register, googleAuth, googleCallback, githubAuth, githubCallback };
