const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User — represents an authenticated SaaS user.
 *
 * Passwords are hashed automatically before save via a pre-save hook.
 * The `toJSON` transform strips the password from all responses so it
 * can never accidentally leak through the API.
 */
const UserSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name must be 100 characters or less"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // ── Authorisation ─────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ["Admin", "Manager", "User"],
        message: "Role must be Admin, Manager, or User",
      },
      default: "User",
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// ── Pre-save hook: hash password before storing ──────────
UserSchema.pre("save", async function () {
  // Only re-hash if the password field has been modified and is present
  if (!this.isModified("password") || !this.password) return;

  const SALT_ROUNDS = 12;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// ── Instance method: compare candidate password ──────────
/**
 * Compares a plaintext candidate against the stored bcrypt hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── toJSON transform: strip password from all outputs ────
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = model("User", UserSchema);
