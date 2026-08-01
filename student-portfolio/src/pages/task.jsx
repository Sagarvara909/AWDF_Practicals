import { useEffect, useState } from 'react'
import './Task.css'

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

function Task() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadTasks() {
      setStatus('loading')
      try {
        const response = await fetch(`${apiBase}/tasks`)
        if (!response.ok) throw new Error('Failed to load tasks')
        const data = await response.json()
        setTasks(data.tasks || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setStatus('idle')
      }
    }

    loadTasks()
  }, [])

  async function saveTask(event) {
    event.preventDefault()

    if (!title.trim()) {
      setError('Please enter a task title.')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const url = editingTask ? `${apiBase}/tasks/${editingTask.id}` : `${apiBase}/tasks`
      const method = editingTask ? 'PUT' : 'POST'
      const body = editingTask
        ? JSON.stringify({ title: title.trim() })
        : JSON.stringify({ title: title.trim(), completed: false })

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Unable to save task')
      }

      const result = await response.json()

      if (editingTask) {
        setTasks((current) => current.map((item) => (item.id === editingTask.id ? result.task : item)))
        setEditingTask(null)
      } else {
        setTasks((current) => [...current, result.task])
      }

      setTitle('')
    } catch (err) {
      setError(err.message)
    } finally {
      setStatus('idle')
    }
  }

  function startEdit(task) {
    setEditingTask(task)
    setTitle(task.title)
    setError('')
  }

  function cancelEdit() {
    setEditingTask(null)
    setTitle('')
    setError('')
  }

  async function deleteTask(taskId) {
    setStatus('loading')
    setError('')

    try {
      const response = await fetch(`${apiBase}/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Unable to delete task')
      }

      setTasks((current) => current.filter((task) => task.id !== taskId))
    } catch (err) {
      setError(err.message)
    } finally {
      setStatus('idle')
    }
  }

  const isEditing = Boolean(editingTask)

  return (
    <section className="task-page">
      <h2>Task Manager</h2>

      <form onSubmit={saveTask}>
        <input
          type="text"
          value={title}
          placeholder="Add a new task"
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className="form-actions">
          <button type="submit">{isEditing ? 'Save Task' : 'Add Task'}</button>
          {isEditing && (
            <button type="button" className="cancel-btn" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="info-row">
        {status === 'loading' && <span className="loading">Updating tasks...</span>}
        {error && <span className="error">{error}</span>}
      </div>

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-card">
            <span className={task.completed ? 'completed' : ''}>{task.title}</span>
            <div className="task-actions">
              <button type="button" className="edit" onClick={() => startEdit(task)}>
                Edit ✏️
              </button>
              <button type="button" className="delete" onClick={() => deleteTask(task.id)}>
                Delete 🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Task
