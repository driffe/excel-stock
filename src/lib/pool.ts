/**
 * Like Promise.allSettled(items.map(fn)) but with a concurrency cap, so we never
 * fire a big burst of requests at once. Results are returned in input order.
 *
 * Free-tier quote APIs (e.g. Finnhub) enforce per-second / per-minute limits and
 * answer bursts with 429s — capping concurrency keeps live mode under the limit.
 */
export async function mapPoolSettled<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results = new Array<PromiseSettledResult<R>>(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const idx = next++
      try {
        results[idx] = { status: 'fulfilled', value: await fn(items[idx], idx) }
      } catch (reason) {
        results[idx] = { status: 'rejected', reason }
      }
    }
  }

  const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker)
  await Promise.all(workers)
  return results
}
