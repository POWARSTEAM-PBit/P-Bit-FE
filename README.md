## Execute React Frontend

Firstly, ensure that npm is installed visit: 
https://nodejs.org

### Environment Setup

Create a `.env` file in the root directory with your API configuration:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Installation

Then to install the dependencies run this command:

```bash
npm install
```

### Development

Then to run the frontend application, run the following command:

```bash
npm run dev
```

### Production

To run the application in production mode, execute the command below:

```bash
npm run build
```

## 🔐 Authentication

This application uses OAuth2 form-based authentication with the P-Bit backend:

- **Login**: Uses form data (`application/x-www-form-urlencoded`) for secure OAuth2 authentication
- **Registration**: JSON payload for user registration
- **Token-based**: Bearer token authentication for protected routes
- **Profile**: Separate endpoint to fetch user profile after login

### Backend Requirements

Ensure your backend has CORS configured to allow requests from `http://localhost:5175` (or your frontend URL).

