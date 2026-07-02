const jwt = require("jsonwebtoken");
const config = require("../config");
const AppError = require("./AppError");

/**
 * JWT utilities — pure functions, no side effects.
 * Config values are read from the central config object.
 */

/**
 * Sign a new JWT token.
 *
 * @param {object} payload — Data to embed in the token (e.g. { id, role })
 * @returns {string} Signed JWT string
 */
function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verify a JWT token and return the decoded payload.
 * Throws an AppError with 401 status on failure.
 *
 * @param {string} token — Raw JWT string
 * @returns {object} Decoded payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Your session has expired. Please log in again.", 401, "TOKEN_EXPIRED");
    }
    throw new AppError("Invalid authentication token.", 401, "TOKEN_INVALID");
  }
}

module.exports = { signToken, verifyToken };
