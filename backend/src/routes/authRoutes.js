const { Router } = require("express");
const { login, logout, me, register } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = Router();

/**
 * Auth Routes
 *
 * POST   /api/auth/login     — Authenticate and receive JWT cookie
 * POST   /api/auth/logout    — Clear JWT cookie (requires auth)
 * GET    /api/auth/me        — Get current user profile (requires auth)
 * POST   /api/auth/register  — Create a new user (dev/admin only, not public)
 */

// Public routes (no auth required)
router.post("/login", login);

// Protected routes (JWT cookie required)
router.post("/logout", protect, logout);
router.get("/me", protect, me);

// Internal/dev-only route — provision new users (not exposed in frontend)
router.post("/register", register);

module.exports = router;
