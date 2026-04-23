# Event Management Backend

A Node.js/Express backend API for the Event Management mobile app.

## Features

- User registration and authentication
- JWT token-based authentication
- SQLite database for data persistence
- Password hashing with bcrypt
- CORS enabled for mobile app communication

## API Endpoints

### Authentication

#### POST /api/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "collegeName": "KDK College",
  "email": "john@example.com",
  "password": "password123",
  "department": "Computer Science",
  "year": "3rd Year",
  "session": "2025-26",
  "membershipPlan": "KDK CSE 1-Year Membership",
  "membershipExpiry": "2026-04-20T00:00:00.000Z",
  "membershipStatus": "Active"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": { ...user_data }
}
```

#### POST /api/login
Login an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": { ...user_data }
}
```

#### GET /api/profile
Get user profile (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token_here
```

#### GET /api/check-email/:email
Check if an email is already registered.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Database

The application uses SQLite database (`event_management.db`) which is created automatically when the server starts.

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- CORS is configured for mobile app access

## Environment Variables

- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret key for JWT tokens (change in production)