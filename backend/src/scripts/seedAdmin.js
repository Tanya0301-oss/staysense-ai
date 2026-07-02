/**
 * seedAdmin.js — One-time script to create the initial admin user.
 *
 * Usage:
 *   node src/scripts/seedAdmin.js
 *
 * Override defaults via environment variables:
 *   ADMIN_NAME="Jane Smith" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="MyS3cure!" node src/scripts/seedAdmin.js
 *
 * IMPORTANT: Run this ONCE after first deployment, then secure/remove access.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");

// ── Configuration ──────────────────────────────────────────
const ADMIN_NAME     = process.env.ADMIN_NAME     || "Admin User";
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "admin@staysense.ai";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@StaySense1";
const ADMIN_ROLE     = "Admin";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌  MONGODB_URI is not set in .env");
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("✅  Connected.");

  // Check if admin already exists
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log(`ℹ️   Admin user already exists: ${existing.email} (role: ${existing.role})`);
    await mongoose.disconnect();
    return;
  }

  // Create the admin user (password hashed automatically by the pre-save hook)
  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: ADMIN_ROLE,
  });

  console.log("🎉  Admin user created successfully:");
  console.log(`    Name  : ${admin.name}`);
  console.log(`    Email : ${admin.email}`);
  console.log(`    Role  : ${admin.role}`);
  console.log(`    ID    : ${admin._id}`);
  console.log("\n⚠️   Store the credentials safely. The password is hashed — this is the only time you see it in plaintext.");

  await mongoose.disconnect();
  console.log("🔌  Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
