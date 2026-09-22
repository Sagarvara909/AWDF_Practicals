
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash, randomBytes, randomInt } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { OAuth2Client } from 'google-auth-library'

dotenv.config()

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

const TASK_STATUSES = ['pending', 'ongoing', 'completed']
const USER_ROLES = ['admin', 'user']
const memoryTasks = []
const memoryUsers = []
const memoryAuthLogs = []
const activityLogFile = new URL('./activity-logs.json', import.meta.url)
let activityLogWrite = Promise.resolve()

const taskSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    status: { type: String, enum: TASK_STATUSES, default: 'pending' },
  },
  { timestamps: true },
)

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'user' },
    resetOtpHash: { type: String, default: null },
    resetOtpExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
)

const authLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    provider: { type: String, required: true },
    outcome: { type: String, enum: ['success', 'failure'], required: true },
    email: { type: String, default: null },
    userId: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    details: { type: String, default: null },
  },
  { timestamps: true },
)

const TaskModel = mongoose.models.Task || mongoose.model('Task', taskSchema)
const UserModel = mongoose.models.User || mongoose.model('User', userSchema)
const AuthLogModel = mongoose.models.AuthLog || mongoose.model('AuthLog', authLogSchema)

let mongoReady = false
let mongoFailed = false
let mongoPromise = null

async function connectToMongo() {
  if (mongoReady || mongoFailed) {
    return
  }

  if (!mongoPromise) {
    mongoPromise = (async () => {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todolist'
      const dbName = process.env.MONGO_DB_NAME || 'todolist'

      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, dbName })
        mongoReady = true
        console.log('MongoDB connected successfully')

      } catch (error) {
        mongoFailed = true
        console.warn('MongoDB unavailable, using in-memory tasks:', error.message)
      }
    })()
  }

  await mongoPromise
}

function normalizeTask(task) {
  const status = TASK_STATUSES.includes(task.status) ? task.status : task.completed ? 'completed' : 'pending'

  return {
    id: task._id ? task._id.toString() : String(task.id),
    title: task.title,
    completed: status === 'completed',
    status,
  }
}

function normalizeUser(user) {
  return {
    id: user._id ? user._id.toString() : String(user.id),
    email: user.email,
    role: user.email === getAdminEmail() ? 'admin' : 'user',
  }
}

function getAdminEmail() {
  return String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
}

async function recordAuthEvent({ req, event, provider, outcome, email = null, userId = null, details = null }) {
  const log = {
    event,
    provider,
    outcome,
    email: email ? String(email).trim().toLowerCase() : null,
    userId: userId ? String(userId) : null,
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
    details,
  }

  await persistActivityLog(log)

  try {
    await connectToMongo()
    if (mongoReady) {
      await AuthLogModel.create(log)
    } else {
      memoryAuthLogs.push({ id: Date.now(), ...log, createdAt: new Date() })
    }
  } catch (error) {
    console.warn('Unable to store auth event:', error.message)
  }
}

async function recordActivityEvent({ event, email = null, details = null }) {
  const log = {
    event,
    provider: 'activity',
    outcome: 'success',
    email: email ? String(email).trim().toLowerCase() : null,
    details,
  }

  await persistActivityLog(log)

  try {
    await connectToMongo()
    if (mongoReady) {
      await AuthLogModel.create(log)
    } else {
      memoryAuthLogs.push({ id: Date.now(), ...log, createdAt: new Date() })
    }
  } catch (error) {
    console.warn('Unable to store activity event:', error.message)
  }
}

async function persistActivityLog(log) {
  const entry = { ...log, createdAt: new Date().toISOString() }
  console.info(`[activity] ${JSON.stringify(entry)}`)

  activityLogWrite = activityLogWrite.then(async () => {
    let logs = []
    try {
      logs = JSON.parse(await readFile(activityLogFile, 'utf8'))
      if (!Array.isArray(logs)) logs = []
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Unable to read activity log file:', error.message)
      }
    }

    logs.push(entry)
    await writeFile(activityLogFile, `${JSON.stringify(logs.slice(-1000), null, 2)}\n`, 'utf8')
  }).catch((error) => {
    console.warn('Unable to save activity log file:', error.message)
  })

  await activityLogWrite
}

