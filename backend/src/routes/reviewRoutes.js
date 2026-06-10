const { Router } = require("express");
const { analyzeReviews, healthCheck } = require("../controllers/reviewController");
const { validateReviewInput } = require("../middleware/validateReview");

const router = Router();

// Health check
router.get("/health", healthCheck);

// Analyze reviews — validation runs before the controller
router.post("/analyze", validateReviewInput, analyzeReviews);

module.exports = router;
