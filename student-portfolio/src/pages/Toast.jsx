import './Toast.css'

function Toast({ message, type = 'success' }) {
  if (!message) return null

  return (
    <div className={`toast toast-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {message}
    </div>
  )
}

export default Toast