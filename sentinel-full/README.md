# Sentinel — Secure Document Sharing Platform

Sentinel is a security-focused document sharing platform built using React, Vite, TypeScript, Node.js, Express, PostgreSQL, and Prisma. It helps users securely upload, manage, share, and access documents based on their permissions.

## Features

- Session-based authentication with Argon2id password hashing
- Role-based access for Admin, Manager, and Employee
- Server-side authorization for document operations
- Private document storage
- Secure document uploads with filename validation
- Document sharing and access revocation
- Audit logs for sensitive actions and denied access
- Rate limiting and security headers
- Automated authorization and security tests
- Responsive dashboard

## Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- CSS

**Backend**
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

## Prerequisites

Install the following before running the project:

- Node.js 24 LTS
- npm
- PostgreSQL 15 or later
- Trae or another code editor

## Project Structure

```text
sentinel-full/
├── client/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   ├── tests/
│   └── package.json
├── docs/
├── storage/
├── .env.example
├── package.json
├── README.md
├── PROMPTS.md
└── THREATS.md
```

## Installation and Setup

### Step 1: Open the project

Open the `sentinel-full` folder in Trae.

If your terminal is currently in the `sentinel-complete` folder, run:

```powershell
cd sentinel-full
```

### Step 2: Set up PostgreSQL

Make sure PostgreSQL is installed and running.

Create a database named `sentinel` using pgAdmin or your preferred PostgreSQL tool.

### Step 3: Configure environment variables

Open the `server` folder.

Create a file named `.env` inside `server/`. You can copy `server/.env.example` and rename the copy to `.env`.

Configure the following variables using your own local PostgreSQL credentials:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sentinel?schema=public"
SESSION_SECRET="REPLACE_WITH_A_LONG_RANDOM_SECRET"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password. Use a strong, randomly generated session secret.

Keep `.env` private. Never commit it to GitHub.

### Step 4: Install and prepare the backend

Open a Trae terminal and run:

```powershell
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
```

These commands install backend dependencies, generate the Prisma client, apply database migrations, and create the development demo accounts.

Keep this terminal open.

### Step 5: Start the backend

In the same terminal, run:

```powershell
npm run dev
```

The backend is expected to run at:

**http://localhost:4000**

Keep the backend terminal running while using the application.

### Step 6: Install and start the frontend

Open a **second terminal** in Trae. Run:

```powershell
cd "C:\Users\Gurramsreenivasaredy\Downloads\sentinel-complete\sentinel-full\client"
npm install
npm run dev
```

The frontend should be available at:

**http://localhost:5173**

Open this address in your browser to use Sentinel.

## Running the Project After Initial Setup

Whenever you want to run Sentinel again:

**Terminal 1 — Backend**

```powershell
cd "C:\Users\Gurramsreenivasaredy\Downloads\sentinel-complete\sentinel-full\server"
npm run dev
```

**Terminal 2 — Frontend**

```powershell
cd "C:\Users\Gurramsreenivasaredy\Downloads\sentinel-complete\sentinel-full\client"
npm run dev
```

Start PostgreSQL before starting the backend. You normally do not need to repeat installation, Prisma generation, migrations, or seeding every time.

## Development Demo Accounts

The seed script creates the following development accounts, as configured in the project:

| Role | Email | Password |
|---|---|---|
| Admin | admin@sentinel.local | Admin123!DevOnly |
| Manager | manager@sentinel.local | Manager123!DevOnly |
| Employee | employee1@sentinel.local | Employee123!DevOnly |
| Employee | employee2@sentinel.local | Employee123!DevOnly |

These credentials are for local development only. Do not use them for a public production deployment.

## Running Tests

To run the backend tests:

```powershell
cd server
npm test
```

Run this from the `sentinel-full` directory. Ensure the required dependencies are installed first.

## Security Notes

- All document operations must be authorized by the backend.
- Private documents must not be exposed through the frontend's public directory.
- Document downloads must require an authorization check.
- Environment files and credentials must remain private.
- Review `THREATS.md` before deploying the application.

## Production Deployment

Before deploying Sentinel publicly:

- Use a managed PostgreSQL database.
- Configure private file or object storage.
- Enable HTTPS and secure session cookies.
- Generate strong production secrets.
- Rotate or remove development demo credentials.
- Configure backups, monitoring, and appropriate access controls.

Sentinel must be tested and securely configured before production use.
