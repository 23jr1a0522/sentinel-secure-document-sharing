# Sentinel – Secure Document Sharing

Sentinel is a secure web application for uploading, managing, downloading, and sharing documents between authorized users.

The application provides authentication, document-level authorization, sharing permissions, access revocation, protected document operations, security controls, and an AI-powered document question-answering feature.

## Live Application

- **Frontend:** https://sentinel-frontend-s3wx.onrender.com
- **Backend API:** https://sentinel-backend-g1wa.onrender.com
- **Health Check:** https://sentinel-backend-g1wa.onrender.com/api/health
- **GitHub:** https://github.com/23jr1a0522/sentinel-secure-document-sharing

# 1. Problem Statement

Sharing confidential documents through normal file-sharing methods can make it difficult to control who can access a document, when access should be revoked, and whether users are authorized to perform document operations.

Sentinel addresses this problem by providing server-side authentication and authorization for document management and sharing.

The project also includes an AI feature that allows authorized users to ask questions about documents they are permitted to access.

# 2. Objectives

The main objectives of Sentinel are:

- Provide secure user authentication.
- Protect document operations using server-side authorization.
- Allow users to upload and manage documents.
- Allow document owners to share documents with other users.
- Allow owners to revoke shared access.
- Prevent unauthorized document access.
- Protect sensitive API endpoints with security controls.
- Provide AI-assisted question answering for authorized documents.
- Maintain a clear security and threat model.

# 3. Key Features

### Authentication

- User login
- Protected application routes
- Cookie-based session authentication
- Password management

### Document Management

- Upload documents
- View documents
- Download documents
- Delete documents
- Document metadata management

### Secure Sharing

- Share documents with other users
- Permission-based document access
- View shared documents
- Revoke shared access

### Security

- Server-side authentication
- Document-level authorization
- Protected API routes
- HTTP security headers using Helmet
- CORS configuration
- Request rate limiting
- Input validation
- Controlled document storage names
- Protected document downloads

### AI Document Q&A

Authorized users can ask questions about documents they are permitted to access.

The backend verifies document authorization before processing the document for AI question answering.

### User Interface

- Dashboard
- Documents section
- Shared access management
- Security information
- Profile management
- Responsive interface

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
- Cookie-based authentication
- Argon2 password hashing
- Helmet
- CORS
- Express Rate Limit
- Multer
- Zod

## AI

- Google Gemini API
- Document text extraction for supported document formats

## Deployment

- GitHub
- Render
- PostgreSQL

# 5. System Architecture

```text
                    USER
                     |
                     v
            +------------------+
            | React Frontend   |
            |      Render      |
            +--------+---------+
                     |
                     | HTTPS
                     v
            +------------------+
            | Express Backend  |
            |      Render      |
            +----+--------+----+
                 |        |
                 |        |
                 v        v
          +----------+  +-------------+
          |PostgreSQL|  |  Document   |
          |  Prisma  |  |   Storage   |
          +----------+  +-------------+
                 |
                 |
                 v
          +----------------+
          | Google Gemini  |
          |   AI Service   |
          +----------------+
```

### Request flow

```text
User
 ↓
Frontend
 ↓
Backend API
 ↓
Authentication
 ↓
Authorization
 ↓
Requested operation
 ↓
Database / Document Storage / AI
 ↓
Response
```

# 6. Security Model

Sentinel follows a server-side authorization model.

A user should not gain access to a document simply by changing a document ID or modifying a frontend request.

For protected document operations, the backend checks:

1. Whether the user is authenticated.
2. Whether the requested document exists.
3. Whether the user owns the document or has an active permission.
4. Whether the requested operation is allowed.
5. Whether the request should be rejected.

Examples of protected operations include:

- Viewing documents
- Downloading documents
- Sharing documents
- Revoking shares
- AI questions about documents

More detailed security analysis is available in:

`THREATS.md`

# 7. AI Document Question Answering

Sentinel includes an AI-powered document question-answering feature.

### Processing flow

```text
User selects document
        |
        v
User submits question
        |
        v
Authentication check
        |
        v
Document authorization check
        |
        v
Document text extraction
        |
        v
Gemini AI processing
        |
        v
Answer returned to user
```

The AI endpoint does not bypass document authorization.

A user must be authorized to access the document before its contents are processed for AI question answering.

### Supported document processing

The current backend implementation supports:

- PDF
- DOCX
- TXT

### AI limitations

AI-generated answers may not always be correct.

The AI feature should be treated as an assistance tool, and important information should be verified against the original document.

Additional AI security and reliability considerations are documented in:

`PROMPTS.md`

# 8. Project Structure

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
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── ...
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

The exact source files may change as the project evolves.

# 9. Local Setup

## Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Git
- Trae or Visual Studio Code or another code editor

## Clone the Repository

```bash
git clone https://github.com/23jr1a0522/sentinel-secure-document-sharing.git
cd sentinel-secure-document-sharing
```

Enter the directory containing the `client` and `server` folders if the repository structure has an additional project folder.

# 10. Backend Setup

Open a terminal:

```bash
cd server
npm install
```

Create a local `.env` file using `.env.example`.

Required configuration includes values such as:

```env
DATABASE_URL=
SESSION_SECRET=
GEMINI_API_KEY=
CLIENT_ORIGIN=
PORT=
```

Do not commit the actual `.env` file.

Run database migrations:

```bash
npx prisma migrate deploy
```

For local development, start the backend using:

