# Sentinel – Secure Document Sharing

Sentinel is a web application that allows users to upload, manage, download, and securely share documents. It provides user authentication, document management, and access controls through a simple and professional interface.

## Live Application

- **Frontend:** https://sentinel-frontend-s3wx.onrender.com
- **Backend API:** https://sentinel-backend-g1wa.onrender.com
- **Health Check:** https://sentinel-backend-g1wa.onrender.com/api/health

## Features

- **User Authentication:** Log in and access protected application features.
- **Dashboard:** View document information and access application sections.
- **Document Management:** Upload, view, and download documents.
- **Document Sharing:** Share documents with other users.
- **Access Permissions:** Manage sharing permissions for documents.
- **Shared Access Management:** View shared documents and revoke access when needed.
- **Profile Management:** View user profile information.
- **Password Management:** Change the account password.
- **Security:** Protected API routes, HTTP security headers, and request rate limiting.
- **Responsive Interface:** Clean layout with navigation and readable text.

## Technologies Used

### Frontend
- React
- TypeScript
- CSS
- Vite

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- Database configured for the project
- Cookie-based authentication
- Helmet
- CORS
- Express Rate Limit
- Multer for file uploads

### Deployment
- GitHub for source code management
- Render for frontend and backend hosting

## Project Structure

```text
sentinel-full/
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   └── style.css
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── app.ts
│   │   └── ...
│   ├── prisma/
│   ├── package.json
│   └── ...
└── README.md
```

The exact files and folders may vary depending on the current project version.

## Getting Started

### Prerequisites

Install the following software:

- Node.js and npm
- A supported database configured for the backend
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/23jr1a0522/sentinel-secure-document-sharing.git
cd sentinel-secure-document-sharing/sentinel-full
```

If the repository contains the project files directly, enter the folder containing `client`, `server`, and `README.md` instead.

### 2. Set Up the Backend

```bash
cd server
npm install
```

Configure the required environment variables and database connection using the project's existing environment configuration and setup instructions.

Apply database migrations if required by the project:

```bash
npx prisma migrate deploy
```

Start the backend using the available development script in `server/package.json`. For example:

```bash
npm run dev
```

### 3. Set Up the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

Make sure the frontend API configuration points to your local backend during local development, or to the deployed backend when using the live application.

### 4. Build the Frontend

From the `client` directory, run:

```bash
npm run build
```

A successful build confirms that the frontend compiles without build errors.

## API Information

The backend API is available at:

```text
https://sentinel-backend-g1wa.onrender.com/api
```

The application uses API routes for authentication, document operations, and sharing permissions.

Health-check endpoint:

```text
GET /api/health
```

Authentication and document routes require the appropriate authentication and permissions.

## Security Notes

- Do not upload `.env` files, passwords, session cookies, API keys, or other secrets to GitHub.
- Store production credentials in the hosting platform's environment variables.
- Keep authentication and authorization checks enabled on protected backend routes.
- Validate file uploads and verify document permissions on the server.
- Use HTTPS for deployed application traffic.
- Never share private documents or credentials in public issues or screenshots.

## Deployment

The application is deployed using Render:

- The **frontend service** hosts the React application.
- The **backend service** provides the Express API.
- The backend must have its required environment variables, database connection, and migration configuration.
- The frontend must use the correct deployed backend API URL.
- Cross-origin requests and authentication cookies must be configured correctly for the deployed frontend and backend.

## Future Improvements

- Add stronger automated security and permission tests.
- Improve error messages and session handling.
- Add document activity history.
- Improve document search and filtering.
- Add automated deployment checks.

## Author

**G. Pranavi Sri**

GitHub: https://github.com/23jr1a0522

## License

Add an appropriate license before distributing or reusing this project publicly.
