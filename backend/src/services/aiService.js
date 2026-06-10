const Groq = require("groq-sdk");
const config = require("../config");
const { SYSTEM_PROMPT, buildUserPrompt } = require("../prompts/reviewClassifier");
const { mapWithConcurrency } = require("../utils/concurrency");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

// ── Initialize Groq Client (singleton) ─────────────────
const groq = new Groq({ apiKey: config.groq.apiKey });
logger.info("Using Groq API for review classification", { model: config.groq.model });

// ── Helpers ────────────────────────────────────────────

/**
 * Retries an async function with exponential backoff.
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelayMs - Initial delay in milliseconds
 * @returns {Promise}
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelayMs = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      
      // Check if error is 503 (Service Unavailable)
      const is503 = err.status === 503 || err.message?.includes("503") || err.message?.includes("Service Unavailable");
      
      // Don't retry on non-503 errors
      if (!is503) {
        throw err;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        logger.warn(`Max retries (${maxRetries}) exceeded for 503 error`, { message: err.message });
        throw err;
      }
      
      // Calculate delay with exponential backoff: 1s, 2s, 4s, etc.
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      logger.warn(`Gemini 503 error, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`, { 
        message: err.message 
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

/**
 * Attempts to extract a JSON object from a string that may contain
 * markdown fences or other wrapper text.
 */
function extractJSON(raw) {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Last resort: find the first { … } substring
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new AppError(
      "LLM returned non-JSON response",
      502,
      "LLM_INVALID_JSON"
    );
  }
}

/**
 * Validates and normalises the parsed LLM output against allowed enums.
 */
function validateClassification(parsed) {
  const sentiment = config.allowedSentiments.find(
    (s) => s.toLowerCase() === String(parsed.sentiment).toLowerCase()
  );
  const theme = config.allowedThemes.find(
    (t) => t.toLowerCase() === String(parsed.theme).toLowerCase()
  );

  if (!sentiment || !theme) {
    throw new AppError(
      `LLM returned invalid classification: sentiment="${parsed.sentiment}", theme="${parsed.theme}"`,
      502,
      "LLM_INVALID_CLASSIFICATION"
    );
  }

  return {
    sentiment,
    theme,
    response: String(parsed.response || "").trim(),
  };
}

// ── Public API ─────────────────────────────────────────

/**
 * Classify a single review using Groq API.
 * @param {string} reviewText
 * @returns {Promise<{review: string, sentiment: string, theme: string, response: string}>}
 */
async function classifyReview(reviewText) {
  logger.debug("Classifying review", { preview: reviewText.slice(0, 80) });

  try {
    // Retry with backoff for 503 errors
    const raw = await retryWithBackoff(
      async () => {
        const response = await groq.chat.completions.create({
          model: config.groq.model,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: buildUserPrompt(reviewText),
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        // Check if we got a valid response
        if (!response.choices || response.choices.length === 0) {
          logger.error("Groq returned empty response", { response: JSON.stringify(response) });
          throw new AppError(
            "Groq API returned empty response.",
            502,
            "LLM_EMPTY_RESPONSE"
          );
        }

        const content = response.choices[0].message?.content;
        if (!content || content.trim().length === 0) {
          logger.error("Groq returned empty content", { choice: JSON.stringify(response.choices[0]) });
          throw new AppError(
            "Groq API returned empty response content.",
            502,
            "LLM_EMPTY_TEXT"
          );
        }

        return content;
      },
      3,     // maxRetries
      1000   // initialDelayMs
    );

    logger.debug("Raw Groq response", { raw: raw.slice(0, 200) });

    const parsed = extractJSON(raw);
    const validated = validateClassification(parsed);

    return {
      review: reviewText,
      ...validated,
    };
  } catch (err) {
    // Re-throw our own errors as-is
    if (err instanceof AppError) throw err;

    // Groq SDK errors - check error structure
    if (err.status === 429 || err.message?.includes("429")) {
      throw new AppError(
        "Groq rate limit exceeded. Please retry later.",
        429,
        "RATE_LIMIT"
      );
    }

    if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED" || err.type === "request-timeout" || err.message?.includes("timeout")) {
      throw new AppError(
        "Groq request timed out. Please retry.",
        504,
        "LLM_TIMEOUT"
      );
    }

    // Log full error for debugging
    logger.error("Groq API error", {
      message: err.message,
      status: err.status,
      code: err.code,
      errorDetails: err.toString(),
      stack: err.stack,
    });

    throw new AppError(
      `Failed to get classification from Groq API: ${err.message}`,
      502,
      "LLM_ERROR"
    );
  }
}

/**
 * Classify multiple reviews with controlled concurrency.
 * @param {string[]} reviews
 * @returns {Promise<Array<{review: string, sentiment: string, theme: string, response: string}|{review: string, error: string}>>}
 */
async function classifyBatch(reviews) {
  const results = await mapWithConcurrency(
    reviews,
    config.batch.concurrency,
    async (text) => classifyReview(text)
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    logger.warn("Review classification failed", {
      index: i,
      error: r.reason?.message,
    });
    return {
      review: reviews[i],
      error: r.reason?.message || "Classification failed",
    };
  });
}

module.exports = { classifyReview, classifyBatch };