async function listAuthLogs() {
  await connectToMongo()

  if (mongoReady) {
    return AuthLogModel.find().sort({ createdAt: -1 }).limit(100).lean()
  }

  return [...memoryAuthLogs].reverse().slice(0, 100)
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-me'
}

function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173'
}

function getGoogleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'
}

function isGoogleOAuthConfigured() {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '')
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '')
  const isPlaceholder = (value) => !value || value.startsWith('your-') || value.includes('placeholder')

  return !isPlaceholder(clientId) && !isPlaceholder(clientSecret)
}

function getGoogleClient() {
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, getGoogleRedirectUri())
}

async function listTasks(ownerId) {
  await connectToMongo()

  if (mongoReady) {
    const tasks = await TaskModel.find({ ownerId }).sort({ createdAt: 1 }).lean()
    return tasks.map(normalizeTask)
  }

  return memoryTasks.map((task) => ({ ...task }))
}

async function createTask(ownerId, title, status = 'pending') {
  await connectToMongo()

  if (mongoReady) {
    const task = await TaskModel.create({ ownerId, title, status, completed: status === 'completed' })
    return normalizeTask(task.toObject ? task.toObject() : task)
  }

  const task = {
    id: Date.now(),
    ownerId,
    title,
    completed: status === 'completed',
    status,
  }

  memoryTasks.push(task)
  return { ...task }
}

async function updateTask(ownerId, taskId, updates) {
  await connectToMongo()

  if (mongoReady) {
    if (!mongoose.isValidObjectId(taskId)) {
      return null
    }

    const normalizedUpdates = { ...updates }
    if (normalizedUpdates.status === undefined && normalizedUpdates.completed !== undefined) {
      normalizedUpdates.status = normalizedUpdates.completed ? 'completed' : 'pending'
    }

    const existingTask = await TaskModel.findOne({ _id: taskId, ownerId }).lean()
    if (!existingTask) {
      return null
    }

    const task = await TaskModel.findOneAndUpdate({ _id: taskId, ownerId }, normalizedUpdates, {
      returnDocument: 'after',
      runValidators: true,
    }).lean()

    return task ? { task: normalizeTask(task), previousStatus: normalizeTask(existingTask).status } : null
  }

  const index = memoryTasks.findIndex((item) => item.id === Number(taskId) && item.ownerId === ownerId)
  if (index === -1) {
    return null
  }

  const previousStatus = memoryTasks[index].status || (memoryTasks[index].completed ? 'completed' : 'pending')

  if (updates.title !== undefined) {
    memoryTasks[index].title = updates.title
  }

  if (updates.completed !== undefined) {
    memoryTasks[index].completed = Boolean(updates.completed)
    memoryTasks[index].status = memoryTasks[index].completed ? 'completed' : 'pending'
  }

  if (updates.status !== undefined) {
    memoryTasks[index].status = updates.status
    memoryTasks[index].completed = updates.status === 'completed'
  }

  return { task: { ...memoryTasks[index] }, previousStatus }
}

async function deleteTask(ownerId, taskId) {
  await connectToMongo()

  if (mongoReady) {
    if (!mongoose.isValidObjectId(taskId)) {
      return false
    }

    const task = await TaskModel.findOneAndDelete({ _id: taskId, ownerId })
    return Boolean(task)
  }

  const index = memoryTasks.findIndex((item) => item.id === Number(taskId) && item.ownerId === ownerId)
  if (index === -1) {
    return false
  }

  memoryTasks.splice(index, 1)
  return true
}

