/**
 * Runs an array of async tasks with a concurrency cap.
 *
 * @param {Array}    items       — Items to process
 * @param {number}   limit       — Max concurrent tasks
 * @param {Function} iteratee    — async (item, index) => result
 * @returns {Promise<Array<{status: 'fulfilled'|'rejected', value?: any, reason?: any}>>}
 *
 * Returns the same shape as Promise.allSettled so callers can
 * distinguish successes from failures per-item.
 */
async function mapWithConcurrency(items, limit, iteratee) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      try {
        const value = await iteratee(items[idx], idx);
        results[idx] = { status: "fulfilled", value };
      } catch (err) {
        results[idx] = { status: "rejected", reason: err };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

module.exports = { mapWithConcurrency };
