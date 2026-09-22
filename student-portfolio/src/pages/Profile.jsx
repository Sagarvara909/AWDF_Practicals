import { useEffect, useState } from 'react'
import { getCurrentUser, updateCurrentUser } from '../api'

function Profile() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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

  return (
    <section className="page-card auth-page profile-page">
      <h2>My Profile</h2>
      <p>View and update only your own account information.</p>
      {loading ? <p className="help-text">Loading profile...</p> : (
        <form className="auth-form" onSubmit={saveProfile}>
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="profile-role">Role</label>
          <input id="profile-role" type="text" value={role} readOnly />
          <button type="submit">Save Profile</button>
        </form>
      )}
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </section>
  )
}

export default Profile
