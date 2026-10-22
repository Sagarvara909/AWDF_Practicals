import NodeCache from 'node-cache'

/**
 * Practical 9: In-Memory Caching Module
 * Configured with standard TTL of 60 seconds as required.
 * Provides user-scoped cache keys, hit/miss metric tracking,
 * and comprehensive invalidation helpers.
 */
export const taskCache = new NodeCache({
  stdTTL: 60, // 60 seconds time-to-live
  checkperiod: 120, // sweep expired items every 120 seconds
  useClones: true, // returns clone to prevent mutations from corrupting cache
})

export const cacheMetrics = {
  hits: 0,
  misses: 0,
  invalidations: 0,
}

export function recordCacheHit() {
  cacheMetrics.hits += 1
}

export function recordCacheMiss() {
  cacheMetrics.misses += 1
}

export function recordCacheInvalidation() {
  cacheMetrics.invalidations += 1
}

export function getAllTasksCacheKey(userId) {
  return `tasks_${userId}_all`
}

export function getSingleTaskCacheKey(userId, taskId) {
  return `task_${userId}_${taskId}`
}

/**
 * Cache Invalidation:
 * Clears the user's cached all-tasks array and optional single-task cache
 * so stale records are never returned following a write (POST/PUT/DELETE).
 */
export function invalidateUserTaskCache(userId, taskId = null) {
  taskCache.del(getAllTasksCacheKey(userId))
  if (taskId) {
    taskCache.del(getSingleTaskCacheKey(userId, taskId))
  }
  recordCacheInvalidation()
}

/**
 * Diagnostics and metric reporting for the debug endpoint (Supplementary Problem 2)
 */
export function getCacheDiagnostics() {
  const keys = taskCache.keys()
  const totalQueries = cacheMetrics.hits + cacheMetrics.misses
  const hitRatio = totalQueries > 0 ? Number(((cacheMetrics.hits / totalQueries) * 100).toFixed(2)) : 0

  return {
    status: 'active',
    ttlSeconds: 60,
    hits: cacheMetrics.hits,
    misses: cacheMetrics.misses,
    invalidations: cacheMetrics.invalidations,
    hitRatio: `${hitRatio}%`,
    activeKeysCount: keys.length,
    stats: taskCache.getStats(),
  }
}

export default taskCache
