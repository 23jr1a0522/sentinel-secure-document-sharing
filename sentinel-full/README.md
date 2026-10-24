# Sentinel – Secure Document Sharing

Sentinel is a secure document sharing web application that allows users to upload, manage, download, and share documents with controlled access permissions.

The project focuses on authentication, authorization, document security, sharing controls, audit logging, and AI-based document question answering.

---

## Live Application

- **Frontend:** https://sentinel-frontend-s3wx.onrender.com
- **Backend API:** https://sentinel-backend-g1wa.onrender.com
- **Health Check:** https://sentinel-backend-g1wa.onrender.com/api/health
- **GitHub Repository:** https://github.com/23jr1a0522/sentinel-secure-document-sharing

---

## Demo Login Credentials

These accounts are provided for demonstration and evaluation purposes.

| Name | Email | Password | Role |
|---|---|---|---|
| Pranavi | `pranavi@sentinel.local` | `Pranavi123` | **Admin** |
| Admin | `admin@sentinel.local` | `Admin123` | User |
| Pranu | `pranu@sentinel.local` | `Pranu123` | User |
| Harshi | `harshi@sentinel.local` | `Harshi123` | User |

### Important

These are **demo credentials only**.

Do not use these passwords for real accounts or production systems.

Production secrets such as database passwords, session secrets, and Gemini API keys must never be stored in this README or committed to GitHub.

---

# 1. Problem Statement

Sharing confidential documents through normal file-sharing methods can create security problems such as unauthorized access, incorrect permissions, exposed file links, and lack of access control.

Sentinel provides a controlled document-sharing system where:

- Users must authenticate before accessing protected features.
- Documents are protected by server-side authorization.
- Document owners control sharing permissions.
- Access can be revoked.
- Users cannot directly access private storage files.
- Sensitive operations are protected by security controls.
- An AI feature can answer questions based on authorized documents.

---

# 2. Objectives

The main objectives of Sentinel are:

- Provide secure user authentication.
- Protect documents from unauthorized access.
- Implement role-based access control.
- Provide controlled document sharing.
- Allow document owners to revoke access.
- Protect file storage from direct public access.
- Maintain audit information for important actions.
- Provide AI-based document question answering.
- Apply common web security protections.
- Deploy the application using a frontend, backend, and database architecture.

---

# 3. Main Features

## User Authentication

- Login using email and password.
- Passwords are securely hashed using Argon2.
- Protected application routes require authentication.
- Session-based authentication is used for protected requests.

## Dashboard

Users can access application sections based on their permissions.

The dashboard provides access to document management and other available features.

## Document Management

Users can:

- Upload documents.
- View available documents.
- Download authorized documents.
- Delete documents when permitted.
- View document information.

## Document Sharing

Document owners can share documents with other registered users.

Sharing is controlled through permissions.

## Permission Management

The application checks authorization before allowing protected document operations.

Access can be revoked when required.

## Profile Management

Users can:

- View profile information.
- Manage account-related information.
- Change their password.

## Security Controls

Sentinel uses several security controls, including:

- Server-side authentication.
- Server-side authorization.
- Argon2 password hashing.
- HTTP security headers using Helmet.
- CORS configuration.
- Rate limiting.
- Input validation using Zod.
- Controlled file uploads using Multer.
- Non-public document storage.
- Protected document download routes.
- Session validation.
- Audit logging.

## AI Document Question Answering

Sentinel provides an AI feature that allows an authorized user to ask questions about an uploaded document.

The AI feature uses Google Gemini.

Supported document formats include:

- PDF
- DOCX
- TXT

The backend first checks whether the user has permission to access the selected document before reading the document and sending its content for AI processing.

---

# 4. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- CSS

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Argon2
- Cookie-based authentication
- Multer
- Zod
- Helmet
- CORS
- Express Rate Limit
- Google Gemini API

## Deployment

- GitHub
- Render
- PostgreSQL database

---

# 5. System Architecture

