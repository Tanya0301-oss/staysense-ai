const Review = require("../models/Review");
const AnalysisSession = require("../models/AnalysisSession");
const AlertReadState = require("../models/AlertReadState");
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

// ── Intelligence Layer Operations ────────────────────────

/**
 * Derives the Risk Score for a review based on its sentiment and language.
 */
function getRiskScore(row) {
  if (row.error) return 'N/A';
  const sentiment = row.sentiment;
  const text = (row.review || '').toLowerCase();
  
  if (sentiment === 'Positive') {
    return 'Low Risk';
  }
  
  if (sentiment === 'Neutral') {
    const mediumRiskTriggers = ["unprofessional", "slow", "delay", "poor", "dirty", "smell", "noisy", "loud", "expensive", "wait"];
    const hasTrigger = mediumRiskTriggers.some(word => text.includes(word));
    return hasTrigger ? 'Medium Risk' : 'Low Risk';
  }
  
  if (sentiment === 'Negative') {
    const highRiskTriggers = ["terrible", "worst", "dirty", "ruined", "disaster", "danger", "unprofessional", "rude", "cancel", "refund", "never", "charge", "stole", "smell", "scam", "leak", "bug", "insect", "broken", "cheated", "liar"];
    const hasTrigger = highRiskTriggers.some(word => text.includes(word)) || text.length > 80;
    return hasTrigger ? 'High Risk' : 'Medium Risk';
  }
  
  return 'Low Risk';
}

/**
 * Generate data-driven alerts from historical reviews in the last 14 days.
 * Annotates each alert with its MongoDB-persisted read state.
 */
async function getAlertsService() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Fallback: if no reviews in last 14 days, use latest 50 reviews for alerts
  let reviews14Days = await Review.find({
    error: null,
    createdAt: { $gte: fourteenDaysAgo }
  }).sort({ createdAt: -1 }).lean();

  if (reviews14Days.length === 0) {
    reviews14Days = await Review.find({ error: null }).sort({ createdAt: -1 }).limit(50).lean();
  }

  const thisWeekReviews = reviews14Days.filter(r => r.createdAt >= sevenDaysAgo);
  const lastWeekReviews = reviews14Days.filter(r => r.createdAt < sevenDaysAgo);

  // Use all reviews as "this week" when in fallback mode
  const effectiveThisWeek = thisWeekReviews.length > 0 ? thisWeekReviews : reviews14Days;
  const effectiveLastWeek = lastWeekReviews;

  const totalThisWeek = effectiveThisWeek.length;
  const negThisWeek = effectiveThisWeek.filter(r => r.sentiment === 'Negative').length;
  const negPctThisWeek = totalThisWeek > 0 ? (negThisWeek / totalThisWeek) * 100 : 0;

  const totalLastWeek = effectiveLastWeek.length;
  const negLastWeek = effectiveLastWeek.filter(r => r.sentiment === 'Negative').length;
  const negPctLastWeek = totalLastWeek > 0 ? (negLastWeek / totalLastWeek) * 100 : 0;

  const alerts = [];

  // Rule 1: More than 40% of reviews are negative
  if (totalThisWeek >= 3 && negPctThisWeek > 40) {
    alerts.push({
      id: "alert_more_than_40_percent_negative",
      type: "negative_high_pct",
      title: "More than 40% of reviews are negative",
      description: `Critical: Negative sentiment stands at ${negPctThisWeek.toFixed(0)}% with ${negThisWeek} negative reviews.`,
      severity: "High",
      createdAt: now
    });
  }

  // Rule 2: Negative sentiment increased significantly
  if (totalThisWeek >= 3 && totalLastWeek >= 3 && (negPctThisWeek - negPctLastWeek) >= 15) {
    alerts.push({
      id: "alert_negative_sentiment_increased",
      type: "negative_trend_up",
      title: "Negative sentiment increased significantly",
      description: `Negative feedback rose from ${negPctLastWeek.toFixed(0)}% to ${negPctThisWeek.toFixed(0)}%.`,
      severity: "Medium",
      createdAt: now
    });
  }

  // Rule 3: Cleanliness complaints are rising
  const cleanNegThisWeek = effectiveThisWeek.filter(r => r.theme === 'Cleanliness' && r.sentiment === 'Negative').length;
  const cleanNegLastWeek = effectiveLastWeek.filter(r => r.theme === 'Cleanliness' && r.sentiment === 'Negative').length;
  if (cleanNegThisWeek > cleanNegLastWeek && cleanNegThisWeek >= 2) {
    alerts.push({
      id: "alert_cleanliness_complaints_rising",
      type: "cleanliness_complaints_rising",
      title: "Cleanliness complaints are rising",
      description: `Cleanliness complaints increased to ${cleanNegThisWeek} vs ${cleanNegLastWeek} previously.`,
      severity: "High",
      createdAt: now
    });
  }

  // Rule 4: High-risk reviews detected
  const highRiskCount = effectiveThisWeek.filter(r => getRiskScore(r) === 'High Risk').length;
  if (highRiskCount > 0) {
    alerts.push({
      id: "alert_high_risk_reviews_detected",
      type: "high_risk_reviews",
      title: "High-risk reviews detected",
      description: `Action Required: ${highRiskCount} high-risk guest review(s) identified requiring attention.`,
      severity: "High",
      createdAt: now
    });
  }

  // Rule 5: Sudden spike in a specific complaint category
  const themes = ["Food", "Host", "Location", "Cleanliness", "Value", "Experience"];
  themes.forEach(theme => {
    const negThemeThisWeek = effectiveThisWeek.filter(r => r.theme === theme && r.sentiment === 'Negative').length;
    const negThemeLastWeek = effectiveLastWeek.filter(r => r.theme === theme && r.sentiment === 'Negative').length;
    if (negThemeThisWeek - negThemeLastWeek >= 2) {
      alerts.push({
        id: `alert_spike_${theme.toLowerCase()}`,
        type: `spike_${theme.toLowerCase()}`,
        title: `Sudden spike in ${theme} complaints`,
        description: `Negative feedback regarding ${theme} rose to ${negThemeThisWeek} vs ${negThemeLastWeek} previously.`,
        severity: "Medium",
        createdAt: now
      });
    }
  });

  // Fetch read states from MongoDB and annotate alerts
  const alertIds = alerts.map(a => a.id);
  const readStates = await AlertReadState.find({ alertKey: { $in: alertIds } }).lean();
  const readSet = new Set(readStates.map(r => r.alertKey));

  return alerts.map(a => ({ ...a, read: readSet.has(a.id) }));
}

