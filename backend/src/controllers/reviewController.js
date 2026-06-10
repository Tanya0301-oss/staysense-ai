const { v4: uuidv4 } = require("uuid");
const { classifyReview, classifyBatch } = require("../services/aiService");
const { saveAnalysis } = require("../services/reviewService");
const logger = require("../utils/logger");

/**
 * POST /api/reviews/analyze
 *
 * Handles both single and batch review analysis.
 * req.reviewTexts is populated by the validateReview middleware.
 */
async function analyzeReviews(req, res, next) {
  const requestId = uuidv4();
  const reviews = req.reviewTexts;

  logger.info("Analysis request received", {
    requestId,
    reviewCount: reviews.length,
  });

  try {
    let data;

    if (reviews.length === 1) {
      const result = await classifyReview(reviews[0]);
      data = [result];
    } else {
      data = await classifyBatch(reviews);
    }

    logger.info("Analysis complete", { requestId, resultCount: data.length });

    // Save successful review analysis results to MongoDB (blocking)
    try {
      await saveAnalysis(requestId, data);
    } catch (dbErr) {
      logger.error("Failed to save analysis to database", {
        requestId,
        error: dbErr.message,
      });
    }

    res.status(200).json({
      success: true,
      requestId,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reviews/health
 * Simple health check endpoint.
 */
function healthCheck(_req, res) {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}

module.exports = { analyzeReviews, healthCheck };