```bash
npm run dev
```

The backend should start on the configured local port.

# 11. Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite.

The frontend must be configured to communicate with the correct backend API.

For production, the frontend uses the deployed Sentinel backend.

# 12. Frontend Build

From the `client` directory:

```bash
npm run build
```

A successful build confirms that the frontend compiles successfully.

# 13. API

The deployed API base URL is:

```text
https://sentinel-backend-g1wa.onrender.com/api
```

Health check:

```text
GET /api/health
```

The application also provides API routes for:

- Authentication
- User/session operations
- Document management
- Document sharing
- Permission management
- AI document questions

Detailed endpoint information is maintained separately in:

`API.md`

# 14. Environment Variables

The application uses environment variables for configuration and sensitive credentials.

Example:

```env
DATABASE_URL=
SESSION_SECRET=
GEMINI_API_KEY=
CLIENT_ORIGIN=
PORT=
```

### Security requirements

Never commit:

- `.env`
- Database passwords
- Gemini API keys
- Session secrets
- Authentication cookies
- Other private credentials

Production secrets should be configured through the deployment platform's environment-variable settings.

# 15. Deployment

Sentinel is deployed using Render.

### Frontend

The React frontend is deployed as the frontend service.

### Backend

The Express/TypeScript backend is deployed as the backend service.

### Database

The backend connects to PostgreSQL using Prisma.

### Deployment requirements

The backend deployment requires:

- PostgreSQL connection
- Session secret
- Gemini API key
- Frontend origin configuration
- Required database migrations

The frontend must use the correct deployed backend API URL.

Cross-origin requests and authentication cookies must also be configured correctly for the deployed environment.

Detailed deployment instructions are maintained in:

`DEPLOYMENT.md`

# 16. Important Deployment Limitation

The current implementation uses filesystem-based storage for uploaded documents.

In an ephemeral deployment environment, files stored on the application filesystem may become unavailable after a restart or redeployment even when their database metadata remains.

This can affect document download and AI document processing if the physical file is no longer present.

### Recommended production improvement

For a production deployment, document files should be moved to private persistent object storage such as:

- Amazon S3
- S3-compatible object storage
- Another managed private storage service

The database should store document metadata and storage identifiers rather than depending on an ephemeral application filesystem.

This limitation is intentionally documented rather than hidden.

# 17. Security Documentation

The project includes a dedicated threat model covering:

- IDOR
- Unauthorized document access
- Revoked-share access
- Privilege escalation
- Session abuse
- Malicious uploads
- Sharing escalation
- Path traversal
- Rate-limit abuse
- AI authorization
- Prompt injection
- AI information leakage
- AI hallucination
- Credential exposure
- Storage and deployment risks

See:

`THREATS.md`

# 18. Testing

The project should be tested for both functional and security behavior.

Important test cases include:

| Test | Expected Result |
|---|---|
| Valid login | User authenticated |
| Invalid password | Login rejected |
| User accesses own document | Access allowed |
| User accesses another user's document | Access denied |
| Share document | Recipient receives permitted access |
| Revoke share | Recipient loses access |
| Unauthorized download | Request rejected |
| Invalid document ID | Controlled error |
| Employee attempts admin operation | Request rejected |
| Authorized AI question | AI answer returned |
| Unauthorized AI document question | Request rejected |

Only tests that have actually been executed should be reported as passing.

Detailed test results can be maintained in:

`TESTING.md`

# 19. Demo Flow

A recommended project demonstration is:

### 1. Login

Show authenticated access to the application.

### 2. Dashboard

Show the user's document information.

### 3. Upload

Upload a safe demonstration document.

### 4. Document Management

Show the uploaded document and available operations.

### 5. Sharing

Share a document with another demo user.

### 6. Access Control

Show that the recipient can access the document according to the assigned permission.

### 7. Revoke Access

Revoke the permission and verify that access is denied afterward.

### 8. AI Question Answering

Select an authorized document and ask a question whose answer is clearly present in the document.

### 9. Security

Demonstrate one authorization/security test, such as attempting to access a document without permission.

# 20. Documentation

The project documentation includes:

| File | Purpose |
|---|---|
| `README.md` | Project overview, setup and usage |
| `THREATS.md` | Threat model and security controls |
| `PROMPTS.md` | AI usage and AI security considerations |
| `API.md` | API endpoint documentation |
| `TESTING.md` | Functional and security testing |
| `DEPLOYMENT.md` | Deployment instructions |
| `.env.example` | Environment variable template |

# 21. Current Limitations

The current project has the following known limitations:

- Deployed filesystem storage is not suitable for reliable long-term document persistence.
- Malware scanning is not currently implemented.
- Enterprise SSO is not implemented.
- Multi-factor authentication is not implemented.
- Immutable audit-log storage is not implemented.
- AI-generated responses may contain incorrect information.
- Large-document AI processing may require additional chunking or retrieval mechanisms.

# 22. Future Improvements

Potential future improvements include:

- Private persistent object storage
- Malware scanning for uploaded documents
- Multi-factor authentication
- Enterprise SSO
- Document versioning
- Advanced document search
- Immutable audit logs
- Stronger automated security testing
- AI retrieval/chunking for large documents
- AI response validation and citations
- Automated deployment and security checks
- Monitoring and alerting

# 23. Author

**G. Pranavi Sri**

GitHub:

https://github.com/23jr1a0522
# 24. License

Add an appropriate open-source license before publicly distributing or reusing this project.
