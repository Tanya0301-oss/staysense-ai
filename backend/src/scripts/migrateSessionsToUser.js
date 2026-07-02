/**
 * migrateSessionsToUser.js — One-time migration script.
 *
 * Finds all AnalysisSession documents that have no `user` field
 * and assigns them to the first Admin user in the database.
 *
 * This preserves all existing historical data while bringing the
 * schema in line with the new multi-user architecture.
 *
 * Usage:
 *   node src/scripts/migrateSessionsToUser.js
 *
 * Safe to run multiple times (idempotent — only touches sessions where user is null/missing).
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const AnalysisSession = require("../models/AnalysisSession");
const User = require("../models/User");

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌  MONGODB_URI is not set in .env");
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("✅  Connected.");

  // Find the first admin user to assign orphaned sessions to
  const adminUser = await User.findOne({ role: "Admin" }).sort({ createdAt: 1 });
  if (!adminUser) {
    console.error("❌  No Admin user found. Run seedAdmin.js first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`👤  Target user for migration: ${adminUser.email} (${adminUser._id})`);

  // Count orphaned sessions (no user field, or user is null)
  const orphanCount = await AnalysisSession.countDocuments({
    $or: [{ user: { $exists: false } }, { user: null }],
  });

  if (orphanCount === 0) {
    console.log("✅  No orphaned sessions found. Migration already complete.");
    await mongoose.disconnect();
    return;
  }

  console.log(`📦  Found ${orphanCount} session(s) without a user. Migrating...`);

  // Bulk update — set user field on all orphaned sessions
  const result = await AnalysisSession.updateMany(
    { $or: [{ user: { $exists: false } }, { user: null }] },
    { $set: { user: adminUser._id } }
  );

  console.log(`🎉  Migration complete:`);
  console.log(`    Sessions updated: ${result.modifiedCount}`);
  console.log(`    Assigned to user: ${adminUser.email}`);

  await mongoose.disconnect();
  console.log("🔌  Disconnected from MongoDB.");
}

migrate().catch((err) => {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
});
