const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

/**
 * Auth Service — business logic for authentication.
 *
 * All auth errors use the SAME generic message intentionally.
 * Never reveal whether the email exists or the password was wrong.
 */

// ── Generic error used for all auth failures ──────────────
const INVALID_CREDENTIALS_ERROR = new AppError(
  "Invalid email or password.",
  401,
  "INVALID_CREDENTIALS"
);

/**
 * Authenticate a user and return a signed JWT + sanitised user object.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
async function loginUser(email, password) {
  if (!email || !password) {
    throw INVALID_CREDENTIALS_ERROR;
  }

  // Explicitly select password (it's excluded by default via `select: false`)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user) {
    // Use timing-safe comparison even when user doesn't exist
    // to prevent user enumeration via response time differences
    await User.hydrate({ password: "$2b$12$placeholder" }).comparePassword(password).catch(() => {});
    throw INVALID_CREDENTIALS_ERROR;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw INVALID_CREDENTIALS_ERROR;
  }

  const token = signToken({ id: user._id, role: user.role });

  logger.info("User authenticated", { userId: user._id.toString(), email: user.email });

  // Return user without password (toJSON strips it automatically)
  return { token, user: user.toJSON() };
}

/**
 * Register a new user.
 * This endpoint is for internal/admin use only — not exposed publicly.
 *
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {string} [role]
 * @returns {Promise<{ user: object }>}
 */
async function registerUser(name, email, password, role = "Admin") {
  // Check for duplicate email before letting Mongoose throw a cryptic error
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError("A user with this email already exists.", 409, "EMAIL_CONFLICT");
  }

  const user = await User.create({ name, email, password, role });

  logger.info("New user registered", { userId: user._id.toString(), email: user.email, role: user.role });

  return { user: user.toJSON() };
}

/**
 * Return a user's profile by ID.
 * Password is excluded by the model's default projection.
 *
 * @param {string} userId — MongoDB ObjectId string
 * @returns {Promise<object>}
 */
async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }
  return user.toJSON();
}

module.exports = { loginUser, registerUser, getMe };
