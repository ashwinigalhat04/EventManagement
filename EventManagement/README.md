# Event Management App

A complete event management mobile application built with React Native (Expo) and Node.js backend.

## Features

- User registration and authentication with persistent storage
- Event listing with filtering and pricing
- Membership system for KDK CSE students (free events)
- Profile management with photo upload
- Receipt download functionality
- Professional UI with lavender/beige color scheme

## Project Structure

```
EventManagement/
├── Backend/           # Node.js/Express API server
│   ├── server.js      # Main server file
│   ├── package.json   # Backend dependencies
│   └── README.md      # Backend documentation
├── Campluse/          # React Native (Expo) frontend
│   └── Frontend/
│       ├── app/       # App screens and components
│       ├── auth.ts    # Authentication utilities
│       └── package.json
└── start.bat          # Script to start both servers
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your phone (for testing)

### 1. Backend Setup

```bash
cd Backend
npm install
npm start
```

The backend server will run on `http://localhost:3000`

### 2. Frontend Setup

```bash
cd Campluse/Frontend
npm install
npx expo start
```

### 3. Alternative: Start Both Servers

On Windows, you can use the provided script:

```bash
start.bat
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile (authenticated)
- `GET /api/check-email/:email` - Check if email exists

## Database

The backend uses SQLite database (`event_management.db`) which is created automatically.

## Features Overview

### User Registration
- Collects user details: name, college, email, password, department, year
- Automatic membership assignment for KDK CSE students
- Email uniqueness validation

### Login System
- Email/password authentication
- JWT token-based sessions
- Persistent login state

### Events
- Event listing with categories
- Free access for KDK CSE members
- Paid access for others

### Profile Management
- View user information
- Upload profile photo
- Download membership receipt
- View certificates and event history
- Logout functionality

## Technologies Used

### Frontend
- React Native
- Expo SDK
- TypeScript
- Expo Router (file-based routing)
- Expo Image Picker
- AsyncStorage for local persistence

### Backend
- Node.js
- Express.js
- SQLite3 database
- bcryptjs for password hashing
- jsonwebtoken for authentication
- CORS for cross-origin requests

## Development

### Running in Development Mode

Backend:
```bash
cd Backend
npm run dev  # Uses nodemon for auto-restart
```

Frontend:
```bash
cd Campluse/Frontend
npx expo start --clear
```

### Building for Production

The app is configured for Expo's build service. Use Expo Application Services (EAS) for production builds.

## Troubleshooting

### Backend Connection Issues
- Ensure backend server is running on port 3000
- Check firewall settings
- Verify API_BASE_URL in auth.ts matches your backend URL

### Expo Issues
- Clear Expo cache: `npx expo start --clear`
- Reset Metro bundler cache
- Check Expo CLI version compatibility

### Database Issues
- Delete `event_management.db` file to reset database
- Server will recreate tables automatically

## License

This project is for educational purposes.