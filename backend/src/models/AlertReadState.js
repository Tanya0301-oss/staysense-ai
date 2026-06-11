const { Schema, model } = require("mongoose");

/**
 * AlertReadState — tracks which dynamically generated alert IDs
 * have been marked as read by the user.
 *
 * alertId is a stable string key like "alert_high_risk_reviews_detected"
 * combined with a date bucket (e.g. 2024-06-11) so reads survive server restarts
 * but reset naturally when the underlying data window shifts.
 */
const AlertReadStateSchema = new Schema(
  {
    alertKey: {
      type: String,
      required: true,
      unique: true,
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

module.exports = model("AlertReadState", AlertReadStateSchema);
