import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTask, deleteTask, getTasks, updateTask } from '../api'
import './Task.css'
import Toast from './Toast'

function Task() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function loadTasks() {
      setStatus('loading')
      try {
        setTasks(await getTasks())
      } catch (err) {
        if (err.status === 401) {
          navigate('/login', { state: { message: 'Please log in to manage tasks.' } })
          return
        }
        setError(err.message)
      } finally {
        setStatus('idle')
      }
    }

    loadTasks()
  }, [navigate])

  async function saveTask(event) {
    event.preventDefault()

    if (!title.trim()) {
      setError('Please enter a task title.')
      return
    }

    setStatus('loading')
    setError('')

    try {
      if (editingTask) {
        const updatedTask = await updateTask(editingTask.id, { title: title.trim() })
        setTasks((current) => current.map((item) => (item.id === editingTask.id ? updatedTask : item)))
        setEditingTask(null)
        setToast({ message: 'Task updated successfully.', type: 'success' })
      } else {
        const optimisticTask = { id: `pending-${Date.now()}`, title: title.trim(), completed: false, status: 'pending' }
        setTasks((current) => [...current, optimisticTask])
        try {
          const createdTask = await createTask({ title: optimisticTask.title, status: 'pending' })
          setTasks((current) => current.map((item) => (item.id === optimisticTask.id ? createdTask : item)))
          setToast({ message: 'Task created successfully.', type: 'success' })
        } catch (err) {
          setTasks((current) => current.filter((item) => item.id !== optimisticTask.id))
          throw err
        }
      }

      setTitle('')
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } })
        return
      }
      setError(err.message)
      setToast({ message: err.message, type: 'error' })
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

  async function removeTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return

    setStatus('loading')
    setError('')

    try {
      await deleteTask(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      setToast({ message: 'Task deleted successfully.', type: 'success' })
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } })
        return
      }
      setError(err.message)
      setToast({ message: err.message, type: 'error' })
    } finally {
      setStatus('idle')
    }
  }

  async function toggleTask(task) {
    setStatus('loading')
    setError('')

    try {
      const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
      const updatedTask = await updateTask(task.id, { status: nextStatus })
      setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)))
      setToast({ message: updatedTask.status === 'completed' ? 'Task completed.' : 'Task marked pending.', type: 'success' })
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } })
        return
      }
      setError(err.message)
      setToast({ message: err.message, type: 'error' })
    } finally {
      setStatus('idle')
    }
  }

  async function changeTaskStatus(task, nextStatus) {
    const previousTask = task
    const optimisticTask = {
      ...task,
      status: nextStatus,
      completed: nextStatus === 'completed',
    }

    setError('')
    setTasks((current) => current.map((item) => (item.id === task.id ? optimisticTask : item)))

    try {
      const updatedTask = await updateTask(task.id, { status: nextStatus })
      setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)))
      setToast({ message: 'Task status updated.', type: 'success' })
    } catch (err) {
      setTasks((current) => current.map((item) => (item.id === task.id ? previousTask : item)))
      if (err.status === 401) {
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } })
        return
      }
      setError(err.message)
      setToast({ message: err.message, type: 'error' })
    }
  }

  const isEditing = Boolean(editingTask)
  const taskColumns = [
    { key: 'pending', label: 'Pending' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
  ].map((column) => ({
    ...column,
    tasks: tasks.filter((task) => (task.status || (task.completed ? 'completed' : 'pending')) === column.key),
  }))

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

      <div className="task-board">
        {taskColumns.map((column) => (
          <section key={column.key} className={`task-column column-${column.key}`}>
            <div className="task-column-header">
              <h3>{column.label}</h3>
              <span>{column.tasks.length}</span>
            </div>
            <ul className="task-list">
              {column.tasks.length === 0 && <li className="empty-column">No tasks here</li>}
              {column.tasks.map((task) => (
                <li key={task.id} className="task-card">
                  <button type="button" className="task-title" onClick={() => toggleTask(task)} disabled={status === 'loading'}>
                    <span className={task.completed ? 'completed' : ''}>{task.title}</span>
                  </button>
                  <select
                    className={`task-status status-${task.status || (task.completed ? 'completed' : 'pending')}`}
                    value={task.status || (task.completed ? 'completed' : 'pending')}
                    onChange={(event) => changeTaskStatus(task, event.target.value)}
                    disabled={status === 'loading'}
                    aria-label={`Status for ${task.title}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="task-actions">
                    <button type="button" className="edit" onClick={() => startEdit(task)}>
                      Edit ✏️
                    </button>
                    <button type="button" className="delete" onClick={() => removeTask(task)} disabled={status === 'loading'}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </section>
  )
}

export default Task
