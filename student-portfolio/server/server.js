
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const memoryTasks = [{ id: 1, title: 'Sample Task', completed: false }]

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const TaskModel = mongoose.models.Task || mongoose.model('Task', taskSchema)

let mongoReady = false
let mongoFailed = false
let mongoError = null
let mongoPromise = null

async function connectToMongo() {
  if (mongoReady || mongoFailed) {
    return
  }

  if (!mongoPromise) {
    mongoPromise = (async () => {
      const mongoUri = process.env.MONGO_URI || "mongodb+srv://Sagar:Sagar@1234@todolist.3suhtfn.mongodb.net/todolist?appName=Todolist&retryWrites=true&w=majority"
      const dbName = process.env.MONGO_DB_NAME || 'todolist'

      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, dbName })
        mongoReady = true
        console.log('MongoDB connected successfully')

        const count = await TaskModel.countDocuments()
        if (count === 0) {
          await TaskModel.create({ title: 'Sample Task', completed: false })
        }
      } catch (error) {
        mongoFailed = true
        mongoError = error
        console.warn('MongoDB unavailable, using in-memory tasks:', error.message)
      }
    })()
  }

  await mongoPromise
}

function normalizeTask(task) {
  return {
    id: task._id ? task._id.toString() : task.id,
    title: task.title,
    completed: Boolean(task.completed),
  }
}

async function listTasks() {
  await connectToMongo()

  if (mongoReady) {
    const tasks = await TaskModel.find({}).sort({ createdAt: 1 }).lean()
    return tasks.map(normalizeTask)
  }

  return memoryTasks.map((task) => ({ ...task }))
}

async function createTask(title, completed = false) {
  await connectToMongo()

  if (mongoReady) {
    const task = await TaskModel.create({ title, completed })
    return normalizeTask(task.toObject ? task.toObject() : task)
  }

  const task = {
    id: Date.now(),
    title,
    completed,
  }

  memoryTasks.push(task)
  return { ...task }
}

async function updateTask(taskId, updates) {
  await connectToMongo()

  if (mongoReady) {
    const task = await TaskModel.findByIdAndUpdate(taskId, updates, {
      new: true,
      runValidators: true,
    }).lean()

    return task ? normalizeTask(task) : null
  }

  const index = memoryTasks.findIndex((item) => item.id === Number(taskId))
  if (index === -1) {
    return null
  }

  if (updates.title !== undefined) {
    memoryTasks[index].title = updates.title
  }

  if (updates.completed !== undefined) {
    memoryTasks[index].completed = Boolean(updates.completed)
  }

  return { ...memoryTasks[index] }
}

async function deleteTask(taskId) {
  await connectToMongo()

  if (mongoReady) {
    const task = await TaskModel.findByIdAndDelete(taskId)
    return Boolean(task)
  }

  const index = memoryTasks.findIndex((item) => item.id === Number(taskId))
  if (index === -1) {
    return false
  }

  memoryTasks.splice(index, 1)
  return true
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
    if ((req.method === 'POST' || req.method === 'PUT') && req.headers['content-type'] !== 'application/json') {
      return res.status(400).json({ error: 'Content-Type must be application/json' })
    }
    next()
  })

  app.get('/tasks', async (req, res) => {
    const tasks = await listTasks()
    res.status(200).json({ tasks })
  })

  app.post('/tasks', async (req, res) => {
    const { title, completed = false } = req.body || {}
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' })
    }

    const task = await createTask(title.trim(), Boolean(completed))
    res.status(201).json({ message: 'Task created', task })
  })

  app.put('/tasks/:id', async (req, res) => {
    const { title, completed } = req.body || {}
    const updates = {}

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Task title is required' })
      }
      updates.title = title.trim()
    }

    if (completed !== undefined) {
      updates.completed = Boolean(completed)
    }

    const task = await updateTask(req.params.id, updates)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json({ message: 'Task updated', task })
  })

  app.delete('/tasks/:id', async (req, res) => {
    const deleted = await deleteTask(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json({ message: 'Task deleted', deleted: true })
  })

  app.get('/api/todos', async (req, res) => {
    const tasks = await listTasks()
    res.status(200).json({ tasks })
  })

  app.post('/api/todos', async (req, res) => {
    const { title, completed = false } = req.body || {}
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' })
    }

    const task = await createTask(title.trim(), Boolean(completed))
    res.status(201).json({ message: 'Task created', task })
  })

  app.put('/api/todos/:id', async (req, res) => {
    const task = await updateTask(req.params.id, req.body || {})
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json({ message: 'Task updated', task })
  })

  app.delete('/api/todos/:id', async (req, res) => {
    const deleted = await deleteTask(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json({ message: 'Task deleted', deleted: true })
  })

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
  })

  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Something went wrong' })
  })

  return app
}

const app = createApp()
if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 5000
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

export { createApp }
export default app
