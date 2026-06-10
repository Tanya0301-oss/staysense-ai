const {
  listSessions,
  getSessionByRequestId,
  getStats,
  deleteSession,
} = require("../services/reviewService");
const { isConnected } = require("../config/database");
const AppError = require("../utils/AppError");

/**
 * GET /api/history
 *
 * List all past analysis sessions, paginated.
 * Query params: ?page=1&limit=20
 */
async function getSessions(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await listSessions(page, limit);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/history/:requestId
 *
 * Get a single analysis session with all its review details.
 */
async function getSession(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const { requestId } = req.params;
    const session = await getSessionByRequestId(requestId);

    if (!session) {
      throw new AppError(
        `Session not found: ${requestId}`,
        404,
        "SESSION_NOT_FOUND"
      );
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/history/stats/summary
 *
 * Aggregate statistics across all stored reviews.
 */
async function getStatsSummary(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const stats = await getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/history/:requestId
 *
 * Delete an analysis session and all its child reviews.
 */
async function removeSession(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const { requestId } = req.params;
    const result = await deleteSession(requestId);

    if (!result) {
      throw new AppError(
        `Session not found: ${requestId}`,
        404,
        "SESSION_NOT_FOUND"
      );
    }

    res.status(200).json({
      success: true,
      message: "Session deleted successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSessions, getSession, getStatsSummary, removeSession };