async function findUserByEmail(email) {
  const normalizedEmail = String(email).trim().toLowerCase()

  await connectToMongo()

  if (mongoReady) {
    const user = await UserModel.findOne({ email: normalizedEmail }).lean()
    return user
  }

  return memoryUsers.find((user) => user.email.toLowerCase() === normalizedEmail) || null
}

async function findUserById(id) {
  await connectToMongo()

  if (mongoReady) {
    if (!mongoose.isValidObjectId(id)) {
      return null
    }

    const user = await UserModel.findById(id).lean()
    return user
  }

  return memoryUsers.find((user) => String(user.id) === String(id)) || null
}

async function listUsers() {
  await connectToMongo()

  if (mongoReady) {
    const users = await UserModel.find().sort({ createdAt: 1 }).lean()
    return users.map(normalizeUser)
  }

  return memoryUsers.map(normalizeUser)
}

async function updateUser(id, updates) {
  await connectToMongo()

  if (mongoReady) {
    if (!mongoose.isValidObjectId(id)) {
      return null
    }

    const user = await UserModel.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true }).lean()
    return user ? normalizeUser(user) : null
  }

  const user = memoryUsers.find((item) => String(item.id) === String(id))
  if (!user) {
    return null
  }

  Object.assign(user, updates)
  return normalizeUser(user)
}

async function deleteUser(id) {
  await connectToMongo()

  if (mongoReady) {
    if (!mongoose.isValidObjectId(id)) {
      return null
    }

    const user = await UserModel.findByIdAndDelete(id).lean()
    return user ? normalizeUser(user) : null
  }

  const index = memoryUsers.findIndex((item) => String(item.id) === String(id))
  if (index === -1) {
    return null
  }

  const [user] = memoryUsers.splice(index, 1)
  return normalizeUser(user)
}

async function createUser(email, passwordHash, role = 'user') {
  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedRole = USER_ROLES.includes(role) ? role : 'user'

  await connectToMongo()

  if (mongoReady) {
    const user = await UserModel.create({ email: normalizedEmail, password: passwordHash, role: normalizedRole })
    return user.toObject ? user.toObject() : user
  }

  const user = {
    id: Date.now(),
    email: normalizedEmail,
    password: passwordHash,
    role: normalizedRole,
  }

  memoryUsers.push(user)
  return user
}

function hashResetOtp(otp) {
  return createHash('sha256').update(otp).digest('hex')
}

function getMailTransport() {
  if (process.env.NODE_ENV === 'test' && !isMainModule) {
    return nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true })
  }

  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV !== 'production') {
      return null
    }

    throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured in production')
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: String(process.env.SMTP_PASS || '').replace(/\s/g, ''),
    },
  })
}

async function sendPasswordResetEmail(email, otp) {
  const transport = getMailTransport()

  if (!transport) {
    console.info(`[development] Password reset OTP for ${email}: ${otp}`)
    return
  }

  await transport.sendMail({
    from: process.env.ADMIN_EMAIL || process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your password reset OTP',
    text: `Your password reset OTP is ${otp}. It expires in 15 minutes.`,
  })
}

async function sendAdminAuthEventEmail({ event, provider, outcome, email, details = null }) {
  if (!email) {
    return
  }

  const transport = getMailTransport()
  if (!transport) {
    console.info(`[development] Auth notification for ${email}: ${event} ${outcome}`)
    return
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER || getAdminEmail(),
    to: email,
    subject: `Portfolio ${event}: ${outcome}`,
    text: [
      `Event: ${event}`,
      `Provider: ${provider}`,
      `Outcome: ${outcome}`,
      `User: ${email || 'unknown'}`,
      details ? `Details: ${details}` : null,
    ].filter(Boolean).join('\n'),
  })
}

async function sendAdminActivityEmail({ event, userEmail, details }) {
  if (!userEmail) {
    return
  }

  const transport = getMailTransport()
  if (!transport) {
    console.info(`[development] User notification for ${userEmail}: ${event}`)
    return
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER || getAdminEmail(),
    to: userEmail,
    subject: `Portfolio activity: ${event}`,
    text: [`User: ${userEmail}`, `Event: ${event}`, details].join('\n'),
  })
}

