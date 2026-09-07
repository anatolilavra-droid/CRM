# Tasks API

A minimal full-stack task manager: an Express + SQLite REST API paired with a vanilla JS/HTML/CSS frontend for creating, completing, and deleting tasks.

![Frontend screenshot](./docs/screenshot.png)

> **Note:** add a screenshot at `./docs/screenshot.png` — it is not included yet.

## Features

- Create, list, update, and delete tasks (CRUD)
- Toggle task completion from the UI
- Persistent storage via SQLite (file-based, no external DB server)
- Centralized error handling and a `404` handler for unknown routes
- Health-check endpoint for uptime monitoring
- Security headers via Helmet, request logging via Morgan, and rate limiting on the API
- Input validation on task creation/updates
- Graceful shutdown on `SIGINT`/`SIGTERM` (closes the HTTP server and the database connection)
- Frontend served directly by the backend (single origin, no CORS setup needed in development)

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 24.x (tested on v24.2.0) |
| Web framework | Express | ^5.2.1 |
| Database | better-sqlite3 (SQLite) | ^13.0.3 |
| Security headers | Helmet | ^8.3.0 |
| Logging | Morgan | ^1.12.0 |
| Rate limiting | express-rate-limit | ^8.7.0 |
| CORS | cors | ^2.8.6 |
| Env config | dotenv | ^17.4.2 |
| Frontend | HTML, CSS, vanilla JavaScript | — |

`jsonwebtoken` and `bcryptjs` are installed as a foundation for future authentication work but are not wired into any route yet.

## Getting started

### Prerequisites

- Node.js 24.x or later
- npm

### Clone

```bash
git clone <repository-url>
cd "furst fillstack"
```

### Install

```bash
cd backend
npm install
```

### Environment setup

Copy the example env file and adjust values as needed:

```bash
cp .env.example .env
```

At minimum, set `JWT_SECRET` to a real random value before deploying anywhere public (it is currently unused by the app but reserved for future auth).

### Initialize the database

The `tasks` table is created automatically the first time the server starts (`db/database.js` + `routes/tasks.js` share the same `better-sqlite3` connection). To create it explicitly without starting the server:

```bash
npm run db:init
```

### Run in development

```bash
npm run dev
```

Uses `node --watch` to restart the server automatically on file changes.

### Run in production

```bash
npm start
```

Open `http://localhost:3000` — the backend serves the frontend directly from the `frontend/` directory, so no separate frontend server is needed.

## Environment variables

All variables live in `backend/.env` (see `backend/.env.example`).

| Name | Description | Default |
|---|---|---|
| `PORT` | Port the Express server listens on | `3000` |
| `NODE_ENV` | Runtime environment; switches Morgan's log format between `dev` and `combined` | `development` |
| `JWT_SECRET` | Reserved for future JWT-based authentication; not currently used by any route | *(none — must be set manually)* |

## API reference

Base URL: `http://localhost:3000`

### `GET /health`

Health check.

**Response `200`:**
```json
{ "status": "ok" }
```

### `GET /tasks`

List all tasks.

**Response `200`:**
```json
[
  { "id": 1, "title": "Buy milk", "done": 0, "created_at": "2026-09-07 18:17:53" }
]
```

### `GET /tasks/:id`

Get a single task by id.

**Response `200`:**
```json
{ "id": 1, "title": "Buy milk", "done": 0, "created_at": "2026-09-07 18:17:53" }
```

**Errors:** `404` — `{ "error": "Task not found" }`

### `POST /tasks`

Create a task.

**Request body:**
```json
{ "title": "Buy milk", "done": false }
```
`title` is required (non-empty string). `done` is optional (boolean, defaults to `false`).

**Response `201`:**
```json
{ "id": 3, "title": "Buy milk", "done": 0, "created_at": "2026-09-07 18:17:53" }
```

**Errors:**
- `400` — `{ "error": "title is required and must be a non-empty string" }`
- `400` — `{ "error": "done must be a boolean" }`

### `PATCH /tasks/:id`

Update a task's title and/or completion status. Both fields are optional.

**Request body:**
```json
{ "done": true }
```

**Response `200`:**
```json
{ "id": 3, "title": "Buy milk", "done": 1, "created_at": "2026-09-07 18:17:53" }
```

**Errors:**
- `404` — `{ "error": "Task not found" }`
- `400` — `{ "error": "title must be a non-empty string" }`
- `400` — `{ "error": "done must be a boolean" }`

### `DELETE /tasks/:id`

Delete a task.

**Response:** `204 No Content`

**Errors:** `404` — `{ "error": "Task not found" }`

> All `/tasks` routes are rate-limited to 100 requests per 15 minutes per client.

## Project structure

```
.
├── frontend/               # Static frontend, served by the backend
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── index.js            # App entry point: middleware, routes, graceful shutdown
│   ├── package.json
│   ├── .env.example        # Template for backend/.env (not committed)
│   ├── middleware/
│   │   └── errorHandler.js # Centralized 404 and error handlers
│   ├── routes/
│   │   └── tasks.js        # Task CRUD routes + input validation
│   └── db/
│       ├── database.js     # better-sqlite3 connection
│       ├── init.js         # Creates the tasks table (also runs on server start)
│       └── data.db         # SQLite database file (gitignored)
└── README.md
```

## Deployment

1. Provision a Node.js 24.x runtime on your target host (VM, container, or PaaS).
2. Copy the repository, run `npm install --omit=dev` inside `backend/` if you later add dev-only dependencies (currently all dependencies are runtime).
3. Set environment variables (`PORT`, `NODE_ENV=production`, `JWT_SECRET`) via your platform's secret/config mechanism — do not commit `.env`.
4. Run `npm start` from `backend/`, or point your process manager (e.g. `pm2`, `systemd`, or your platform's built-in one) at `node backend/index.js`.
5. The SQLite file (`backend/db/data.db`) is created on disk next to the code; ensure the deployment target has a persistent, writable volume for it — ephemeral filesystems (e.g. some serverless/container platforms) will lose data on restart.
6. Put the app behind a reverse proxy (e.g. Nginx) or your platform's load balancer for TLS termination.

## License

ISC (per `backend/package.json`).