```text
                    ┌──────────────────────┐
                    │       User           │
                    │     Web Browser      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      React App       │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │ HTTPS
                               ▼
                    ┌──────────────────────┐
                    │   Express Backend    │
                    │    REST API          │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └──────────────┐
                 ▼                                 ▼
        ┌──────────────────┐             ┌──────────────────┐
        │    PostgreSQL    │             │   File Storage   │
        │    Database      │             │    Documents     │
        └──────────────────┘             └──────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │   Google Gemini  │
                   │    AI Service    │
                   └──────────────────┘
```

---

# 6. Security Model

Sentinel follows a server-side authorization model.

The frontend does not decide whether a user is allowed to access a document.

The backend verifies permissions for protected operations.

### Example

When a user requests a document:

```text
User
  ↓
Authentication check
  ↓
Document lookup
  ↓
Ownership / sharing permission check
  ↓
Authorization decision
  ↓
Document returned only if authorized
```

This helps protect against attacks such as IDOR, where an attacker attempts to change a document ID and access another user's document.

---

# 7. Role-Based Access Control

Sentinel supports different user roles.

### Admin

The Admin account can perform administrative actions such as managing permissions and controlling document access.

For the demonstration environment:

**Pranavi is the Admin account.**

### Regular Users

Regular users can use the document functionality available to their account but cannot perform restricted administrative actions.

Authorization is enforced on the backend rather than relying only on frontend controls.

---

# 8. Document Access Security

Documents are not intended to be publicly accessible through direct file URLs.

Document operations go through the backend API.

Before a protected document operation is performed, the backend verifies:

1. The user is authenticated.
2. The requested document exists.
3. The user owns the document or has an active permission.
4. The requested operation is allowed.

This prevents users from simply changing a document ID and accessing another user's document.

---

# 9. Sharing and Revocation

The document owner can grant access to another user.

Example:

```text
Owner
  ↓
Select Document
  ↓
Select User
  ↓
Grant Permission
  ↓
Recipient can access document
```

When access is revoked:

```text
Owner
  ↓
Revoke Permission
  ↓
Permission becomes inactive
  ↓
Recipient is denied future access
```

The permission is checked again when the recipient attempts to access the document.

---

# 10. AI Document Question Answering

The AI feature is available through the backend API.

The general flow is:

```text
User selects document
        ↓
User enters question
        ↓
Backend authenticates user
        ↓
Backend checks document permission
        ↓
Backend reads authorized document
        ↓
Document text is extracted
        ↓
Content is sent to Gemini
        ↓
AI generates an answer
        ↓
Answer returned to user
```

The AI endpoint does not allow a user to bypass document authorization.

The backend performs the authorization check before processing the document.

### Supported Formats

- `.pdf`
- `.docx`
- `.txt`

### AI Limitations

AI-generated answers may contain:

- Incorrect information
- Incomplete answers
- Misinterpretation of document content

Therefore, AI answers should be treated as assistance and not as a replacement for verifying important information directly from the document.

---

# 11. Security Threats

The project considers common threats such as:

- IDOR
- Unauthorized document access
- Revoked permission reuse
- Privilege escalation
- Unauthorized document listing
- Storage-key guessing
- Invalid or expired sessions
- Malicious file uploads
- Sharing privilege escalation
- Download authorization bypass
- Brute-force/login abuse
- Path traversal
- Sensitive credential exposure
- AI authorization bypass
- AI prompt injection
- Sensitive information leakage through AI processing
- AI API abuse

Detailed threat analysis is available in:

```text
THREATS.md
```

---

# 12. Environment Variables

The following values should be configured through environment variables.

Example:

```env
DATABASE_URL=your_database_connection_string
SESSION_SECRET=your_session_secret
GEMINI_API_KEY=your_gemini_api_key
```

Other environment variables may be required depending on the current project configuration.

### Never commit:

```text
.env
```

or any file containing:

- Database passwords
- API keys
- Session secrets
- Private credentials
- Authentication tokens

An example environment file can be provided as:

```text
.env.example
```

---

# 13. Project Structure

