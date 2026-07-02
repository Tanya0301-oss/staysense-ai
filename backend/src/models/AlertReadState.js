const { Schema, model } = require("mongoose");

/**
 * AlertReadState — tracks which dynamically generated alert IDs
 * have been marked as read, per authenticated user.
 *
 * alertKey is a stable string key like "alert_high_risk_reviews_detected".
 * The compound unique index on { alertKey, user } ensures each user has
 * their own independent read state — one user marking an alert read does
 * not affect another user's view.
 */
const AlertReadStateSchema = new Schema(
  {
    // ── Owner ─────────────────────────────────────────────
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    alertKey: {
      type: String,
      required: true,
      index: true,
    },

    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound unique index: one read-state per alert per user ──
AlertReadStateSchema.index({ alertKey: 1, user: 1 }, { unique: true });

module.exports = model("AlertReadState", AlertReadStateSchema);
