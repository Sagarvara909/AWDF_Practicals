import './Contact.css'

const socialLinks = [
  {
    name: 'Email',
    handle: 'sagarnarendrabhai@gmail.com',
    href: 'mailto:sagarnarendrabhai@gmail.com',
    className: 'email',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    handle: 'Sagarvara909',
    href: 'https://github.com/Sagarvara909',
    className: 'github',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.13c-3.1.67-3.76-1.32-3.76-1.32-.51-1.3-1.24-1.65-1.24-1.65-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.21 3.26.93.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.15 3.05-1.15.61 1.53.23 2.67.11 2.95.72.78 1.15 1.78 1.15 3 0 4.29-2.61 5.23-5.1 5.51.4.35.76 1.03.76 2.08v3.13c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    handle: 'Sagar Narendra Bhai',
    href: 'https://www.linkedin.com/in/sagar-narendra-bhai-3b765b287/',
    className: 'linkedin',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.74H4.98V9.23h2.95v9.51ZM6.45 7.93a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.29 10.81h-2.94v-4.63c0-1.1-.02-2.51-1.53-2.51-1.54 0-1.78 1.2-1.78 2.43v4.71H9.55V9.23h2.82v1.3h.04c.39-.75 1.35-1.53 2.78-1.53 2.97 0 3.55 1.95 3.55 4.48v5.26Z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@mr._perfect._9090',
    href: 'https://www.instagram.com/mr._perfect._9090/',
    className: 'instagram',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle className="instagram-dot" cx="17.5" cy="6.8" r="1" />
      </svg>
    ),
  },
]

function Contact() {
  return (
    <section className="contact-page">
      <div className="contact-hero">
        <div className="contact-hero-copy">
          <p className="contact-eyebrow">Let's connect</p>
          <h2>Have an idea?<br /><span>Let’s talk.</span></h2>
          <p className="contact-intro">
            I’m always open to interesting projects, new connections, and good conversations.
            Find me on your favorite platform.
          </p>
        </div>
        <div className="contact-orbit" aria-hidden="true">
          <span className="contact-orbit-ring" />
          <span className="contact-orbit-dot" />
          <span className="contact-orbit-label">AVAILABLE<br />TO CONNECT</span>
        </div>
      </div>

      <div className="contact-content">
        <section className="social-section" aria-labelledby="social-heading">
          <div className="contact-section-heading">
            <div>
              <p className="contact-eyebrow">Around the web</p>
              <h3 id="social-heading">Find me online</h3>
            </div>
            <span className="contact-section-index">01 / CONTACT</span>
          </div>

          <div className="social-card-grid">
            {socialLinks.map((social) => (
              <a
                className={`social-card social-card--${social.className}`}
                href={social.href}
                key={social.name}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="social-icon">{social.icon}</span>
                <span className="social-card-copy">
                  <strong>{social.name}</strong>
                  <span>{social.handle}</span>
                </span>
                <span className="social-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>

      </div>
    </section>
  )
}

export default Contact
