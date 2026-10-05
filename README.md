# IndusConnect

Unified enterprise mobility and logistics platform for managing shuttle bookings, travel requests, accommodations, driver operations, vehicle fleets, expenses, vendor activity, telemetry, reports, and audit logs.

## Screenshots

Add product screenshots to document the main user journeys, such as:

- Dashboard overview
- Shuttle booking flow
- Driver trip management
- Travel request approvals
- Expense review and reporting

Suggested location: `docs/screenshots/`

## GIF Demo

Add a short animated walkthrough of the core workflow here.

Suggested location: `docs/demo/indusconnect-demo.gif`

## Overview

IndusConnect is a full-stack monorepo with a React + Vite client and an Express + Prisma backend. The application is organized around enterprise transport and operational workflows, with role-based access, audit logging, and API-driven modules for business operations.

## Tech Stack

### Client

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React

### Server

- Node.js
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- JWT authentication
- Cookie-based session handling
- Multer for uploads

## Architecture Diagram

```mermaid
flowchart LR
	U[User / Browser] --> C[React + Vite Client]
	C -->|REST API| S[Express + TypeScript Server]
	S --> A[Auth, validation, audit middleware]
	S --> P[Prisma ORM]
	P --> D[(PostgreSQL)]
	S --> F[Uploads / receipts]
	S --> R[API docs and health endpoints]
```

## Folder Structure

```text
indusconnect/
├─ client/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ auth/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ types/
│  │  └─ main.tsx
│  ├─ public/
│  └─ package.json
├─ server/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  ├─ seed.ts
│  │  └─ migrations/
│  ├─ src/
│  │  ├─ app.ts
│  │  ├─ server.ts
│  │  ├─ config/
│  │  ├─ middleware/
│  │  └─ modules/
│  ├─ uploads/
│  └─ package.json
├─ docs/
│  ├─ API_DOCUMENTATION.md
│  ├─ api/
│  ├─ database/
│  ├─ screenshots/
│  └─ testing/
└─ README.md
```

## Features

- Role-based enterprise mobility workflows
- Shuttle booking and assignment management
- Driver trip lifecycle tracking
- Travel request approvals
- Accommodation reservation handling
- Expense claims and review flows
- Vehicle, route, and driver administration
- Vendor, telemetry, notification, and maintenance modules
- Audit logging and reporting support
- API documentation and health checks

## Installation Guide

### Prerequisites

- Node.js 18 or later
- npm
- PostgreSQL database

### 1. Clone the repository

```bash
git clone <repository-url>
cd indusconnect
```

### 2. Install client dependencies

```bash
cd client
npm install
```

### 3. Install server dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside `server/` with at least:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=5000
```

If you use a different client origin, update the CORS origin in `server/src/app.ts` as needed.

### 5. Prepare the database

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

### 6. Run the development servers

Run the backend:

```bash
npm run dev
```

Run the frontend from a second terminal:

```bash
cd ../client
npm run dev
```

### 7. Build for production

Client:

```bash
cd client
npm run build
```

Server:

```bash
cd server
npm run build
```

## API Docs

The backend exposes a dedicated documentation route at `/api/docs` and a health check at `/api/health`.

### Core Route Groups

- `/api/auth`
- `/api/users`
- `/api/vehicles`
- `/api/drivers`
- `/api/routes`
- `/api/shuttle-bookings`
- `/api/driver-trips`
- `/api/travel-requests`
- `/api/accommodation`
- `/api/expenses`
- `/api/reports`
- `/api/audit-logs`
- `/api/vendors`
- `/api/telemetry`
- `/api/notifications`
- `/api/proxy-bookings`
- `/api/policies`
- `/api/maintenance`
- `/api/erp-exports`
- `/api/frontend`
- `/api/demo`

### Useful endpoints

- `GET /` returns a simple API status payload
- `GET /api/health` returns backend health information
- `GET /api/docs` serves API documentation

For a detailed endpoint reference, see [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## Production Deployment

IndusConnect is configured for production deployment across:
- **Database**: [Neon PostgreSQL](https://neon.tech) (serverless connection pooling + direct migrations)
- **Backend API**: [Render](https://render.com) (Node.js Express service, Infrastructure-as-Code via `render.yaml`)
- **Frontend**: [Vercel](https://vercel.com) (React + Vite SPA with `client/vercel.json` rewrite routing)

For complete step-by-step instructions, see the [Production Deployment Guide](docs/DEPLOYMENT.md).

## License

ISC

## Future Improvements

- Add committed screenshots for the primary flows
- Add a short product demo GIF
- Publish a complete OpenAPI specification
- Add automated API and E2E coverage for the major workflows
- Add CI checks for linting, type checking, and migrations
- Expand deployment notes with environment-specific examples
- Document the role matrix and permission boundaries in more detail
