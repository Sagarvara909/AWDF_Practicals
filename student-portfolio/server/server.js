import express from 'express'
import cors from 'cors'

const tasks = [
  { id: 1, title: 'Sample Task', completed: false },
]

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

  app.get('/tasks', (req, res) => {
    res.status(200).json({ tasks })
  })

  app.post('/tasks', (req, res) => {
    const { title, completed = false } = req.body || {}

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' })
    }

    const task = {
      id: Date.now(),
      title: title.trim(),
      completed,
    }

    tasks.push(task)
    res.status(201).json({ message: 'Task created', task })
  })

  app.put('/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id)
    const task = tasks.find((item) => item.id === taskId)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const { title, completed } = req.body || {}

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Task title is required' })
      }
      task.title = title.trim()
    }

    if (completed !== undefined) {
      task.completed = Boolean(completed)
    }

    res.status(200).json({ message: 'Task updated', task })
  })

  app.delete('/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id)
    const index = tasks.findIndex((item) => item.id === taskId)

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }

    tasks.splice(index, 1)
    res.status(200).json({ message: 'Task deleted', deleted: true })
  })

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
  })

  app.use((err, req, res) => {
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
