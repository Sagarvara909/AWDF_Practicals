import { useState } from 'react'

function Contact() {
  const [message, setMessage] = useState('')
  const [showHelp, setShowHelp] = useState(true)

  return (
    <section style={{ padding: '20px', margin: '20px', backgroundColor: '#fff8e1', borderRadius: '8px' }}>
      <h2>Contact Me</h2>
      <p>Feel free to reach out for collaboration or project discussions.</p>

      <button
        onClick={() => setShowHelp((prev) => !prev)}
        style={{ marginBottom: '15px', padding: '8px 12px', border: 'none', borderRadius: '4px', backgroundColor: '#4CAF50', color: 'white', cursor: 'pointer' }}
      >
        {showHelp ? 'Hide Help' : 'Show Help'}
      </button>

      {showHelp && (
        <p style={{ marginBottom: '15px', color: '#8d6e63' }}>
          Tip: Share your idea and I will get back to you soon.
        </p>
      )}

      <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        Message
      </label>
      <textarea
        id="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows="5"
        placeholder="Write your message here..."
        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
      />
      <p style={{ marginTop: '8px', color: '#555' }}>Character count: {message.length}</p>
      <p style={{ marginTop: '10px' }}>Preview: {message || 'Your message will appear here.'}</p>
    </section>
  )
}

export default Contact
