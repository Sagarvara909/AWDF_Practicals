import "./ErrorMessage.css";

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-box" role="alert">
      <div className="error-icon">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="9.5" />
          <line x1="12" y1="7.5" x2="12" y2="13" />
          <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <p className="error-title">request_failed</p>
      <p className="error-message">{message}</p>

      <button type="button" className="error-retry-btn" onClick={onRetry}>
        ↻ Retry
      </button>
    </div>
  );
}

export default ErrorMessage;