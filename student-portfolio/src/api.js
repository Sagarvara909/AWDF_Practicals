const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export function getGoogleAuthUrl() {
  return `${BASE_URL}/auth/google`
}

export function saveToken(token) {
  localStorage.setItem('student-portfolio-token', token)
}

export function getToken() {
  return localStorage.getItem('student-portfolio-token')
}

export function clearToken() {
  localStorage.removeItem('student-portfolio-token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || 'The server request failed')
    error.status = response.status
    throw error
  }

  return payload
}

export async function getTasks() {
  const { tasks } = await request('/tasks')
  return tasks
}

export async function createTask(task) {
  const { task: createdTask } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  })
  return createdTask
}

export async function updateTask(taskId, updates) {
  const { task } = await request(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  return task
}

export async function deleteTask(taskId) {
  await request(`/tasks/${taskId}`, { method: 'DELETE' })
}

export async function registerUser(credentials) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function loginUser(credentials) {
  const payload = await request('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  saveToken(payload.token)
  return payload
}

export async function requestPasswordReset(email) {
  return request('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(credentials) {
  return request('/reset-password', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function getCurrentUser() {
  const { user } = await request('/me')
  return user
}

export async function updateCurrentUser(updates) {
  const { user } = await request('/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  return user
}

export async function getAdminUsers() {
  const { users } = await request('/admin/users')
  return users
}

export async function updateAdminUser(userId, updates) {
  const { user } = await request(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  return user
}

export async function deleteAdminUser(userId) {
  const { user } = await request(`/admin/users/${userId}`, { method: 'DELETE' })
  return user
}

export async function getAdminAuthLogs() {
  const { logs } = await request('/admin/auth-logs')
  return logs
}