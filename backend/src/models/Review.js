const { Schema, model } = require("mongoose");

/**
 * Review — stores a single classified guest review.
 *
 * Each review belongs to an AnalysisSession (via sessionId / requestId).
 * The sentiment and theme enums mirror the values in config.allowedSentiments
 * and config.allowedThemes to keep the database consistent with the LLM output.
 */
const ReviewSchema = new Schema(
  {
    // ── Parent session reference ────────────────────────
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "AnalysisSession",
      required: true,
      index: true,
    },
    requestId: {
      type: String,
      required: true,
      index: true,
    },

    // ── Review data (from AI classification) ────────────
    review: {
      type: String,
      required: true,
    },
    sentiment: {
      type: String,
      required: true,
      enum: ["Positive", "Neutral", "Negative"],
    },
    theme: {
      type: String,
      required: true,
      enum: ["Food", "Host", "Location", "Cleanliness", "Value", "Experience"],
    },
    response: {
      type: String,
      required: true,
    },

    // ── Error tracking ──────────────────────────────────
    // If the AI classification failed for this review, store the error.
    // In this case sentiment/theme/response are not required.
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// ── Indexes for common query patterns ───────────────────
ReviewSchema.index({ sentiment: 1, theme: 1 });
ReviewSchema.index({ createdAt: -1 });

module.exports = model("Review", ReviewSchema);
