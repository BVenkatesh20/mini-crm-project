# Mini CRM

A simple CRM to manage **leads**, **companies** and **tasks**, with login and a live dashboard.

- **Frontend:** React, Vite, React Router, Axios, MUI
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Auth:** JWT access token + bcrypt

## Setup

You need Node.js 18+ and a MongoDB database (local or MongoDB Atlas).

### Backend

```bash
cd backend
npm install
cp .env.example .env     # Windows: copy .env.example .env
```

Open `backend/.env` and set `MONGO_URI` and `JWT_SECRET`. Then:

```bash
npm run seed             # loads sample data and the demo user
npm run dev              # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # runs on http://localhost:5173
```

## Environment variables

**backend/.env**

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `1d`) |
| `PORT` | Server port (default `5000`) |
| `CLIENT_URL` | Frontend URL for CORS (default `http://localhost:5173`) |

**frontend/.env**

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend API URL (default `http://localhost:5000/api`) |

## Demo login

Run `npm run seed` first, then open http://localhost:5173 and log in:

| Email | Password |
| --- | --- |
| `demo@minicrm.com` | `Demo@1234` |
| `sam@minicrm.com` | `Sample@1234` |

Use the second user in another browser to check that only the assigned user can change a task's status.

## Features

- **Login:** email + password, bcrypt hashing, JWT, protected routes.
- **Dashboard:** total leads, qualified leads, tasks due today, completed tasks (all from MongoDB aggregation).
- **Leads:** create, update, list, search, filter by status/user/company, pagination, soft delete (`isDeleted`).
- **Companies:** create, list, details page with its leads.
- **Tasks:** create tasks for leads, assign to users, only the assigned user can update status.

## API

All routes need the header `Authorization: Bearer <token>` except login.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Login, returns token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/users` | List users |
| GET | `/api/dashboard/stats` | Dashboard numbers |
| GET, POST | `/api/leads` | List (search, filter, pagination) / create |
| GET, PUT, DELETE | `/api/leads/:id` | Get / update / soft delete |
| GET, POST | `/api/companies` | List / create |
| GET | `/api/companies/:id` | Company details with leads |
| GET, POST | `/api/tasks` | List / create |
| PATCH | `/api/tasks/:id/status` | Update status (assigned user only) |

Errors look like: `{ "success": false, "message": "...", "errors": [...] }`

## Authorization

- **Login check:** `middleware/auth.js` verifies the JWT on every private route and sets `req.user`. Missing or invalid token gives `401`.
- **Task rule:** `middleware/taskAuth.js` runs before a task status update. It compares the task's `assignedTo` with the logged-in user from the token. If they are different, the API returns `403` and nothing is changed.
- The user is always taken from the token, never from the request body, so it cannot be faked.
- Passwords are stored as bcrypt hashes and never returned by the API. Secrets come from `.env` only.
- Soft-deleted leads are hidden from lists, company details, tasks and dashboard counts.

## Notes

- "Tasks due today" = tasks due today that are not completed.
- Task statuses: Pending, In Progress, Completed.
- Users are created by the seed script (no sign-up page).
