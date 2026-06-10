const AppError = require("../utils/AppError");
const config = require("../config");

const MIN_REVIEW_LENGTH = 5;

/**
 * Validates the request body for the review analysis endpoints.
 *
 * Accepts two formats:
 *   1. { "review": "single review text" }
 *   2. { "reviews": "line1\nline2\nline3" }  — newline-separated batch
 *   3. { "reviews": ["review1", "review2"] } — array batch
 *
 * Normalises both into req.reviewTexts (string[]) for the controller.
 */
function validateReviewInput(req, _res, next) {
  const { review, reviews } = req.body;

  // ── Determine input mode ──────────────────────────────
  let texts = [];

  if (typeof review === "string") {
    texts = [review];
  } else if (typeof reviews === "string") {
    // Newline-separated batch
    texts = reviews.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  } else if (Array.isArray(reviews)) {
    texts = reviews.map((r) => String(r).trim()).filter(Boolean);
  } else {
    return next(
      new AppError(
        'Request body must contain "review" (string) or "reviews" (string | string[])',
        400,
        "INVALID_INPUT"
      )
    );
  }

  // ── Empty check ────────────────────────────────────────
  if (texts.length === 0) {
    return next(
      new AppError("No reviews provided", 400, "EMPTY_INPUT")
    );
  }

  // ── Batch size check ───────────────────────────────────
  if (texts.length > config.batch.maxReviews) {
    return next(
      new AppError(
        `Too many reviews. Maximum ${config.batch.maxReviews} per request.`,
        400,
        "BATCH_TOO_LARGE"
      )
    );
  }

  // ── Per-review validation ──────────────────────────────
  const tooShort = texts.filter((t) => t.length < MIN_REVIEW_LENGTH);
  if (tooShort.length > 0) {
    return next(
      new AppError(
        `${tooShort.length} review(s) are too short (minimum ${MIN_REVIEW_LENGTH} characters). First offending review: "${tooShort[0]}"`,
        400,
        "REVIEW_TOO_SHORT"
      )
    );
  }

  // Attach normalised data for downstream use
  req.reviewTexts = texts;
  next();
}

module.exports = { validateReviewInput };
