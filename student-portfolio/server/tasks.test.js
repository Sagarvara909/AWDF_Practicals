import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './server.js'

async function startServer() {
  const app = createApp()
  const server = app.listen(0, '127.0.0.1')

  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const address = server.address()
  const baseUrl = `http://localhost:5000:${address.port}`

  return { server, baseUrl }
}

test('GET /tasks returns the initial task list', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/tasks`)
    assert.equal(response.status, 200)

    const body = await response.json()
    assert.ok(Array.isArray(body.tasks))
    assert.equal(body.tasks[0].title, 'Sample Task')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('POST /tasks creates a new task', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write report', completed: false }),
    })

    assert.equal(response.status, 201)

    const body = await response.json()
    assert.equal(body.task.title, 'Write report')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('PUT /tasks/:id updates an existing task', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Draft PR', completed: false }),
    })

    const createdTask = await createResponse.json()
    const taskId = createdTask.task.id

    const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })

    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.task.completed, true)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('DELETE /tasks/:id removes the requested task', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Delete this', completed: false }),
    })

    const createdTask = await createResponse.json()
    const taskId = createdTask.task.id

    const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
      method: 'DELETE',
    })

    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.deleted, true)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('unknown routes return a structured 404 response', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/missing-route`)
    assert.equal(response.status, 404)

    const body = await response.json()
    assert.equal(body.error, 'Route not found')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
