const { Router } = require("express");
const {
  login,
  logout,
  me,
  register,
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = Router();

/**
 * Auth Routes
 *
 * POST   /api/auth/login            — Authenticate and receive JWT cookie
 * POST   /api/auth/logout           — Clear JWT cookie (requires auth)
 * GET    /api/auth/me               — Get current user profile (requires auth)
 * POST   /api/auth/register         — Create a new user (dev/admin only, not public)
 * GET    /api/auth/google           — Start Google OAuth flow
 * GET    /api/auth/google/callback  — Google OAuth callback
 * GET    /api/auth/github           — Start GitHub OAuth flow
 * GET    /api/auth/github/callback  — GitHub OAuth callback
 */

// Public routes (no auth required)
router.post("/login", login);

// OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

// Protected routes (JWT cookie required)
router.post("/logout", protect, logout);
router.get("/me", protect, me);

// Internal/dev-only route — provision new users (not exposed in frontend)
router.post("/register", register);

module.exports = router;
