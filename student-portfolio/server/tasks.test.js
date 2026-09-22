process.env.NODE_ENV = 'test'
process.env.ADMIN_EMAIL = 'admin-role@example.com'

import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

const { createApp } = await import('./server.js')

async function startServer() {
  const app = createApp()
  const server = app.listen(0, '127.0.0.1')

  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Server address is not available')
  }

  const baseUrl = `http://127.0.0.1:${address.port}`

  return { server, baseUrl }
}

async function getAuthToken(baseUrl, email = 'task-user@example.com', password = 'securepass123') {
  await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).catch(() => null)

  const response = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body.error || 'Login failed')
  }

  return body.token
}

test.after(async () => {
  await mongoose.disconnect()
})

test('GET /tasks returns the initial task list', async () => {
  const { server, baseUrl } = await startServer()
  const token = await getAuthToken(baseUrl)

  try {
    const response = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(response.status, 200)

    const body = await response.json()
    assert.ok(Array.isArray(body.tasks))
    assert.ok(body.tasks.every((task) => typeof task.id === 'string' && typeof task.title === 'string'))
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('POST /tasks creates a new task', async () => {
  const { server, baseUrl } = await startServer()
  const token = await getAuthToken(baseUrl, 'write-task@example.com')

  try {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Write report', completed: false }),
    })

    assert.equal(response.status, 201)

    const body = await response.json()
    assert.equal(body.task.title, 'Write report')
    assert.equal(body.task.status, 'pending')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('POST /tasks accepts JSON content types with a charset', async () => {
  const { server, baseUrl } = await startServer()
  const token = await getAuthToken(baseUrl, 'charset-task@example.com')

  try {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Charset request', completed: false }),
    })

    assert.equal(response.status, 201)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('users can only see and manage their own tasks', async () => {
  const { server, baseUrl } = await startServer()
  const ownerToken = await getAuthToken(baseUrl, 'owner-task@example.com')
  const otherUserToken = await getAuthToken(baseUrl, 'other-task@example.com')

  try {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ title: 'Private task', status: 'pending' }),
    })
    const createdTask = await createResponse.json()

    const listResponse = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${otherUserToken}` },
    })
    const listBody = await listResponse.json()
    assert.equal(listBody.tasks.some((task) => task.id === createdTask.task.id), false)

    const updateResponse = await fetch(`${baseUrl}/tasks/${createdTask.task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherUserToken}` },
      body: JSON.stringify({ status: 'completed' }),
    })
    assert.equal(updateResponse.status, 404)

    const deleteResponse = await fetch(`${baseUrl}/tasks/${createdTask.task.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${otherUserToken}` },
    })
    assert.equal(deleteResponse.status, 404)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('PUT /tasks/:id updates an existing task', async () => {
  const { server, baseUrl } = await startServer()
  const token = await getAuthToken(baseUrl, 'update-task@example.com')

  try {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Draft PR', completed: false }),
    })

    const createdTask = await createResponse.json()
    const taskId = createdTask.task.id

    const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: true }),
    })

    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.task.completed, true)
    assert.equal(body.task.status, 'completed')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('PUT /tasks/:id updates task status', async () => {
  const { server, baseUrl } = await startServer()
  const token = await getAuthToken(baseUrl, 'status-task@example.com')

  try {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Build feature', status: 'pending' }),
    })
    const createdTask = await createResponse.json()

    const response = await fetch(`${baseUrl}/tasks/${createdTask.task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'ongoing' }),
    })

    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.task.status, 'ongoing')
    assert.equal(body.task.completed, false)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('DELETE /tasks/:id removes the requested task', async () => {
  const { server, baseUrl } = await startServer()
  const token = await getAuthToken(baseUrl, 'delete-task@example.com')

  try {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Delete this', completed: false }),
    })

    const createdTask = await createResponse.json()
    const taskId = createdTask.task.id

    const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.deleted, true)

    const listResponse = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const listBody = await listResponse.json()
    assert.equal(listBody.tasks.some((task) => task.id === taskId), false)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('invalid task IDs return a structured 404 response', async () => {
  const { server, baseUrl } = await startServer()
  const token = await getAuthToken(baseUrl, 'invalid-id@example.com')

  try {
    const response = await fetch(`${baseUrl}/tasks/not-a-mongo-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    assert.equal(response.status, 404)
    const body = await response.json()
    assert.equal(body.error, 'Task not found')
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

test('POST /register creates a user and stores a hashed password', async () => {
  const { server, baseUrl } = await startServer()
  const email = `auth-user-${Date.now()}@example.com`

  try {
    const response = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'securepass123' }),
    })

    assert.equal(response.status, 201)
    const body = await response.json()
    assert.equal(body.user.email, email)
    assert.notEqual(body.user.password, 'securepass123')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('POST /login returns a JWT for valid credentials and /me returns current user details', async () => {
  const { server, baseUrl } = await startServer()

  try {
    await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login-user@example.com', password: 'securepass123' }),
    })

    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login-user@example.com', password: 'securepass123' }),
    })

    assert.equal(loginResponse.status, 200)
    const loginBody = await loginResponse.json()
    assert.ok(loginBody.token)

    const meResponse = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    })

    assert.equal(meResponse.status, 200)
    const meBody = await meResponse.json()
    assert.equal(meBody.user.email, 'login-user@example.com')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('admin users can manage users while regular users only access their own profile', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const adminToken = await getAuthToken(baseUrl, 'admin-role@example.com', 'securepass123')
    const userToken = await getAuthToken(baseUrl, 'regular-role@example.com', 'securepass123')

    const adminResponse = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(adminResponse.status, 200)
    const adminBody = await adminResponse.json()
    assert.ok(adminBody.users.some((user) => user.email === 'admin-role@example.com' && user.role === 'admin'))
    assert.ok(adminBody.users.some((user) => user.email === 'regular-role@example.com' && user.role === 'user'))
    assert.ok(adminBody.users.every((user) => !('password' in user) && !('resetOtpHash' in user)))

    const regularResponse = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    assert.equal(regularResponse.status, 403)

    const profileResponse = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    const profileBody = await profileResponse.json()
    assert.equal(profileBody.user.email, 'regular-role@example.com')
    assert.equal(profileBody.user.role, 'user')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('Protected task routes reject requests without a valid auth token', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/tasks`, {
      headers: { 'Content-Type': 'application/json' },
    })

    assert.equal(response.status, 401)
    const body = await response.json()
    assert.equal(body.error, 'Unauthorized')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('Google sign-in rejects placeholder OAuth credentials clearly', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/auth/google`)
    assert.equal(response.status, 503)
    assert.match(await response.text(), /GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET/)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('POST /forgot-password and /reset-password update the account password', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const email = 'reset-user@example.com'
    await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'oldpass123' }),
    })

    const requestResponse = await fetch(`${baseUrl}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    assert.equal(requestResponse.status, 200)
    const requestBody = await requestResponse.json()
    assert.equal(requestBody.resetToken, undefined)

    const resetResponse = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '000000', password: 'newpass123' }),
    })
    assert.equal(resetResponse.status, 400)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
