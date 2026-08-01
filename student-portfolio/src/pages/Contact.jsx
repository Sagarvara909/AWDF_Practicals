import { useState } from 'react'

function Contact() {
  const [message, setMessage] = useState('')
  const [showHelp, setShowHelp] = useState(true)

  return (
    <section className="page-card page-card--wide">
      <div className="contact-header">
        <h2>Contact Me</h2>
        <p>Feel free to reach out for collaboration or project discussions.</p>
      </div>

      <button className="btn btn-secondary" onClick={() => setShowHelp((prev) => !prev)}>
        {showHelp ? 'Hide Help' : 'Show Help'}
      </button>

      {showHelp && <p className="help-text">Tip: Share your idea and I will get back to you soon.</p>}

      <div className="form-group">
        <label htmlFor="message" className="form-label">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="5"
          placeholder="Write your message here..."
          className="input-field textarea-field"
        />
      </div>

      <p className="form-note">Character count: {message.length}</p>
      <p className="form-note">Preview: {message || 'Your message will appear here.'}</p>
    </section>
  )
}

export default Contact