/**
 * Mark one or more alert IDs as read, persisted in MongoDB.
 *
 * @param {string[]} alertKeys - Array of alert ID strings to mark as read
 */
async function markAlertsReadService(alertKeys) {
  if (!Array.isArray(alertKeys) || alertKeys.length === 0) return;
  const ops = alertKeys.map(alertKey => ({
    updateOne: {
      filter: { alertKey },
      update: { $set: { alertKey, readAt: new Date() } },
      upsert: true,
    }
  }));
  await AlertReadState.bulkWrite(ops);
}

/**
 * Generate weekly summary statistics from MongoDB history.
 */
async function getWeeklySummaryService() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let reviews = await Review.find({
    error: null,
    createdAt: { $gte: sevenDaysAgo }
  }).lean();

  // Fallback to latest reviews if there are none in the last 7 days (to make demo/local dev functional)
  let isFallback = false;
  if (reviews.length === 0) {
    reviews = await Review.find({ error: null }).sort({ createdAt: -1 }).limit(50).lean();
    isFallback = true;
  }

  const totalReviews = reviews.length;
  const positive = reviews.filter(r => r.sentiment === 'Positive').length;
  const neutral = reviews.filter(r => r.sentiment === 'Neutral').length;
  const negative = reviews.filter(r => r.sentiment === 'Negative').length;

  const positivePct = totalReviews > 0 ? Math.round((positive / totalReviews) * 100) : 0;
  const neutralPct = totalReviews > 0 ? Math.round((neutral / totalReviews) * 100) : 0;
  const negativePct = totalReviews > 0 ? Math.round((negative / totalReviews) * 100) : 0;

  const themeCounts = {};
  const complaintCounts = {};
  const appreciatedCounts = {};

  reviews.forEach(r => {
    themeCounts[r.theme] = (themeCounts[r.theme] || 0) + 1;
    if (r.sentiment === 'Negative' || r.sentiment === 'Neutral') {
      complaintCounts[r.theme] = (complaintCounts[r.theme] || 0) + 1;
    }
    if (r.sentiment === 'Positive') {
      appreciatedCounts[r.theme] = (appreciatedCounts[r.theme] || 0) + 1;
    }
  });

  const getTopKey = (obj) => {
    let topKey = 'None';
    let maxVal = 0;
    for (const [key, val] of Object.entries(obj)) {
      if (val > maxVal) {
        maxVal = val;
        topKey = key;
      }
    }
    return topKey;
  };

  const topTheme = getTopKey(themeCounts);
  const mostCommonComplaint = getTopKey(complaintCounts);
  const mostAppreciatedCategory = getTopKey(appreciatedCounts);

  let overallHealth = "Good";
  if (totalReviews === 0) {
    overallHealth = "No Data";
  } else if (negativePct > 30) {
    overallHealth = "Poor";
  } else if (negativePct > 15 || positivePct < 60) {
    overallHealth = "Average";
  } else if (positivePct >= 75) {
    overallHealth = "Excellent";
  } else {
    overallHealth = "Good";
  }

  // Calculate comparison against previous session
  const latestSessions = await AnalysisSession.find()
    .sort({ createdAt: -1 })
    .limit(2)
    .populate("reviews")
    .lean();

  let previousPositivePct = null;
  let currentPositivePct = positivePct;
  let change = null;
  let trend = "Stable";

  if (latestSessions.length >= 2) {
    // Current session positive rate
    const curReviews = latestSessions[0].reviews || [];
    const curValid = curReviews.filter(r => !r.error);
    const curTotal = curValid.length;
    const curPos = curValid.filter(r => r.sentiment === 'Positive').length;
    currentPositivePct = curTotal > 0 ? Math.round((curPos / curTotal) * 100) : 0;

    // Previous session positive rate
    const prevReviews = latestSessions[1].reviews || [];
    const prevValid = prevReviews.filter(r => !r.error);
    const prevTotal = prevValid.length;
    const prevPos = prevValid.filter(r => r.sentiment === 'Positive').length;
    previousPositivePct = prevTotal > 0 ? Math.round((prevPos / prevTotal) * 100) : 0;

    change = currentPositivePct - previousPositivePct;
    if (change > 2) {
      trend = "Trend Up";
    } else if (change < -2) {
      trend = "Trend Down";
    } else {
      trend = "Stable";
    }
  }

  return {
    totalReviews,
    positivePct,
    neutralPct,
    negativePct,
    topTheme,
    mostCommonComplaint,
    mostAppreciatedCategory,
    overallHealth,
    isFallback,
    trendInfo: {
      currentPositivePct,
      previousPositivePct,
      change: change !== null ? (change > 0 ? `+${change}` : `${change}`) : null,
      changeVal: change,
      trend
    }
  };
}

