# Sentinel Threat Model

## Assets
User accounts, sessions, confidential documents, document metadata, shares, audit logs, database credentials and session secrets.

## Threats and controls

1. **IDOR** — attacker changes document ID. Control: every resource operation queries the document and checks ownership/share. Test: employee 1 requests employee 2 document and expects 403.
2. **Revoked share** — revoked recipient downloads again. Control: permission is checked on every request. Test expects 403 after revocation.
3. **Privilege escalation** — user submits an Admin role. Control: role changes are admin-only and server-controlled. Test rejects employee role mutation.
4. **Unauthorized listing** — user enumerates documents. Control: listing query is scoped to owner or active share. Test verifies private document is absent.
5. **Storage-key guessing** — user guesses a file path. Control: storage is not public; download goes through API authorization.
6. **Expired/invalid session** — stale cookie is reused. Control: session expiry and server lookup. Test rejects expired session.
7. **Malicious upload** — executable/disallowed content. Control: size, extension and detected MIME checks; generated storage names.
8. **Sharing escalation** — recipient grants access. Control: only owner can create/revoke shares.
9. **Signed URL misuse** — production storage URLs. Control: issue only after authorization and use short TTL; current local implementation streams through API.
10. **Login/download abuse** — rate limiting on authentication and sensitive endpoints.
11. **File/metadata inconsistency** — database transaction and cleanup on storage failure.
12. **Audit exposure/tampering** — audit logs omit secrets/file contents and are server-written.

Residual risk: malware scanning, enterprise SSO, object-storage lifecycle policies and immutable audit storage require additional production infrastructure.
