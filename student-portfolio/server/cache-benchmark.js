import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { createApp } from './server.js'

async function listen(app) {
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const address = server.address()
  assert.ok(address && typeof address !== 'string', 'Benchmark server did not bind to a TCP port')
  return { server, baseUrl: `http://127.0.0.1:${address.port}` }
}

async function timedFetch(url, headers, expectedCacheStatus) {
  const start = performance.now()
  const response = await fetch(url, { headers })
  const body = await response.json()
  const elapsed = performance.now() - start

  assert.equal(response.status, 200, `GET ${url} failed: ${body.error || response.statusText}`)
  assert.equal(body.cacheStatus, expectedCacheStatus)

  return elapsed
}

async function close(server) {
  if (!server?.listening) {
    return
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

async function main() {
  const token = process.env.CACHE_BENCH_TOKEN
  if (!token) {
    throw new Error('Set CACHE_BENCH_TOKEN to a valid JWT for an existing user before running the benchmark.')
  }

  let uncachedServer
  let cachedServer
  let uncachedUrl
  let cachedUrl

  try {
    const uncached = await listen(createApp({ cacheEnabled: false }))
    uncachedServer = uncached.server
    uncachedUrl = uncached.baseUrl
    const cached = await listen(createApp())
    cachedServer = cached.server
    cachedUrl = cached.baseUrl

    const headers = { Authorization: `Bearer ${token}` }
    const userResponse = await fetch(`${uncachedUrl}/me`, { headers })
    const userBody = await userResponse.json()
    assert.equal(
      userResponse.status,
      200,
      `Unable to authenticate benchmark token: ${userBody.error || userResponse.statusText}`,
    )

    const cachedWarmup = await fetch(`${cachedUrl}/tasks`, { headers })
    const warmupBody = await cachedWarmup.json()
    assert.equal(cachedWarmup.status, 200)
    assert.equal(warmupBody.cacheStatus, 'MISS')

    const uncachedResults = []
    const cachedResults = []

    for (let i = 0; i < 3; i += 1) {
      uncachedResults.push(await timedFetch(`${uncachedUrl}/tasks`, headers, 'DISABLED'))
      cachedResults.push(await timedFetch(`${cachedUrl}/tasks`, headers, 'HIT'))
    }

    const average = (results) => results.reduce((total, result) => total + result, 0) / results.length
    const averageUncached = average(uncachedResults)
    const averageCached = average(cachedResults)
    const improvement = averageUncached > 0
      ? ((averageUncached - averageCached) / averageUncached) * 100
      : 0

    console.log('Practical 9: GET /tasks response time (milliseconds)')
    console.log('| Sample | Uncached (cache disabled) | Cached (HIT) |')
    console.log('| ---: | ---: | ---: |')
    for (let i = 0; i < 3; i += 1) {
      console.log(`| ${i + 1} | ${uncachedResults[i].toFixed(2)} | ${cachedResults[i].toFixed(2)} |`)
    }
    console.log(`| Average | ${averageUncached.toFixed(2)} | ${averageCached.toFixed(2)} |`)
    console.log(`Average response-time reduction: ${improvement.toFixed(1)}%`)
  } finally {
    await Promise.all([close(uncachedServer), close(cachedServer)])
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('Cache benchmark failed:', error)
  process.exitCode = 1
})
