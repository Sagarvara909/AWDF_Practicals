import { useEffect, useState } from 'react'
import { getCurrentUser, getTaskHistory, getTasks, updateCurrentUser } from '../api'

function formatTaskDate(value) {
  if (!value) return 'Not recorded'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString()
}

function addTaskTable(pdf, tasks, title, startY) {
  const margin = 14
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const availableWidth = pageWidth - margin * 2
  const columnWidths = [0.46, 0.16, 0.19, 0.19].map((width) => availableWidth * width)
  const headers = ['Task', 'Status', 'Created', 'Last updated']
  let y = startY

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(25, 69, 58)
  pdf.text(title, margin, y)
  y += 5

  if (tasks.length === 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(80, 90, 86)
    pdf.text('No tasks found.', margin, y + 3)
    return y + 13
  }

  function drawHeader() {
    pdf.setFillColor(25, 69, 58)
    pdf.rect(margin, y, availableWidth, 9, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(255, 255, 255)
    let x = margin
    headers.forEach((header, index) => {
      pdf.text(header, x + 2, y + 6)
      x += columnWidths[index]
    })
    y += 9
  }

  drawHeader()
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)

  tasks.forEach((task, index) => {
    const status = task.status || (task.completed ? 'completed' : 'pending')
    const values = [task.title, status[0].toUpperCase() + status.slice(1), formatTaskDate(task.createdAt), formatTaskDate(task.updatedAt)]
    const cellLines = values.map((value, column) => pdf.splitTextToSize(String(value), columnWidths[column] - 4))
    const rowHeight = Math.max(9, ...cellLines.map((lines) => lines.length * 4 + 4))

    if (y + rowHeight > pageHeight - margin) {
      pdf.addPage()
      y = margin
      drawHeader()
    }

    if (index % 2 === 0) {
      pdf.setFillColor(239, 245, 241)
      pdf.rect(margin, y, availableWidth, rowHeight, 'F')
    }

    let x = margin
    cellLines.forEach((lines, column) => {
      pdf.setTextColor(35, 45, 40)
      pdf.text(lines, x + 2, y + 4)
      x += columnWidths[column]
    })
    pdf.setDrawColor(218, 226, 220)
    pdf.line(margin, y + rowHeight, margin + availableWidth, y + rowHeight)
    y += rowHeight
  })

  return y + 12
}

function addActivityTable(pdf, history, startY) {
  const margin = 14
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const availableWidth = pageWidth - margin * 2
  const columnWidths = [0.24, 0.53, 0.23].map((width) => availableWidth * width)
  const headers = ['Event', 'Details', 'Date']
  let y = startY

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(25, 69, 58)
  pdf.text('Task activity history', margin, y)
  y += 5

  if (history.length === 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(80, 90, 86)
    pdf.text('No task activity recorded.', margin, y + 3)
    return
  }

  function drawHeader() {
    pdf.setFillColor(25, 69, 58)
    pdf.rect(margin, y, availableWidth, 9, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(255, 255, 255)
    let x = margin
    headers.forEach((header, index) => {
      pdf.text(header, x + 2, y + 6)
      x += columnWidths[index]
    })
    y += 9
  }

  drawHeader()
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)

  history.forEach((entry, index) => {
    const values = [entry.event, entry.details || '', formatTaskDate(entry.createdAt)]
    const cellLines = values.map((value, column) => pdf.splitTextToSize(String(value), columnWidths[column] - 4))
    const rowHeight = Math.max(9, ...cellLines.map((lines) => lines.length * 4 + 4))

    if (y + rowHeight > pageHeight - margin) {
      pdf.addPage()
      y = margin
      drawHeader()
    }

    if (index % 2 === 0) {
      pdf.setFillColor(239, 245, 241)
      pdf.rect(margin, y, availableWidth, rowHeight, 'F')
    }

    let x = margin
    cellLines.forEach((lines, column) => {
      pdf.setTextColor(35, 45, 40)
      pdf.text(lines, x + 2, y + 4)
      x += columnWidths[column]
    })
    pdf.setDrawColor(218, 226, 220)
    pdf.line(margin, y + rowHeight, margin + availableWidth, y + rowHeight)
    y += rowHeight
  })
}

function Profile() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setEmail(user.email)
        setRole(user.role)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const user = await updateCurrentUser({ email })
      setEmail(user.email)
      setMessage('Your profile was updated.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function downloadTaskReport() {
    setError('')
    setMessage('')
    setReportLoading(true)

    try {
      const { jsPDF } = await import('jspdf')
      const [tasks, history] = await Promise.all([getTasks(), getTaskHistory()])
      const activeTasks = tasks.filter((task) => (task.status || (task.completed ? 'completed' : 'pending')) !== 'completed')
      const pdf = new jsPDF()
      const generatedAt = new Date()

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(19)
      pdf.setTextColor(25, 69, 58)
      pdf.text('Task report', 14, 20)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(80, 90, 86)
      pdf.text(`Account: ${email}`, 14, 28, { maxWidth: 182 })
      pdf.text(`Generated: ${generatedAt.toLocaleString()}`, 14, 34)

      const nextY = addTaskTable(pdf, activeTasks, 'Live tasks', 44)
  const historyY = addTaskTable(pdf, tasks, 'All current tasks', nextY)
  addActivityTable(pdf, history, historyY)
      pdf.save(`task-report-${generatedAt.toISOString().slice(0, 10)}.pdf`)
      setMessage('Your task report was downloaded.')
    } catch (err) {
      setError(err.message)
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <section className="page-card auth-page profile-page">
      <h2>My Profile</h2>
      <p>View and update only your own account information.</p>
      {loading ? <p className="help-text">Loading profile...</p> : (
        <>
          <form className="auth-form" onSubmit={saveProfile}>
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="profile-role">Role</label>
            <input id="profile-role" type="text" value={role} readOnly />
            <button type="submit">Save Profile</button>
          </form>
          <button type="button" className="btn profile-export-btn" onClick={downloadTaskReport} disabled={reportLoading}>
            {reportLoading ? 'Preparing PDF...' : 'Download Task PDF'}
          </button>
        </>
      )}
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </section>
  )
}

export default Profile
