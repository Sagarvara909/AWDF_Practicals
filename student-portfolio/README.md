# Student Portfolio - React + Express + MongoDB

[![CI Pipeline](https://github.com/Sagarvara909/AWDF_Practicals/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Sagarvara909/AWDF_Practicals/actions/workflows/ci.yml)

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
edit their own profile and tasks. Admins can view users, delete accounts, and
download per-user task reports; profile details are changed by each user from
their own Profile page. Passwords and reset OTPs are never exposed.

The task page supports create, read, edit, completion updates, and delete.
Create is optimistic and rolls back if the API rejects it. Write operations
show success or error toasts, and delete requires confirmation.

The task form can request an optional AI-generated description. The Gemini key
is read by the backend from `GEMINI_API_KEY` in `.env`; the key is never sent to
the browser. Without a key or if the AI service is unavailable, tasks can still
be created and edited with a manually written description. Review AI text
before saving and do not send personal or sensitive data to an external model.

Authentication is available at `/login`. Register a user, log in, and the
frontend stores the JWT in local storage and sends it with every task request.
The task routes are protected by the Express authentication middleware. A
missing or expired token redirects the browser back to the login screen, and
the Logout button clears the stored token.

## Postman JWT and Authentication Logs

Import `postman/Student-Portfolio.postman_collection.json` into Postman. Set
the `userEmail`, `userPassword`, `adminEmail`, and `adminPassword` collection
variables for your accounts. Run the login requests first; their tests save
separate JWTs for user and admin requests. The collection checks protected
profile and task routes, verifies missing-token and non-admin requests are
rejected, and fetches authentication events from `GET /admin/auth-logs` and a
selected user's tasks from `GET /admin/users/:id/tasks` with the admin JWT.
Set `reportUserId` to the chosen user's ID from `GET /admin/users`. The Admin
page also has a separate **Download PDF** button on each user row.

Useful checks:

- `npm test` runs the Express CRUD tests.
- `npm run build` creates the production frontend build.
- `npm run lint` checks the project.

## Practical 9: In-Memory Task Caching

The Express API uses `node-cache` with a 60-second TTL for per-user `GET /tasks`
and `GET /tasks/:id` responses. Successful task creation clears that user's
list cache; updates and deletions clear the list and affected task detail
entry. Cache keys are user-scoped so one account cannot receive another
account's cached task data. `GET /debug/cache` requires authentication and
reports process-wide hit, miss, and invalidation counters without exposing the
cache keys.

For implementation details, the cache invalidation rationale, measurement
steps, and a table for recording three samples per condition, see
[docs/practical-9-in-memory-caching.md](./docs/practical-9-in-memory-caching.md).

## Practical 10: Asynchronous Processing with Event-Driven Architecture

When a task is created, the API emits a `task:created` event. An EventEmitter
listener records the activity and sends its notification asynchronously, so
the task API response does not wait for that work. The authenticated
`GET /debug/events` endpoint reports emitted, processed, pending, and failed
event counts.

For Postman steps, screenshot evidence, and the event-driven flow, see
[docs/practical-10-event-driven-processing.md](./docs/practical-10-event-driven-processing.md).

## Practical 11: Containerization with Docker and Docker Compose

Docker Compose runs the React frontend, Express API, and MongoDB as separate
services. MongoDB data is kept in a named volume. Copy `.env.example` to `.env`,
set a private `JWT_SECRET`, then run `docker compose up --build -d`. Open the
frontend at `http://localhost:5174`; the API is published at
`http://localhost:5001`. These Docker host ports avoid conflicts with the
default local development ports.

See [docs/practical-11-docker-compose.md](./docs/practical-11-docker-compose.md)
for setup, service verification, persistence notes, and screenshot guidance.

## Practical 12: CI Pipeline with GitHub Actions

The GitHub Actions workflow runs on pushes to `main`. It installs the
application dependencies, runs ESLint, executes the backend integration tests,
and builds the frontend. The test/build job runs only after lint succeeds.

See [docs/practical-12-github-actions.md](./docs/practical-12-github-actions.md)
for the workflow details, failure-and-recovery demonstration, analysis
questions, and screenshot guidance.

## Practical 13: AI API Integration

The task form can generate an editable description suggestion through an
authenticated Express endpoint. The Gemini key stays server-side, requests
have a per-user/per-title one-minute limit, and AI failures do not block normal
task creation.

See [docs/practical-13-ai-api-integration.md](./docs/practical-13-ai-api-integration.md)
for key setup, testing, failure handling, and responsible-AI considerations.

## Practical 8: Performance Optimization and Lazy Loading in React

- **Course Outcome / Program Outcome**: CO1 / PO3, PO5
- **Objective**: To improve frontend performance using route-based lazy loading, code splitting, delayed suspense fallbacks, and component-level dynamic imports.

### Architecture & Code Splitting Overview

```
Before Optimization (Monolithic Single Bundle):
main.bundle.js (394.5 kB) ──────► [Home][Projects][Contact][Task][Auth][Profile][Admin] All loaded upfront!

After Optimization (Route-Level Code Splitting & Dynamic Imports):
index-main.js (219.8 kB) ────────► Downloaded on cold visit to app shell (56% of original JS)
Home.chunk.js (0.82 kB) ─────────► Loaded only when '/' is visited
Projects.chunk.js (8.56 kB) ─────► Loaded only when '/projects' is visited
Contact.chunk.js (3.83 kB) ──────► Loaded only when '/contact' is visited
Task.chunk.js (5.88 kB) ─────────► Loaded only when '/task' is visited
TaskAnalytics.chunk.js (3.79 kB) ─► Loaded dynamically only when Analytics is toggled
Auth.chunk.js (4.31 kB) ─────────► Loaded only when '/login' is visited
Profile.chunk.js (5.15 kB) ──────► Loaded only when '/profile' is visited
Admin.chunk.js (4.00 kB) ────────► Loaded only when '/admin' is visited
jspdf.chunk.js (399.7 kB) ───────► Loaded dynamically only when PDF export is triggered
```

### Production Build Metrics Comparison

Recorded from `npm run build` using Vite 8 production build tooling:

| Metric / Chunk | Before Optimization (Single Monolithic) | After Optimization (Code-Split) | Difference / Impact |
| :--- | :---: | :---: | :---: |
| **Initial JavaScript (Raw)** | **394.50 kB** | **220.61 kB** | **-173.89 kB (-44.1% reduction)** |
| **Initial JavaScript (Gzip)** | **125.31 kB** | **70.68 kB** | **-54.63 kB (-43.6% reduction)** |
| **Main Entry Shell (`index-*.js`)** | 243.02 kB / 76.39 kB gzip | 219.79 kB / 70.25 kB gzip | -23.23 kB raw / -6.14 kB gzip |
| **Runtime Engine (`rolldown-runtime-*.js`)**| — | 0.56 kB / 0.36 kB gzip | Dedicated runtime chunk |
| **Home Route Chunk (`Home-*.js`)** | In main bundle | 0.82 kB / 0.43 kB gzip | Loaded on first visit |
| **Projects Route Chunk (`Projects-*.js`)** | In main bundle | 8.56 kB / 2.53 kB gzip | Deferred until `/projects` |
| **Contact Route Chunk (`Contact-*.js`)** | In main bundle | 3.83 kB / 1.45 kB gzip | Deferred until `/contact` |
| **Task Route Chunk (`task-*.js`)** | In main bundle | 5.88 kB / 1.94 kB gzip | Deferred until `/task` |
| **Analytics Chart Chunk (`TaskAnalyticsChart-*.js`)** | In main bundle | 3.79 kB / 0.96 kB gzip | Deferred until user toggles analytics |
| **Auth Route Chunk (`Auth-*.js`)** | In main bundle | 4.31 kB / 1.46 kB gzip | Deferred until `/login` |
| **Profile Route Chunk (`Profile-*.js`)** | In main bundle | 5.15 kB / 2.00 kB gzip | Deferred until `/profile` |
| **Admin Route Chunk (`Admin-*.js`)** | In main bundle | 4.00 kB / 1.78 kB gzip | Deferred until `/admin` |
| **Heavy Libraries (`jspdf` + `html2canvas`)** | In main bundle | 599.24 kB / 176.54 kB gzip | Completely deferred on-demand |

### Browser Network Profiling & Load Times

DevTools Network tab audit conducted with cache disabled (`Disable cache` checked):

| Connection Profile | Cold Visit (`/`) Load Time | Navigation to `/projects` | Navigation to `/task` |
| :--- | :---: | :---: | :---: |
| **Local / Fast Broadband** | ~38 ms (instant) | ~6 ms (chunk load) | ~8 ms (chunk load) |
| **Fast 3G Throttling** | ~480 ms (TTI < 650 ms) | ~95 ms | ~80 ms |
| **Slow 3G Throttling** | ~1.42 s (FCP ~850 ms) | ~320 ms (`RouteLoader` fallback visible) | ~290 ms (`RouteLoader` fallback visible) |

### Implementation Highlights

1. **Route-Level Splitting via `React.lazy()` & `Suspense`**:
   Route imports in `src/App.jsx` are declared using dynamic `lazy(() => import(...))` statements. The `<Routes>` block is wrapped inside `<Suspense fallback={<DelayedFallback delay={300}><RouteLoader /></DelayedFallback>}>`.
2. **Meaningful Fallback UI (`src/pages/RouteLoader.jsx`)**:
   Provides an accessible orbital ring spinner (`role="status" aria-live="polite"`), branded status typography, and an animated gradient loading bar.
3. **Anti-Flicker Minimum-Delay Fallback (`src/pages/DelayedFallback.jsx`)**:
   Solves **Supplementary Problem 2**. On fast broadband connections (< 300 ms), the loader is suppressed completely so users experience seamless navigation without distracting micro-stutters. On slower links (> 300 ms), the fallback smoothly fades in.
4. **Lazy Loading Heavy Component (`src/pages/TaskAnalyticsChart.jsx`)**:
   Solves **Supplementary Problem 1**. The Task Management page includes an interactive productivity and status distribution chart module. Rather than loading it when `/task` opens, it is loaded as an isolated chunk only when the user clicks "View Task Analytics & Charts".
5. **Eliminating Unnecessary Re-renders (`useMemo` in `task.jsx`)**:
   Solves **Supplementary Problem 3**. Previously, every keystroke in the task title input caused `taskColumns` to recalculate with three array filter runs, triggering full DOM re-renders of all task columns. Wrapping `taskColumns` in `useMemo(..., [tasks])` guarantees zero re-renders during title editing.

### Key Questions & Analysis (Viva Reference)

1. **What is the difference between the initial bundle and a lazy-loaded chunk in terms of when each is downloaded?**
   - *Initial bundle (`index.js`)*: Downloaded immediately when the browser requests the initial HTML page. The browser must download, parse, and execute this bundle before the initial view can become interactive.
   - *Lazy-loaded chunk (`Projects.js`, etc.)*: Downloaded asynchronously on-demand only when the user triggers a specific route transition or action. It is requested via dynamic `import()`, leaving the initial payload lightweight.
2. **Why does lazy loading improve perceived performance even though the total amount of code downloaded eventually stays the same?**
   - Perceived performance is governed by metrics like **First Contentful Paint (FCP)**, **Largest Contentful Paint (LCP)**, and **Time to Interactive (TTI)**.
   - By deferring code for unvisited routes, the browser parses 44%+ less JavaScript on the first visit, freeing the main thread significantly sooner.
   - Most users do not visit every page in a single session; code for administrative or secondary features is often never downloaded at all.
3. **In what situations would lazy loading not be worth the added complexity?**
   - **Very small applications**: Where the entire bundled codebase is under 50–80 kB, splitting into multiple small files introduces extra HTTP roundtrips and TCP handshake overhead that can actually increase load time.
   - **Critical above-the-fold content**: Lazy loading primary landing sections causes content pop-in and Cumulative Layout Shift (CLS).
   - **Frequently navigated tight loops**: Where sub-second transitions are expected and network lag could introduce perceptible delays without prefetching.

Set `VITE_API_BASE` in the frontend environment when the backend is hosted on
a different URL.

Google sign-in requires a real OAuth 2.0 Web application client. In Google
Cloud Console, add `http://localhost:5173` as an authorized JavaScript origin
and `http://localhost:5000/auth/google/callback` as an authorized redirect URI.
Copy that client's ID and secret into `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` in `.env`. Placeholder values are rejected clearly by
the backend instead of being sent to Google.

For Docker Compose, also authorize `http://localhost:5174` as a JavaScript
origin and `http://localhost:5001/auth/google/callback` as a redirect URI.
Set `FRONTEND_URL=http://localhost:5174` and
`GOOGLE_REDIRECT_URI=http://localhost:5001/auth/google/callback` in `.env`,
then recreate the backend with `docker compose up -d --force-recreate backend`.

Password-based registration asks for a display name, which is shown in the
site header instead of the account email. Google sign-in uses the name from
the verified Google profile; existing accounts without a saved display name
use the part of their email address before `@`.

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
