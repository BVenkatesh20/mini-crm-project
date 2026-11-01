# Mini CRM

A small CRM for managing **leads**, **companies** and **tasks**, with JWT authentication and a live dashboard.

- **Frontend:** React 18, Vite, React Router, Axios, MUI
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Auth:** JWT access token + bcrypt password hashing

---

## Table of contents

1. [Features](#features)
2. [Project structure](#project-structure)
3. [Setup](#setup)
4. [Environment variables](#environment-variables)
5. [Demo data and demo user](#demo-data-and-demo-user)
6. [API documentation](#api-documentation)
7. [Authorization explained](#authorization-explained)
8. [Design notes and assumptions](#design-notes-and-assumptions)
9. [Tests](#tests)
10. [Deployment notes](#deployment-notes)

---

## Features

| Module | What it does |
| --- | --- |
| Authentication | Email + password login, bcrypt hashing, JWT access tokens, protected routes, API error messages shown in the UI |
| Dashboard | Total leads, qualified leads, tasks due today, completed tasks. All figures come from MongoDB aggregations |
| Leads | Create, update, list. Fields: name, email, phone, status (New / Contacted / Qualified / Lost), assigned user, company. Search, filters, pagination, soft delete via `isDeleted` |
| Companies | Create, list, view details with associated leads |
| Tasks | Create tasks for leads, assign to users. Fields: title, lead, assignedTo, dueDate, status. Only the assigned user can change a task's status |

The backend follows MVC: **models** (Mongoose schemas) → **controllers** (business logic) → **routes** (URL mapping), with **middleware** for authentication, authorization, validation and error handling.

## Setup

**Prerequisites:** Node.js 18+ and a MongoDB database (local, or a free MongoDB Atlas cluster).

### 1. Backend

```bash
cd backend
npm install
npm run seed               
npm run local               # http://localhost:5000 
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
npm run build               # production build in frontend/dist
```

Open http://localhost:5173 and sign in with the demo user below.

## Environment variables

Secrets are read from environment variables only. `.env` files are git-ignored; only the `.env.example` templates are committed.

**`backend/.env`**

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign tokens. Use 32+ random characters (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). The server refuses to start without it |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `1d` |
| `PORT` | no | Default `5000` |
| `CLIENT_URL` | no | Allowed CORS origin(s), comma-separated. Default `http://localhost:5173` |
| `NODE_ENV` | no | `development` / `production` |

**`frontend/.env`**

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | no | Backend base URL including `/api`. Default `http://localhost:5000/api` |

## Demo data and demo user

`npm run seed` (in `backend/`) **clears** the users, companies, leads and tasks collections of the database in `MONGO_URI`, then inserts:

- 2 users, 4 companies, 12 leads (one is soft-deleted), 9 tasks (some due today, some completed, one on the deleted lead)
- The soft-deleted lead and its task exist on purpose, to show they are excluded from lists and dashboard counts.

| User | Email | Password |
| --- | --- | --- |
| Demo user | `demo@minicrm.com` | `Demo@1234` |
| Second user | `sam@minicrm.com` | `Sample@1234` |

Log in as both users (e.g. in two browsers) to see that only the assigned user can change a task's status. These credentials are for demonstration only; do not seed a real production database with them. The seed script refuses to run with `NODE_ENV=production` unless `--force` is passed.

With the seed data the dashboard shows: **11** total leads, **3** qualified leads, **3** tasks due today (when viewed on the day you seeded), **3** completed tasks.

## API documentation

Base URL: `http://localhost:5000/api`. All endpoints except `POST /auth/login` and `GET /health` require the header `Authorization: Bearer <token>`.

**Response format**

```jsonc
// success
{ "success": true, "data": { ... }, "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }

// error
{ "success": false, "message": "Validation failed", "errors": [ { "field": "email", "message": "Enter a valid email address" } ] }
```

Status codes: `200/201` success, `400` validation error, `401` missing/invalid/expired token or bad credentials, `403` not allowed, `404` not found, `409` duplicate, `500` unexpected error (generic message, details only in server logs).

### Auth

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ "email", "password" }` | Returns `{ success, token, user }`. Same error for unknown email and wrong password |
| GET | `/auth/me` | - | Current user |
| GET | `/users` | - | List users (`_id`, `name`, `email`) for assignment dropdowns |

### Dashboard

| Method | Path | Query | Description |
| --- | --- | --- | --- |
| GET | `/dashboard/stats` | `dayStart`, `dayEnd` (optional ISO dates, must be sent together) | Returns `{ totalLeads, qualifiedLeads, tasksDueToday, completedTasks }`. The browser sends its local day boundaries so "today" matches the user's timezone; the server's local day is used if omitted |

### Leads

| Method | Path | Description |
| --- | --- | --- |
| GET | `/leads` | List. Query: `page`, `limit` (1-100, default 10), `search` (name/email/phone), `status`, `assignedTo`, `company` |
| POST | `/leads` | Create. Body: `name`*, `email`*, `phone`*, `status` (default `New`), `assignedTo`, `company` |
| GET | `/leads/:id` | Get one |
| PUT | `/leads/:id` | Update (same body as create) |
| DELETE | `/leads/:id` | **Soft delete** (sets `isDeleted: true`) |

Soft-deleted leads are excluded from every normal query (list, get, update, delete, company details, task lists) and from all dashboard counts.

### Companies

| Method | Path | Description |
| --- | --- | --- |
| GET | `/companies` | List all companies (sorted by name) |
| POST | `/companies` | Create. Body: `name`*, `industry`, `website`, `location`. Names are unique (case-insensitive) |
| GET | `/companies/:id` | Company details plus `leads` (non-deleted leads of that company) |

### Tasks

| Method | Path | Description |
| --- | --- | --- |
| GET | `/tasks` | List. Query: `page`, `limit`, `status`, `assignedTo`, `lead`. Tasks of soft-deleted leads are excluded |
| POST | `/tasks` | Create. Body: `title`*, `lead`*, `assignedTo`*, `dueDate`* (ISO date). Status always starts as `Pending` |
| PATCH | `/tasks/:id/status` | Body `{ "status": "Pending" \| "In Progress" \| "Completed" }`. **Only the assigned user may call this (403 otherwise)** |

\* required

## Authorization explained

**Authentication (who are you?)** `middleware/auth.js` (`protect`) runs on every private router. It reads the `Bearer` token, verifies the signature and expiry with `JWT_SECRET` (HS256 only), loads the user from the database and attaches it as `req.user`. A missing, malformed, tampered or expired token, or a deleted user, gets a `401`.

**Authorization (what may you do?)** Task status changes are protected by `middleware/taskAuth.js` (`requireTaskAssignee`), which runs before the controller:

1. Load the task by `:id`; `404` if it does not exist (or its lead is soft-deleted).
2. Compare `task.assignedTo` with `req.user._id`, the identity from the verified JWT.
3. If they differ, respond `403 Forbidden` and the controller never runs.

The user's identity is never read from the request body, query or headers other than the token, so it cannot be spoofed by sending a different user id. The frontend also shows a status dropdown only to the assignee, but that is a convenience; the backend check is what enforces the rule.

**Other protections**

- Passwords are hashed with bcrypt (10 salt rounds) in a model `pre('save')` hook; the hash is `select: false` and stripped from JSON output.
- Login returns the same message for unknown email and wrong password and does a dummy hash comparison for unknown emails to reduce user enumeration.
- Inputs are validated with express-validator; clients can only write whitelisted fields (no mass-assignment of `isDeleted`, `createdBy`, task `status` on create).
- Search input is regex-escaped; request bodies are limited to 10 KB; `helmet` and a CORS allow-list are enabled.
- Errors pass through one handler that never leaks stack traces or internals (500s return a generic message).

## Design notes and assumptions

- **"Tasks due today"** counts tasks whose due date falls within today (in the viewer's timezone) and whose status is not `Completed`. **"Completed tasks"** counts all tasks with status `Completed`. Dashboard figures are global (all users), not per user.
- Task statuses are `Pending`, `In Progress`, `Completed` (the assignment names the field but not the values).
- Any logged-in user can create tasks for any lead and assign them to any user; only status updates are restricted to the assignee.
- A lead's assigned user and company are optional. There is no self-registration; users are created by the seed script.
- Tasks that belong to a soft-deleted lead are hidden from task lists and excluded from dashboard task counts, so deleted leads leave no trace in normal views.
- The JWT is stored in `localStorage` so sessions survive a refresh. This is simple but readable by any script running on the page; an httpOnly cookie would be the hardened alternative.
- `bcrypt` is the native package. If it fails to install on your platform, `bcryptjs` is a drop-in replacement (change the import in `models/User.js` and `controllers/auth.controller.js`).

## Tests

```bash
cd backend
npm test
```

`tests/api.test.js` is an integration suite (node:test + supertest) that runs the real Express app against an in-memory MongoDB (`mongodb-memory-server`). It covers login/JWT protection, validation, lead CRUD + search/filter/pagination, soft delete behaviour, company details, task creation, the **assignee-only authorization (403)** and dashboard aggregation correctness. `mongodb-memory-server` downloads a `mongod` binary on first run, or set `MONGOMS_SYSTEM_BINARY` to use one you already have installed.

## Deployment notes

Nothing here is deployed automatically. A typical setup:

- **Database:** MongoDB Atlas. Create a database user, allow your backend's IP, copy the connection string into `MONGO_URI`.
- **Backend** (Render, Railway, Fly.io, ...): root `backend/`, build `npm install`, start `npm start`. Set `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production` and `CLIENT_URL` (your frontend's URL).
- **Frontend** (Netlify, Vercel, Cloudflare Pages, ...): root `frontend/`, build `npm run build`, publish `dist`. Set `VITE_API_URL` to `https://<your-backend>/api`. Add an SPA fallback rule so unknown paths serve `index.html` (Netlify: `/* /index.html 200`; Vercel: rewrite to `/index.html`).
- Run `npm run seed -- --force` once against the production database only if you want the demo data.
