# API Documentation

All protected routes require the server session cookie.

| Method | Endpoint | Auth | Authorization |
|---|---|---|---|
| GET | /api/health | No | None |
| POST | /api/auth/register | No | Public registration; creates Employee |
| POST | /api/auth/login | No | Credential verification + rate limit |
| POST | /api/auth/logout | Yes | Current session |
| GET | /api/auth/me | Yes | Current session |
| GET | /api/documents | Yes | Owner or active share |
| POST | /api/documents | Yes | Authenticated user; upload validation |
| GET | /api/documents/:id | Yes | Owner or active share |
| GET | /api/documents/:id/download | Yes | Owner or active DOWNLOAD share |
| POST | /api/documents/:id/share | Yes | Document owner only |
| POST | /api/documents/:id/revoke/:shareId | Yes | Document owner only |
| DELETE | /api/documents/:id | Yes | Document owner only |

Errors use JSON `{ "error": "message" }`. Sensitive errors intentionally avoid revealing whether unrelated private resources exist.