/**
 * Retrieve sentiment trends from the latest 5 sessions.
 */
async function getTrendsService() {
  const sessions = await AnalysisSession.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("reviews")
    .lean();

  if (sessions.length < 2) {
    return [];
  }

  // Reverse to chronological order (oldest first)
  const chronological = [...sessions].reverse();

  return chronological.map((session, index) => {
    const reviews = session.reviews || [];
    const validReviews = reviews.filter(r => !r.error);
    const total = validReviews.length;

    const positive = validReviews.filter(r => r.sentiment === 'Positive').length;
    const neutral = validReviews.filter(r => r.sentiment === 'Neutral').length;
    const negative = validReviews.filter(r => r.sentiment === 'Negative').length;

    const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;
    const neutralPct = total > 0 ? Math.round((neutral / total) * 100) : 0;
    const negativePct = total > 0 ? Math.round((negative / total) * 100) : 0;

    const dateStr = new Date(session.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });

    return {
      sessionId: session.requestId,
      name: `Session ${index + 1}`,
      date: dateStr,
      positivePct,
      neutralPct,
      negativePct,
      totalReviews: total
    };
  });
}

module.exports = {
  saveAnalysis,
  listSessions,
  getSessionByRequestId,
  getStats,
  deleteSession,
  getAlertsService,
  markAlertsReadService,
  getWeeklySummaryService,
  getTrendsService,
};
