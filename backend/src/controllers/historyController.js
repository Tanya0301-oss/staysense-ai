const {
  listSessions,
  getSessionByRequestId,
  getStats,
  deleteSession,
  getAlertsService,
  markAlertsReadService,
  getWeeklySummaryService,
  getTrendsService,
} = require("../services/reviewService");
const { isConnected } = require("../config/database");
const AppError = require("../utils/AppError");

/**
 * GET /api/history
 *
 * List all past analysis sessions for the authenticated user, paginated.
 * Query params: ?page=1&limit=20
 */
async function getSessions(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await listSessions(page, limit, req.user._id);

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
 * Scoped to the authenticated user — cannot read another user's session.
 */
async function getSession(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const { requestId } = req.params;
    const session = await getSessionByRequestId(requestId, req.user._id);

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
 * Aggregate statistics across the authenticated user's stored reviews only.
 */
async function getStatsSummary(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const stats = await getStats(req.user._id);

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
 * Scoped to the authenticated user — cannot delete another user's session.
 */
async function removeSession(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const { requestId } = req.params;
    const result = await deleteSession(requestId, req.user._id);

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

/**
 * GET /api/history/alerts
 *
 * Retrieve dynamic, data-driven alerts from the authenticated user's historical reviews.
 */
async function getAlerts(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const alerts = await getAlertsService(req.user._id);

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/history/weekly-summary
 *
 * Retrieve weekly management summary statistics for the authenticated user.
 */
async function getWeeklySummary(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const summary = await getWeeklySummaryService(req.user._id);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/history/trends
 *
 * Retrieve daily historical trend data for the authenticated user's sessions.
 */
async function getTrends(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const trends = await getTrendsService(req.user._id);

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/history/alerts/read
 *
 * Mark one or more alerts as read for the authenticated user only.
 * Body: { alertIds: string[] }
 */
async function markAlertsRead(req, res, next) {
  try {
    if (!isConnected()) {
      throw new AppError("Database is not connected", 503, "DB_UNAVAILABLE");
    }

    const { alertIds } = req.body;
    if (!Array.isArray(alertIds)) {
      throw new AppError("alertIds must be an array", 400, "INVALID_INPUT");
    }

    await markAlertsReadService(alertIds, req.user._id);

    res.status(200).json({
      success: true,
      message: `Marked ${alertIds.length} alert(s) as read`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSessions,
  getSession,
  getStatsSummary,
  removeSession,
  getAlerts,
  markAlertsRead,
  getWeeklySummary,
  getTrends,
};
