const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");

/**
 * protect — Authentication middleware.
 *
 * Reads the JWT from the `token` HTTP-only cookie, verifies it,
 * loads the corresponding user from the database, and attaches
 * the user document to `req.user` for downstream use.
 *
 * Rejects requests with a generic 401 if:
 *   - No cookie is present
 *   - The token is invalid or expired
 *   - The user no longer exists in the database
 */
async function protect(req, _res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next(
        new AppError("You are not logged in. Please log in to access this resource.", 401, "NOT_AUTHENTICATED")
      );
    }

    // Verify the token — throws AppError on failure
    const decoded = verifyToken(token);

    // Load the user and verify they still exist
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(
        new AppError("The user belonging to this session no longer exists.", 401, "USER_NOT_FOUND")
      );
    }

    // Attach the full user document for downstream controllers/services
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireRole — Role-based authorization middleware factory.
 *
 * Must be used AFTER protect (which attaches req.user).
 * Returns a middleware that checks if the user's role is in
 * the allowed list. Throws 403 if the role is not permitted.
 *
 * Usage: router.delete('/admin-only', protect, requireRole('Admin'), handler)
 *
 * @param {...string} roles — One or more allowed role names (e.g. 'Admin', 'Manager')
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action.",
          403,
          "FORBIDDEN"
        )
      );
    }
    next();
  };
}

module.exports = { protect, requireRole };
