# Student Portfolio - React + Express + MongoDB

A modern, reusable component-based portfolio application built with React and Vite as part of ITUE301 (Advanced Web Development Frameworks) Practical 1.

## Project Overview

This project demonstrates best practices in React component architecture by creating a multi-component portfolio page with:
- Independent, reusable components
- Props-based data flow
- Proper component composition
- Clean, maintainable code structure

The `/task` route is a full-stack task manager. React calls the Express API at
`http://localhost:5000`, and the API persists tasks in MongoDB.

## Run Locally

Requirements: Node.js 18+ and a running MongoDB instance (local or Atlas).

1. Install dependencies: `npm install`
2. Create a `.env` file in the project root:

	```env
	MONGO_URI=mongodb://127.0.0.1:27017/todolist
	MONGO_DB_NAME=todolist
	PORT=5000
	```

3. Start the backend in one terminal: `npm run backend`
4. Start the React frontend in another terminal: `npm run dev`
5. Open `http://localhost:5173/task`

Password reset emails require SMTP settings from `.env`. For local development,
if SMTP is not configured, the backend logs the reset OTP in its terminal.
Production requires `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`.
Set `ADMIN_EMAIL` to the one mailbox that sends reset messages. For Gmail or
Google Workspace, use an app password rather than the normal account password:

```env
ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@example.com
SMTP_PASS=your-16-character-app-password
MAIL_FROM=admin@example.com
```

The first account registered with the configured `ADMIN_EMAIL` receives the
`admin` role. Other accounts receive the `user` role. Users can only view and
edit their own profile and tasks. Admins can use the Admin page to view users
and edit their email or role; passwords and reset OTPs are never exposed.

The task page supports create, read, edit, completion updates, and delete.
Create is optimistic and rolls back if the API rejects it. Write operations
show success or error toasts, and delete requires confirmation.

Authentication is available at `/login`. Register a user, log in, and the
frontend stores the JWT in local storage and sends it with every task request.
The task routes are protected by the Express authentication middleware. A
missing or expired token redirects the browser back to the login screen, and
the Logout button clears the stored token.

Useful checks:

- `npm test` runs the Express CRUD tests.
- `npm run build` creates the production frontend build.
- `npm run lint` checks the project.

Set `VITE_API_BASE` in the frontend environment when the backend is hosted on
a different URL.

Google sign-in requires a real OAuth 2.0 Web application client. In Google
Cloud Console, add `http://localhost:5173` as an authorized JavaScript origin
and `http://localhost:5000/auth/google/callback` as an authorized redirect URI.
Copy that client's ID and secret into `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` in `.env`. Placeholder values are rejected clearly by
the backend instead of being sent to Google.

## Project Structure

```
student-portfolio/
├── src/
│   ├── components/
│   │   ├── Header.jsx       # Site header with name and theme
│   │   ├── About.jsx        # About section
│   │   ├── Skills.jsx       # Skills list (accepts props)
│   │   └── Footer.jsx       # Footer with contact info
│   ├── App.jsx              # Main app component (composition)
│   ├── App.css              # Application styles
│   ├── index.css            # Global styles
│   └── main.jsx             # Entry point
├── package.json
├── vite.config.js
└── index.html
```
