# Practical 9: In-Memory Caching and Query Optimization

**Course:** ITUE301 — Advanced Web Development Frameworks  
**Objective:** Add server-side task caching and compare API response times.

## Implementation

- `node-cache` is configured with a 60-second default TTL.
- `GET /tasks` caches the task list using a key scoped to the authenticated
  user's ID.
- `GET /tasks/:id` uses a separate per-user, per-task key.
- Successful `POST /tasks` operations invalidate the user's list cache.
- Successful `PUT /tasks/:id` and `DELETE /tasks/:id` operations invalidate
  both the user's list cache and the affected task's detail cache.
- `GET /debug/cache` requires authentication and reports cache hits, misses,
  invalidations, hit ratio, active-key count, and NodeCache statistics.
- API responses include `cacheStatus` (`MISS` or `HIT`) so results can be
  verified during measurement.

## Response-time measurement

The benchmark runs two isolated API instances against the configured MongoDB
and uses an existing user's JWT. One instance has task caching disabled; the
other has normal caching enabled and is warmed before readings are taken. The
benchmark does not create accounts or modify task data.

1. Start the backend with the usual `.env` MongoDB configuration.
2. Obtain a JWT by signing in through the application or `POST /login`.
3. From the project directory, run
   `CACHE_BENCH_TOKEN='paste-your-token-here' npm run benchmark:cache`.
4. Copy the three cache-disabled and three `HIT` readings printed by the
   benchmark into the table below. The benchmark also prints each condition's
   average and the average response-time reduction.

The readings depend on the machine, database location, task count, and current
system load. Record actual local measurements rather than using example or
invented values.

| Sample | Uncached (`DISABLED`, ms) | Cached (`HIT`, ms) |
| ---: | ---: | ---: |
| 1 | _Record benchmark result_ | _Record benchmark result_ |
| 2 | _Record benchmark result_ | _Record benchmark result_ |
| 3 | _Record benchmark result_ | _Record benchmark result_ |
| Average | _Calculate from samples_ | _Calculate from samples_ |

## Key questions

### Why invalidate after writes?

A cached list or detail response is a snapshot of the database. If a write
changes the database but leaves that snapshot in the cache, subsequent reads
can return deleted tasks or old task fields until the entry expires. Clearing
the affected entries after each successful write makes the next read fetch the
updated database state and populate a fresh cache entry.

### Why use a 60-second TTL?

For an interactive task manager, 60 seconds is long enough for repeated reads
to benefit from caching while limiting how long data could remain stale if an
update bypasses this process's invalidation logic. A longer TTL can improve
the hit rate and reduce database reads, but lengthens the possible stale-data
window; a shorter TTL improves freshness but causes more database queries.
Writes in this application invalidate immediately, so TTL is an additional
bound rather than the primary freshness mechanism.

### Why is `node-cache` unsuitable across multiple server instances?

Each Node.js process has its own private memory. A write handled by one
instance cannot invalidate another instance's cache, and later reads may be
served from different, inconsistent copies. The cache is also lost when a
process restarts. A multi-instance deployment should use a shared cache such
as Redis and a coordinated invalidation strategy.

## Observation

The cache-disabled readings include a MongoDB query while `HIT` readings are
served from process memory. With small task lists or a local MongoDB instance,
the difference may be small because the uncached query is already fast. This
lab cache is process-local and is cleared on server restart.
