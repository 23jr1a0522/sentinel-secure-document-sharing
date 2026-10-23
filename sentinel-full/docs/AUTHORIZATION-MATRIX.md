# Authorization Matrix

Role permissions are combined with document relationship checks.

| Action | Admin | Manager | Employee |
|---|---|---|---|
| Login/logout | Yes | Yes | Yes |
| View own profile | Yes | Yes | Yes |
| Manage users/roles | Yes | No | No |
| Upload | Yes | Yes | Yes |
| View own documents | Yes, if owner | Yes, if owner | Yes, if owner |
| Download own documents | Yes, if owner | Yes, if owner | Yes, if owner |
| View explicitly shared document | Yes, if explicitly shared by policy | Yes, if shared | Yes, if shared |
| Share a document | Owner only | Owner only | Owner only |
| Revoke a share | Owner only | Owner only | Owner only |
| Delete document | Owner only | Owner only | Owner only |
| Read audit log | Yes | Own/department policy | Own relevant events |
| Change ownership | No | No | No |
| Self-promote role | No | No | No |

Admin does not automatically receive document content access merely because of the Admin role.
