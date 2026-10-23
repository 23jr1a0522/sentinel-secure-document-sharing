# Sentinel — Secure Document Sharing Platform

Sentinel is a security-first document sharing application built with React, Vite, TypeScript, Node.js, Express, PostgreSQL and Prisma.

## Features
- Session-based authentication with Argon2id passwords
- Admin, Manager and Employee roles
- Server-side resource authorization
- Private document storage
- Upload validation and safe filenames
- Explicit document sharing and revocation
- Audit logging for sensitive actions and denied access
- Rate limiting and security headers
- Automated authorization/security tests
- Responsive dashboard

## Prerequisites
- Node.js 24 LTS recommended
- PostgreSQL 15+
- Git

## Setup (PowerShell)
```powershell
Copy-Item .env.example .env
npm install
npm run install:all
# Edit server/.env or root .env with your PostgreSQL URL and session secret.
cd server
npx prisma migrate dev --name init
npm run seed
cd ..
npm run dev
```
Frontend: http://localhost:5173
API: http://localhost:5000

Development demo accounts created by seed:
- admin@sentinel.local / Admin123!DevOnly
- manager@sentinel.local / Manager123!DevOnly
- employee1@sentinel.local / Employee123!DevOnly
- employee2@sentinel.local / Employee123!DevOnly

These are development-only credentials. Rotate/remove them for any public deployment.

## Test
```powershell
npm test
```

## Security notes
The browser is not a security boundary. Every document operation is authorized on the server. Private files are stored outside the frontend public directory. Download responses are generated only after an authorization check.

## Production
Use a managed PostgreSQL database, private object storage, HTTPS, secure cookies, a strong random session secret, backups, monitoring, and rotated demo credentials. Review THREATS.md before deployment.
