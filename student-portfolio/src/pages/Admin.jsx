import { useEffect, useState } from 'react'
import { deleteAdminUser, getAdminUsers, updateAdminUser } from '../api'

function Admin() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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

  return (
    <section className="page-card page-card--wide admin-page">
      <h2>Admin User Management</h2>
      <p>Administrators can view and edit account email addresses and roles. Passwords and OTPs are never displayed.</p>
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
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Admin
