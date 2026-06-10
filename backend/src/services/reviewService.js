const Review = require("../models/Review");
const AnalysisSession = require("../models/AnalysisSession");
const { isConnected } = require("../config/database");
const logger = require("../utils/logger");

// ── Write Operations ──────────────────────────────────────

/**
 * Persist an analysis result to MongoDB.
 *
 * Creates an AnalysisSession document and individual Review documents
 * for each classified review in the batch.
 *
 * @param {string} requestId — UUID from the controller
 * @param {Array<{review: string, sentiment?: string, theme?: string, response?: string, error?: string}>} results
 * @returns {Promise<{sessionId: string, saved: number}>}
 */
async function saveAnalysis(requestId, results) {
  if (!isConnected()) {
    logger.warn("MongoDB not connected — skipping persistence", { requestId });
    return null;
  }

  const successResults = results.filter((r) => !r.error);
  const failedResults = results.filter((r) => r.error);

  // 1. Create the session document first (we need its _id for reviews)
  const session = await AnalysisSession.create({
    requestId,
    reviewCount: results.length,
    successCount: successResults.length,
    failedCount: failedResults.length,
    reviews: [], // will be populated after review docs are created
  });

  // 2. Create all review documents
  const reviewDocs = await Review.insertMany(
    results.map((r) => ({
      sessionId: session._id,
      requestId,
      review: r.review,
      sentiment: r.error ? "Neutral" : r.sentiment, // default for failed reviews
      theme: r.error ? "Experience" : r.theme, // default for failed reviews
      response: r.error ? "" : r.response,
      error: r.error || null,
    }))
  );

  // 3. Update session with review references
  session.reviews = reviewDocs.map((doc) => doc._id);
  await session.save();

  logger.info("Analysis persisted to MongoDB", {
    requestId,
    sessionId: session._id.toString(),
    reviewsSaved: reviewDocs.length,
  });

  return {
    sessionId: session._id.toString(),
    saved: reviewDocs.length,
  };
}

// ── Read Operations ───────────────────────────────────────

/**
 * List all analysis sessions, paginated, newest first.
 *
 * @param {number} page — 1-indexed page number
 * @param {number} limit — items per page
 * @returns {Promise<{sessions: Array, total: number, page: number, totalPages: number}>}
 */
async function listSessions(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    AnalysisSession.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reviews")
      .lean(),
    AnalysisSession.countDocuments(),
  ]);

  return {
    sessions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single analysis session with all its review details.
 *
 * @param {string} requestId — The UUID of the session
 * @returns {Promise<object|null>}
 */
async function getSessionByRequestId(requestId) {
  const session = await AnalysisSession.findOne({ requestId })
    .populate("reviews")
    .lean();

  return session;
}

/**
 * Aggregate statistics across all stored reviews.
 *
 * Returns total counts, sentiment breakdown, and theme breakdown.
 *
 * @returns {Promise<object>}
 */
async function getStats() {
  const [
    totalSessions,
    totalReviews,
    sentimentBreakdown,
    themeBreakdown,
  ] = await Promise.all([
    AnalysisSession.countDocuments(),
    Review.countDocuments({ error: null }),
    Review.aggregate([
      { $match: { error: null } },
      { $group: { _id: "$sentiment", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Review.aggregate([
      { $match: { error: null } },
      { $group: { _id: "$theme", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Convert arrays to objects for cleaner API response
  const sentiments = {};
  sentimentBreakdown.forEach((s) => {
    sentiments[s._id] = s.count;
  });

  const themes = {};
  themeBreakdown.forEach((t) => {
    themes[t._id] = t.count;
  });

  return {
    totalSessions,
    totalReviews,
    sentiments,
    themes,
  };
}

// ── Delete Operations ─────────────────────────────────────

/**
 * Delete an analysis session and all its child review documents.
 *
 * @param {string} requestId — The UUID of the session to delete
 * @returns {Promise<{deletedSession: boolean, deletedReviews: number}>}
 */
async function deleteSession(requestId) {
  const session = await AnalysisSession.findOne({ requestId });

  if (!session) {
    return null;
  }

  // Delete all child reviews
  const deleteResult = await Review.deleteMany({ sessionId: session._id });

  // Delete the session itself
  await AnalysisSession.deleteOne({ _id: session._id });

  logger.info("Analysis session deleted", {
    requestId,
    deletedReviews: deleteResult.deletedCount,
  });

  return {
    deletedSession: true,
    deletedReviews: deleteResult.deletedCount,
  };
}

module.exports = {
  saveAnalysis,
  listSessions,
  getSessionByRequestId,
  getStats,
  deleteSession,
};
