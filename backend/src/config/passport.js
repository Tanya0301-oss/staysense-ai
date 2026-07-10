const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const config = require("./index");
const User = require("../models/User");
const logger = require("../utils/logger");

// ── Serialization (not used since we use session: false, but defined for safety) ──
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ── Google Strategy ──────────────────────────────────────────────────────────────
if (config.google.clientId && config.google.clientId !== "google_mock_client_id") {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
          if (!email) {
            return done(new Error("Email not returned by Google OAuth."));
          }

          // 1. Find by googleId
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            return done(null, user);
          }

          // 2. Find by email
          user = await User.findOne({ email });
          if (user) {
            // Associate googleId with existing email account
            user.googleId = profile.id;
            if (!user.name && profile.displayName) {
              user.name = profile.displayName;
            }
            await user.save();
            logger.info("Associated Google OAuth ID with existing email user", { email });
            return done(null, user);
          }

          // 3. Create new user
          user = await User.create({
            name: profile.displayName || profile.name?.givenName || "Google User",
            email,
            googleId: profile.id,
            role: "User",
          });

          logger.info("Created new user via Google OAuth", { email, userId: user._id.toString() });
          return done(null, user);
        } catch (err) {
          logger.error("Error in Google Strategy callback", { error: err.message });
          return done(err);
        }
      }
    )
  );
} else {
  logger.warn("Google OAuth is not configured (missing or mock Client ID)");
}

// ── GitHub Strategy ──────────────────────────────────────────────────────────────
if (config.github.clientId && config.github.clientId !== "github_mock_client_id") {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.github.clientId,
        clientSecret: config.github.clientSecret,
        callbackURL: config.github.callbackUrl,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // GitHub profiles can have null or hidden emails, so handle fallbacks
          let email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
          if (!email) {
            email = `${profile.username || profile.id}@github.noreply.com`;
          }

          // 1. Find by githubId
          let user = await User.findOne({ githubId: profile.id });
          if (user) {
            return done(null, user);
          }

          // 2. Find by email
          user = await User.findOne({ email });
          if (user) {
            // Associate githubId with existing email account
            user.githubId = profile.id;
            if (!user.name && (profile.displayName || profile.username)) {
              user.name = profile.displayName || profile.username;
            }
            await user.save();
            logger.info("Associated GitHub OAuth ID with existing email user", { email });
            return done(null, user);
          }

          // 3. Create new user
          user = await User.create({
            name: profile.displayName || profile.username || "GitHub User",
            email,
            githubId: profile.id,
            role: "User",
          });

          logger.info("Created new user via GitHub OAuth", { email, userId: user._id.toString() });
          return done(null, user);
        } catch (err) {
          logger.error("Error in GitHub Strategy callback", { error: err.message });
          return done(err);
        }
      }
    )
  );
} else {
  logger.warn("GitHub OAuth is not configured (missing or mock Client ID)");
}

module.exports = passport;
