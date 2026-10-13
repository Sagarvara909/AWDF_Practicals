import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getGoogleAuthUrl, loginUser, registerUser, requestPasswordReset, resetPassword, saveToken } from '../api'

function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLogin, setIsLogin] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [resetStep, setResetStep] = useState(1)
  const [resetOtp, setResetOtp] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(location.state?.message || '')
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).get('oauthError') || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')

    if (token) {
      saveToken(token)
      navigate('/task', { replace: true })
    }
  }, [navigate])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      if (isResetting) {
        if (resetStep === 1) {
          const response = await requestPasswordReset(email)
          setResetStep(2)
          setMessage(response.message)
          return
        }

        await resetPassword({ email, otp: resetOtp, password })
        setIsResetting(false)
        setResetStep(1)
        setIsLogin(true)
        setResetOtp('')
        setPassword('')
        setMessage('Password reset successfully. Please log in.')
      } else if (isLogin) {
        await loginUser({ email, password })
        navigate('/task')
      } else {
        await registerUser({ email, username, password })
        setIsLogin(true)
        setMessage('Registration successful. Please log in.')
        setPassword('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page-card auth-page">
      <h2>{isResetting ? 'Reset Password' : isLogin ? 'Login' : 'Create Account'}</h2>
      <p>{isResetting ? resetStep === 1 ? 'Enter your email to receive a password reset OTP.' : 'Enter the 6-digit OTP sent to your email and choose a new password.' : isLogin ? 'Sign in to access your protected task list.' : 'Register to create and manage tasks.'}</p>

      <form className="auth-form" onSubmit={submit}>
        {!isResetting && !isLogin && <>
          <label htmlFor="username">User name</label>
          <input id="username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} maxLength="60" autoComplete="name" required />
        </>}
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isResetting && resetStep === 2} required />
        {isResetting && resetStep === 2 && <>
          <label htmlFor="reset-otp">Email OTP</label>
          <input id="reset-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={resetOtp} onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, ''))} required />
          <label htmlFor="password">New password</label>
          <div className="password-input-wrap">
            <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" autoComplete="new-password" required />
            <button type="button" className="password-visibility-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </>}
        {!isResetting && <>
          <label htmlFor="password">Password</label>
          <div className="password-input-wrap">
            <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" autoComplete={isLogin ? 'current-password' : 'new-password'} required />
            <button type="button" className="password-visibility-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : isResetting ? resetStep === 1 ? 'Send OTP' : 'Reset Password' : isLogin ? 'Login' : 'Register'}</button>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      {!isResetting && isLogin && <div className="auth-links">
        <button type="button" className="auth-switch" onClick={() => {
          setError('')
          setMessage('')
          setIsResetting(true)
          setResetStep(1)
          setPassword('')
          setResetOtp('')
        }}>Forgot password?</button>
        <button type="button" className="auth-switch" onClick={() => { setIsResetting(false); setIsLogin(false); setError(''); setMessage('') }}>
          Need an account? Register
        </button>
      </div>}
      {!isResetting && <>
        <div className="auth-divider"><span>or</span></div>
        <a className="google-button" href={getGoogleAuthUrl()}>Continue with Google</a>
      </>}
      {!isLogin && !isResetting && <button type="button" className="auth-switch" onClick={() => { setIsResetting(false); setIsLogin(true); setError(''); setMessage('') }}>
        Already registered? Login
      </button>}
      {isResetting && <button type="button" className="auth-switch" onClick={() => { setIsResetting(false); setResetStep(1); setError(''); setMessage('') }}>Back to login</button>}
    </section>
  )
}

export default Auth