```text
sentinel-secure-document-sharing/
│
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   └── style.css
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── ai.ts
│   │   └── ...
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── package.json
│   └── ...
│
├── README.md
├── THREATS.md
├── PROMPTS.md
├── API.md
├── TESTING.md
├── DEPLOYMENT.md
├── .env.example
└── .gitignore
```

The exact files may change as the project is updated.

---

# 14. Local Setup

## Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Git
- Visual Studio Code or another code editor

---

## Step 1 – Clone the Repository

```bash
git clone https://github.com/23jr1a0522/sentinel-secure-document-sharing.git
```

Enter the project directory:

```bash
cd sentinel-secure-document-sharing
```

If the repository contains an additional project folder, enter the folder containing `client` and `server`.

---

# 15. Backend Setup

Open a terminal:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file and configure the required environment variables.

Example:

```env
DATABASE_URL=your_database_connection_string
SESSION_SECRET=your_session_secret
GEMINI_API_KEY=your_gemini_api_key
```

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

Run the seed:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

The backend should start on the configured local port.

---

# 16. Frontend Setup

Open another terminal:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Vite will display the local frontend URL.

Open that URL in a browser.

---

# 17. Frontend Build

To create a production frontend build:

```bash
npm run build
```

A successful build confirms that the frontend compiles correctly.

---

# 18. API

The deployed backend API is:

```text
https://sentinel-backend-g1wa.onrender.com/api
```

## Health Check

```http
GET /api/health
```

The health endpoint is used to verify that the backend service is running.

Other API routes handle:

- Authentication
- Sessions
- Users
- Documents
- Downloads
- Sharing
- Permissions
- AI document questions
- Password management
- Audit-related operations

Detailed API information can be documented in:

```text
API.md
```

---

# 19. Deployment

Sentinel is deployed using Render.

## Frontend

The React/Vite frontend is deployed as:

```text
https://sentinel-frontend-s3wx.onrender.com
```

## Backend

The Express/TypeScript backend is deployed as:

```text
https://sentinel-backend-g1wa.onrender.com
```

## Database

The backend uses PostgreSQL through Prisma ORM.

The production database connection is supplied through the `DATABASE_URL` environment variable.

## Deployment Process

The backend deployment includes:

```text
Install dependencies
        ↓
Prisma migration
        ↓
Database seed
        ↓
TypeScript build
        ↓
Start Express server
```

---

# 20. Important Deployment Limitation – Document Storage

The current deployed version stores uploaded document files on the server filesystem.

On hosting platforms such as Render, the filesystem can be temporary/ephemeral.

This means that:

- A document uploaded during one running deployment may be available during that session.
- After a restart, redeployment, or instance replacement, the physical uploaded file may no longer exist.
- The database may still contain the document metadata even when the physical file is unavailable.
- Therefore, an older uploaded document may fail to open after the deployment environment changes.

This is a **storage/deployment limitation**, not an intended authorization mechanism.

For the final live demonstration, upload a fresh demo document during the current session before testing document viewing or AI question answering.

### Production Improvement

For a production deployment, document files should be stored in durable private object storage such as:

- Amazon S3
- Cloudflare R2
- Google Cloud Storage
- Azure Blob Storage
- Another S3-compatible private storage service

The backend should continue performing authorization before generating or returning access to a stored document.

---

# 21. Testing

Important security and functionality scenarios include:

### Authentication

- Valid login
- Invalid login
- Protected route without authentication
- Session expiration

### Documents

- Upload document
- View document
- Download document
- Delete document
- Access another user's document

### Sharing

- Grant document access
- Recipient accesses shared document
- Revoke access
- Recipient attempts access after revocation

### Authorization

- Employee attempts admin operation
- User attempts to change another user's permissions
- User changes document ID to another user's document ID

### AI

- Ask question about an authorized document
- Ask question about an unauthorized document
- Test supported document formats
- Test unavailable/missing document
- Test invalid AI request

Detailed testing information can be maintained in:

```text
TESTING.md
```

---

# 22. Security Documentation

The repository contains separate documentation for the security design.

### Threat Model

```text
THREATS.md
```

