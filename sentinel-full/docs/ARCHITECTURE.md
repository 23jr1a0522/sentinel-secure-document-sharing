# Architecture

Browser (React/Vite) -> Express API -> authentication/session -> authorization service -> Prisma/PostgreSQL.

Document bytes are stored privately outside the frontend public directory. The API reads a document only after server-side authorization. Audit records are written for sensitive actions and denied attempts.

Trust boundary: the browser is untrusted. IDs, roles, ownership values and permission values received from the client are treated as untrusted input.
