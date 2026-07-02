const { Router } = require("express");
const { analyzeReviews, healthCheck } = require("../controllers/reviewController");
const { validateReviewInput } = require("../middleware/validateReview");
const { protect } = require("../middleware/authMiddleware");

const router = Router();

// Health check — public so monitoring tools can reach it without auth
router.get("/health", healthCheck);

// Analyze reviews — auth required so every session is bound to a user
router.post("/analyze", protect, validateReviewInput, analyzeReviews);

module.exports = router;