async function notifyAdminActivity(activity) {
  await recordActivityEvent({ event: activity.event, email: activity.userEmail, details: activity.details })

  return sendAdminActivityEmail(activity)
    .then(() => {
      console.info(`User notification sent: ${activity.event} -> ${activity.userEmail}`)
    })
    .catch((error) => {
      console.warn(`Unable to send ${activity.event} notification:`, error.message)
    })
}

async function verifyEmailConfiguration() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Admin email notifications disabled: SMTP configuration is incomplete')
    return
  }

  try {
    const transport = getMailTransport()
    await transport.verify()
    transport.close()
    console.info(`Admin email notifications ready: ${getAdminEmail()}`)
  } catch (error) {
    console.warn('Admin email notifications unavailable:', error.message)
  }
}

async function createPasswordResetOtp(email) {
  const otp = String(randomInt(100000, 1000000))
  const resetOtpHash = hashResetOtp(otp)
  const resetOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
  const normalizedEmail = String(email).trim().toLowerCase()

  await connectToMongo()

  if (mongoReady) {
    const user = await UserModel.findOneAndUpdate(
      { email: normalizedEmail },
      { resetOtpHash, resetOtpExpiresAt },
      { returnDocument: 'after' },
    ).lean()
    if (!user) {
      return false
    }

    try {
      await sendPasswordResetEmail(normalizedEmail, otp)
    } catch (error) {
      await UserModel.findOneAndUpdate({ email: normalizedEmail }, { resetOtpHash: null, resetOtpExpiresAt: null })
      throw new Error(`Unable to send password reset email: ${error.message}`, { cause: error })
    }

    return true
  }

  const user = memoryUsers.find((item) => item.email === normalizedEmail)
  if (!user) {
    return false
  }

  user.resetOtpHash = resetOtpHash
  user.resetOtpExpiresAt = resetOtpExpiresAt
  try {
    await sendPasswordResetEmail(normalizedEmail, otp)
  } catch (error) {
    user.resetOtpHash = null
    user.resetOtpExpiresAt = null
    throw new Error(`Unable to send password reset email: ${error.message}`, { cause: error })
  }

  return true
}

async function resetPassword(email, otp, passwordHash) {
  const otpHash = hashResetOtp(otp)
  const normalizedEmail = String(email).trim().toLowerCase()
  await connectToMongo()

  if (mongoReady) {
    const user = await UserModel.findOne({
      email: normalizedEmail,
      resetOtpHash: otpHash,
      resetOtpExpiresAt: { $gt: new Date() },
    })

    if (!user) {
      return false
    }

    user.password = passwordHash
    user.resetOtpHash = null
    user.resetOtpExpiresAt = null
    await user.save()
    return true
  }

  const user = memoryUsers.find((item) => item.email === normalizedEmail)
  if (!user || user.resetOtpHash !== otpHash || !user.resetOtpExpiresAt || user.resetOtpExpiresAt <= new Date()) {
    return false
  }

  user.password = passwordHash
  user.resetOtpHash = null
  user.resetOtpExpiresAt = null
  return true
}

function validateRegisterInput(req, res, next) {
  const { email, password } = req.body || {}

  if (!email || typeof email !== 'string' || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Valid email is required' })
  }

  if (!password || typeof password !== 'string' || password.trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  next()
}

function validateLoginInput(req, res, next) {
  const { email, password } = req.body || {}

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' })
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Password is required' })
  }

  next()
}

function validatePasswordResetRequest(req, res, next) {
  const { email } = req.body || {}

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Valid email is required' })
  }

  next()
}

function validatePasswordReset(req, res, next) {
  const { email, otp, password } = req.body || {}

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' })
  }

  if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'A valid 6-digit OTP is required' })
  }

  if (!password || typeof password !== 'string' || password.trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  next()
}

