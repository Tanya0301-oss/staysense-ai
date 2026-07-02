const { Schema, model } = require("mongoose");

/**
 * AnalysisSession — groups reviews from a single POST /api/reviews/analyze call.
 *
 * Each session is identified by the UUID requestId generated in reviewController.
 * It holds summary counts and references to the individual Review documents.
 */
const AnalysisSessionSchema = new Schema(
  {
    // ── Identifiers ─────────────────────────────────────
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ── Owner reference ──────────────────────────────────
    // Every session belongs to exactly one authenticated user.
    // required: false during initial migration — tighten after running migrateSessionsToUser.js
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // ── Summary counts ──────────────────────────────────
    reviewCount: {
      type: Number,
      required: true,
    },
    successCount: {
      type: Number,
      required: true,
    },
    failedCount: {
      type: Number,
      default: 0,
    },

    // ── Child review references ─────────────────────────
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// ── Index for listing sessions newest-first ─────────────
AnalysisSessionSchema.index({ createdAt: -1 });

module.exports = model("AnalysisSession", AnalysisSessionSchema);
