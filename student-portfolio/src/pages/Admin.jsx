import { useEffect, useState } from 'react'
import { deleteAdminUser, getAdminUserTasks, getAdminUsers, updateAdminUser } from '../api'

function formatTaskDate(value) {
  if (!value) return 'Not recorded'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString()
}

function addAdminTaskTable(pdf, tasks, startY) {
  const margin = 14
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const tableWidth = pageWidth - margin * 2
  const columnWidths = [0.42, 0.16, 0.21, 0.21].map((width) => tableWidth * width)
  const headers = ['Task', 'Status', 'Created', 'Last updated']
  let y = startY

  function drawHeader() {
    pdf.setFillColor(25, 69, 58)
    pdf.rect(margin, y, tableWidth, 9, 'F')
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

  if (!tasks.length) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(80, 90, 86)
    pdf.text('No tasks found.', margin, y)
    return
  }

  drawHeader()
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)

  tasks.forEach((task, index) => {
    const status = task.status || (task.completed ? 'completed' : 'pending')
    const values = [task.title, status, formatTaskDate(task.createdAt), formatTaskDate(task.updatedAt)]
    const cellLines = values.map((value, column) => pdf.splitTextToSize(String(value), columnWidths[column] - 4))
    const rowHeight = Math.max(9, ...cellLines.map((lines) => lines.length * 4 + 4))

    if (y + rowHeight > pageHeight - margin) {
      pdf.addPage()
      y = margin
      drawHeader()
    }

    if (index % 2 === 0) {
      pdf.setFillColor(239, 245, 241)
      pdf.rect(margin, y, tableWidth, rowHeight, 'F')
    }

    let x = margin
    cellLines.forEach((lines, column) => {
      pdf.setTextColor(35, 45, 40)
      pdf.text(lines, x + 2, y + 4)
      x += columnWidths[column]
    })
    pdf.setDrawColor(218, 226, 220)
    pdf.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight)
    y += rowHeight
  })
}

function Admin() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reportLoadingUserId, setReportLoadingUserId] = useState(null)
  const [reportMessage, setReportMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadAdminData(showLoading = false) {
      if (showLoading) setLoading(true)

      try {
        const adminUsers = await getAdminUsers()
        if (!isMounted) return
        setUsers(adminUsers)
        setError('')
      } catch (err) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted && showLoading) setLoading(false)
      }
    }

    loadAdminData(true)
    const refreshTimer = window.setInterval(() => loadAdminData(), 2000)

    return () => {
      isMounted = false
      window.clearInterval(refreshTimer)
    }
  }, [])

  async function changeUser(userId, updates) {
    setError('')
    try {
      const updatedUser = await updateAdminUser(userId, updates)
      setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return

    setError('')
    try {
      await deleteAdminUser(user.id)
      setUsers((current) => current.filter((item) => item.id !== user.id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function downloadUserTasksReport(selectedUser) {
    setError('')
    setReportMessage('')
    setReportLoadingUserId(selectedUser.id)

    try {
      const [{ jsPDF }, report] = await Promise.all([import('jspdf'), getAdminUserTasks(selectedUser.id)])
      const pdf = new jsPDF()
      const generatedAt = new Date()

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(19)
      pdf.setTextColor(25, 69, 58)
      pdf.text('User task report', 14, 20)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(80, 90, 86)
      pdf.text(`User: ${report.user.email}`, 14, 28)
      pdf.text(`Tasks: ${report.tasks.length} | Generated: ${generatedAt.toLocaleString()}`, 14, 34)
      addAdminTaskTable(pdf, report.tasks, 44)
      const fileEmail = report.user.email.replace(/[^a-z0-9.-]/gi, '-')
      pdf.save(`task-report-${fileEmail}-${generatedAt.toISOString().slice(0, 10)}.pdf`)
      setReportMessage(`Downloaded ${report.tasks.length} tasks for ${report.user.email}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setReportLoadingUserId(null)
    }
  }

  return (
    <section className="page-card page-card--wide admin-page">
      <h2>Admin User Management</h2>
      <p>Administrators can view and edit account email addresses and roles. Passwords and OTPs are never displayed.</p>
      {reportMessage && <p className="success-message">{reportMessage}</p>}
      {loading && <p className="help-text">Loading users...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <>
          <div className="admin-user-list">
            {users.map((user) => (
              <article className="admin-user" key={user.id}>
                <input
                  aria-label={`Email for ${user.email}`}
                  type="email"
                  defaultValue={user.email}
                  onBlur={(event) => {
                    if (event.target.value !== user.email) changeUser(user.id, { email: event.target.value })
                  }}
                />
                <select value={user.role} onChange={(event) => {
                  if (event.target.value === 'delete') {
                    event.target.value = user.role
                    removeUser(user)
                    return
                  }
                  changeUser(user.id, { role: event.target.value })
                }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="delete">Delete user</option>
                </select>
                <button
                  type="button"
                  className="btn admin-user-download"
                  onClick={() => downloadUserTasksReport(user)}
                  disabled={reportLoadingUserId !== null}
                  aria-label={`Download task PDF for ${user.email}`}
                >
                  {reportLoadingUserId === user.id ? 'Preparing...' : 'Download PDF'}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Admin