Contains:

- Assets
- Threats
- Security controls
- AI-specific threats
- Residual risks
- Testing approach

### AI Usage

```text
PROMPTS.md
```

Contains:

- AI assistance used during development
- AI development prompts
- AI security considerations
- AI verification process
- AI limitations

### Deployment

```text
DEPLOYMENT.md
```

Contains deployment configuration and deployment-related information.

---

# 23. Recommended Demo Flow

For an evaluator demonstration, the following order is recommended.

### 1. Open the Live Application

Open:

```text
https://sentinel-frontend-s3wx.onrender.com
```

### 2. Login as Admin

Use:

```text
Email: pranavi@sentinel.local
Password: Pranavi123
```

Show that the account has Admin access.

### 3. Upload a Fresh Document

Upload a safe demo PDF or TXT document.

### 4. Show Document Management

Demonstrate:

- Document listing
- Document information
- View
- Download
- Delete

### 5. Demonstrate Sharing

Grant access to another demo user.

### 6. Login as Recipient

Use one of the regular demo accounts.

Show that the recipient can access the document according to the granted permission.

### 7. Revoke Access

Return to the owner/Admin account and revoke access.

Then demonstrate that the recipient can no longer access the document.

### 8. Demonstrate AI

Upload a fresh document and ask a question related to its content.

Example:

```text
What is the main purpose of this document?
```

### 9. Demonstrate Security

Show that an unauthorized user cannot access a document simply by changing its document ID.

---

# 24. Security Best Practices

The following practices should be followed when using or deploying Sentinel:

- Never commit `.env` files.
- Never expose database credentials.
- Never expose Gemini API keys.
- Use HTTPS in production.
- Use strong session secrets.
- Keep dependencies updated.
- Keep server-side authorization enabled.
- Validate uploaded files.
- Do not expose private storage directly.
- Review audit logs for sensitive operations.
- Use durable private object storage for production documents.

---

# 25. Current Limitations

The current version has some limitations:

1. Uploaded files on the deployed filesystem may not survive a restart or redeployment.
2. AI responses can occasionally be incorrect or incomplete.
3. Automated security testing can be expanded further.
4. Malware scanning is not currently included.
5. Enterprise SSO is not currently included.
6. Production-grade immutable audit storage is not included.
7. Durable object storage should be added for production document persistence.

These limitations are documented instead of being presented as completed production features.

---

# 26. Future Improvements

Possible future improvements include:

- Add private object storage.
- Add malware and antivirus scanning.
- Add stronger automated security tests.
- Add automated CI/CD security checks.
- Add document activity history.
- Add improved document search and filtering.
- Add enterprise SSO.
- Add multi-factor authentication.
- Improve AI response validation.
- Add AI usage monitoring and limits.
- Add production-grade audit storage.
- Add automated backup and recovery.

---

# 27. Documentation Files

The project documentation can include:

```text
README.md
THREATS.md
PROMPTS.md
API.md
TESTING.md
DEPLOYMENT.md
.env.example
```

These files explain the project, security model, AI usage, API, testing, and deployment process.

---

# 28. Project Highlights

Sentinel demonstrates practical implementation of:

- Full-stack web development
- React and TypeScript
- Node.js and Express
- PostgreSQL
- Prisma ORM
- Authentication
- Authorization
- Role-based access control
- Secure document sharing
- File upload handling
- Session management
- API security
- Rate limiting
- Security headers
- Input validation
- Audit logging
- AI integration
- Cloud deployment
- Threat modeling

---

# 29. Author

**G. Pranavi Sri**

GitHub:

https://github.com/23jr1a0522

---

# 30. License

This project can be distributed under an appropriate open-source license if required.

If no license has been added yet, the repository should not be presented as granting automatic permission for reuse.

---

## Final Note

Sentinel is a project demonstrating secure document sharing concepts, server-side authorization, permission management, and AI-assisted document processing.

The project should be evaluated based on the implemented security controls and the documented limitations. The current deployed storage limitation should be addressed with durable private object storage before using the system for real confidential documents.