function validateTaskInput(req, res, next) {
  const { title, status } = req.body || {}

  if (req.method === 'POST' && (!title || typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Task title is required' })
  }

  if (req.method === 'PUT' && title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Task title is required' })
  }

  if (status !== undefined && !TASK_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Task status must be pending, ongoing, or completed' })
  }

  next()
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret())
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}

function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`)
    next()
  })

  app.use((req, res, next) => {
    if ((req.method === 'POST' || req.method === 'PUT') && !req.is('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json' })
    }
    next()
  })

  app.post('/register', validateRegisterInput, async (req, res) => {
    const { email, password } = req.body || {}
    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      await recordAuthEvent({ req, event: 'register', provider: 'password', outcome: 'failure', email, details: 'User already exists' })
      return res.status(409).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const savedUser = await createUser(email, hashedPassword, email.toLowerCase() === getAdminEmail() ? 'admin' : 'user')
    await recordAuthEvent({ req, event: 'register', provider: 'password', outcome: 'success', email, userId: savedUser._id || savedUser.id })
    await notifyAdminActivity({ event: 'user registered', userEmail: email, details: 'A new account was created.' })

    res.status(201).json({
      message: 'User registered successfully',
      user: normalizeUser(savedUser),
    })
  })

  app.post('/login', validateLoginInput, async (req, res) => {
    const { email, password } = req.body || {}
    const user = await findUserByEmail(email)

    if (!user) {
      await recordAuthEvent({ req, event: 'login', provider: 'password', outcome: 'failure', email, details: 'Invalid credentials' })
      await sendAdminAuthEventEmail({ event: 'login', provider: 'password', outcome: 'failure', email, details: 'Invalid credentials' }).catch((error) => {
        console.warn('Unable to send login notification:', error.message)
      })
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      await recordAuthEvent({ req, event: 'login', provider: 'password', outcome: 'failure', email, userId: user._id || user.id, details: 'Invalid credentials' })
      await sendAdminAuthEventEmail({ event: 'login', provider: 'password', outcome: 'failure', email, details: 'Invalid credentials' }).catch((error) => {
        console.warn('Unable to send login notification:', error.message)
      })
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    await recordAuthEvent({ req, event: 'login', provider: 'password', outcome: 'success', email, userId: user._id || user.id })
    await sendAdminAuthEventEmail({ event: 'login', provider: 'password', outcome: 'success', email }).catch((error) => {
      console.warn('Unable to send login notification:', error.message)
    })

    const token = jwt.sign(
      {
        id: user._id ? user._id.toString() : String(user.id),
        email: user.email,
        role: normalizeUser(user).role,
      },
      getJwtSecret(),
      { expiresIn: '1h' },
    )

    res.status(200).json({
      message: 'Login successful',
      token,
      user: normalizeUser(user),
    })
  })

  app.get('/auth/google', async (req, res) => {
    if (!isGoogleOAuthConfigured()) {
      await recordAuthEvent({ req, event: 'oauth_start', provider: 'google', outcome: 'failure', details: 'Google OAuth is not configured' })
      return res.status(503).send('Google sign-in is not configured. Add a real GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.')
    }

    await recordAuthEvent({ req, event: 'oauth_start', provider: 'google', outcome: 'success' })

    const state = jwt.sign({ purpose: 'google-oauth' }, getJwtSecret(), { expiresIn: '10m' })
    const googleClient = getGoogleClient()
    const authorizationUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
      state,
    })

    res.redirect(authorizationUrl)
  })

  app.get('/auth/google/callback', async (req, res) => {
    const { code, state } = req.query

    try {
      const statePayload = jwt.verify(String(state || ''), getJwtSecret())
      if (statePayload.purpose !== 'google-oauth' || !code) {
        throw new Error('Invalid Google sign-in request')
      }

      const googleClient = getGoogleClient()
      const { tokens } = await googleClient.getToken(String(code))
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      const profile = ticket.getPayload()

      if (!profile?.email || !profile.email_verified) {
        throw new Error('Google account email is not verified')
      }

      let user = await findUserByEmail(profile.email)
      const event = user ? 'login' : 'register'
      if (!user) {
        const unusablePassword = await bcrypt.hash(randomBytes(32).toString('hex'), 10)
        user = await createUser(profile.email, unusablePassword, profile.email.toLowerCase() === getAdminEmail() ? 'admin' : 'user')
      }

      await recordAuthEvent({ req, event, provider: 'google', outcome: 'success', email: profile.email, userId: user._id || user.id })
      await sendAdminAuthEventEmail({ event, provider: 'google', outcome: 'success', email: profile.email }).catch((error) => {
        console.warn('Unable to send Google login notification:', error.message)
      })

      const token = jwt.sign(
        {
          id: user._id ? user._id.toString() : String(user.id),
          email: user.email,
          role: normalizeUser(user).role,
        },
        getJwtSecret(),
        { expiresIn: '1h' },
      )

      return res.redirect(`${getFrontendUrl()}/login#token=${encodeURIComponent(token)}`)
    } catch (error) {
      await recordAuthEvent({ req, event: 'oauth_callback', provider: 'google', outcome: 'failure', details: error.message })
      await notifyAdminActivity({ event: 'Google sign-in failed', userEmail: 'unknown', details: error.message })
      return res.redirect(`${getFrontendUrl()}/login?oauthError=${encodeURIComponent(error.message)}`)
    }
  })

  app.post('/forgot-password', validatePasswordResetRequest, async (req, res) => {
    const { email } = req.body
    try {
      await createPasswordResetOtp(email)
      await recordAuthEvent({ req, event: 'password_reset_request', provider: 'otp', outcome: 'success', email })
      await notifyAdminActivity({ event: 'password reset requested', userEmail: email, details: 'A password reset OTP was requested.' })
      res.status(200).json({ message: 'If an account exists for that email, an OTP has been sent.' })
    } catch (error) {
      await recordAuthEvent({ req, event: 'password_reset_request', provider: 'otp', outcome: 'failure', email, details: 'Email delivery failed' })
      await notifyAdminActivity({ event: 'password reset failed', userEmail: email, details: error.message })
      res.status(503).json({ error: error.message })
    }
  })

  app.post('/reset-password', validatePasswordReset, async (req, res) => {
    const { email, otp, password } = req.body
    const passwordHash = await bcrypt.hash(password, 10)
    const updated = await resetPassword(email, otp, passwordHash)

    if (!updated) {
      await recordAuthEvent({ req, event: 'password_reset', provider: 'otp', outcome: 'failure', email, details: 'Invalid or expired OTP' })
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    await recordAuthEvent({ req, event: 'password_reset', provider: 'otp', outcome: 'success', email })
    await notifyAdminActivity({ event: 'password reset completed', userEmail: email, details: 'The account password was changed.' })

    res.status(200).json({ message: 'Password reset successfully. Please log in.' })
  })

  app.get('/me', authMiddleware, async (req, res) => {
    const user = await findUserById(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({ user: normalizeUser(user) })
  })

  app.put('/me', authMiddleware, async (req, res) => {
    const { email } = req.body || {}
    if (typeof email !== 'string' || !email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email is required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await findUserByEmail(normalizedEmail)
    if (existingUser && String(existingUser._id || existingUser.id) !== String(req.user.id)) {
      return res.status(409).json({ error: 'Email is already in use' })
    }

    const user = await updateUser(req.user.id, { email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await notifyAdminActivity({
      event: 'user profile updated',
      userEmail: normalizedEmail,
      details: `Email changed from ${req.user.email} to ${normalizedEmail}.`,
    })

    res.status(200).json({ user })
  })

  app.use('/admin', authMiddleware, adminMiddleware)

  app.get('/admin/users', async (req, res) => {
    res.status(200).json({ users: await listUsers() })
  })

  app.get('/admin/auth-logs', async (req, res) => {
    res.status(200).json({ logs: await listAuthLogs() })
  })

  app.put('/admin/users/:id', async (req, res) => {
    const { email, role } = req.body || {}
    const updates = {}

    if (email !== undefined) {
      if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return res.status(400).json({ error: 'A valid email is required' })
      }
      updates.email = email.trim().toLowerCase()
    }

    if (role !== undefined) {
      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Role must be admin or user' })
      }
      updates.role = role
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No user changes supplied' })
    }

    const updatedUser = await updateUser(req.params.id, updates)
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    await notifyAdminActivity({
      event: 'admin user record updated',
      userEmail: updatedUser.email,
      details: `Updated user ${updatedUser.email}: ${JSON.stringify(updates)}`,
    })

    res.status(200).json({ user: updatedUser })
  })

  app.delete('/admin/users/:id', async (req, res) => {
    const user = await findUserById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.email === getAdminEmail()) {
      return res.status(400).json({ error: 'The main admin account cannot be deleted' })
    }

    const deletedUser = await deleteUser(req.params.id)
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    await notifyAdminActivity({
      event: 'user deleted',
      userEmail: deletedUser.email,
      details: `User account ${deletedUser.email} was deleted by ${req.user.email}.`,
    })

    res.status(200).json({ message: 'User deleted', user: deletedUser })
  })

  app.use(['/tasks', '/api/todos'], authMiddleware)

  app.get(['/tasks', '/api/todos'], async (req, res) => {
    const tasks = await listTasks(req.user.id)
    res.status(200).json({ tasks })
  })

  app.post(['/tasks', '/api/todos'], validateTaskInput, async (req, res) => {
    const { title, status = 'pending', completed = false } = req.body || {}
    const task = await createTask(req.user.id, String(title).trim(), status || (completed ? 'completed' : 'pending'))
    await notifyAdminActivity({
      event: 'task created',
      userEmail: req.user.email,
      details: `Task: ${task.title}; Status: ${task.status}.`,
    })
    res.status(201).json({ message: 'Task created', task })
  })

  app.put(['/tasks/:id', '/api/todos/:id'], validateTaskInput, async (req, res) => {
    const { title, completed, status } = req.body || {}
    const updates = {}

    if (title !== undefined) {
      updates.title = String(title).trim()
    }

    if (completed !== undefined) {
      updates.completed = Boolean(completed)
    }

    if (status !== undefined) {
      updates.status = status
      updates.completed = status === 'completed'
    }

    const updateResult = await updateTask(req.user.id, req.params.id, updates)
    if (!updateResult) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const { task, previousStatus } = updateResult
    const requestedStatus = status !== undefined ? status : completed !== undefined ? (completed ? 'completed' : 'pending') : null
    if (requestedStatus && requestedStatus !== previousStatus) {
      void notifyAdminActivity({
        event: 'task status changed',
        userEmail: req.user.email,
        details: `Task: ${task.title}; Status: ${previousStatus} -> ${task.status}.`,
      })
    } else {
      void notifyAdminActivity({
        event: 'task updated',
        userEmail: req.user.email,
        details: `Task: ${task.title}; Status: ${task.status}.`,
      })
    }

    res.status(200).json({ message: 'Task updated', task })
  })

  app.delete(['/tasks/:id', '/api/todos/:id'], async (req, res) => {
    const deleted = await deleteTask(req.user.id, req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' })
    }

    await notifyAdminActivity({
      event: 'task deleted',
      userEmail: req.user.email,
      details: `Task ID: ${req.params.id}.`,
    })

    res.status(200).json({ message: 'Task deleted', deleted: true })
  })

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
  })

  app.use((err, req, res, next) => {
    console.error(err.stack)
    void next
    res.status(500).json({ error: 'Something went wrong' })
  })

  return app
}

const app = createApp()
if (isMainModule) {
  const port = process.env.PORT || 5000
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    void verifyEmailConfiguration()
  })
}

export { createApp }
export default app
