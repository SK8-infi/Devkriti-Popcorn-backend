# Local Development Setup Guide

This guide will help you set up the Devkriti Popcorn backend and frontend for local development.

## Backend Setup

### 1. Environment Variables

Create a `.env` file in the `Devkriti-Popcorn-backend` directory with the following variables:

```env
# Database
MONGO_URI=mongodb://localhost:27017/popcorn-theatre

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# TMDB API
TMDB_API_KEY=your-tmdb-api-key

# URLs (for local development)
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set up OAuth consent screen if prompted
6. Choose "Web application" as the application type
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for local development)
   - `https://your-backend-url.vercel.app/api/auth/google/callback` (for production)
8. Copy the Client ID and Client Secret to your `.env` file

### 3. Gmail App Password Setup

1. Go to your Google Account settings
2. Navigate to "Security" → "2-Step Verification" (enable if not already)
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Use this password in your `EMAIL_APP_PASSWORD` environment variable

### 4. Install Dependencies

```bash
cd Devkriti-Popcorn-backend
npm install
```

### 5. Start the Backend Server

```bash
npm start
```

The backend will run on `http://localhost:3000`

## Frontend Setup

### 1. Environment Variables

Create a `.env` file in the `Devkriti-Popcorn-frontend` directory:

```env
VITE_API_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
cd Devkriti-Popcorn-frontend
npm install
```

### 3. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Database Setup

### MongoDB Local Setup

1. Install MongoDB Community Edition
2. Start MongoDB service
3. Create a database named `popcorn-theatre`

### MongoDB Atlas (Alternative)

1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Replace `MONGO_URI` in your `.env` file with the Atlas connection string

## Testing the Setup

1. Start both backend and frontend servers
2. Open `http://localhost:5173` in your browser
3. Click "Login" and test Google OAuth
4. Verify that you can access protected routes and admin features

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend CORS configuration includes your frontend URL
2. **OAuth Redirect Issues**: Verify that your redirect URIs are correctly configured in Google Cloud Console
3. **Email Not Sending**: Check that your Gmail app password is correct and 2FA is enabled
4. **Database Connection**: Ensure MongoDB is running and the connection string is correct

### Environment Variables Checklist

Make sure you have all these environment variables set:

Backend (`.env`):
- ✅ `MONGO_URI`
- ✅ `JWT_SECRET`
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `EMAIL_USER`
- ✅ `EMAIL_APP_PASSWORD`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `TMDB_API_KEY`
- ✅ `BACKEND_URL`
- ✅ `FRONTEND_URL`

Frontend (`.env`):
- ✅ `VITE_API_URL`

## Production Deployment

For production deployment on Vercel:

1. Set all the same environment variables in your Vercel project settings
2. Update the `BACKEND_URL` and `FRONTEND_URL` to your production URLs
3. Update the Google OAuth redirect URIs to include your production backend URL

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/auth/admin/check` - Check admin status (protected)
- `POST /api/auth/logout` - Logout (protected)

### Movies
- `GET /api/movies/all` - Get all movies
- `GET /api/movies/:id` - Get movie by ID

### Bookings
- `POST /api/bookings/create` - Create booking (protected)
- `GET /api/bookings/user` - Get user bookings (protected)

### Admin
- `GET /api/admin/my-theatre` - Get admin's theatre (protected)
- `POST /api/admin/my-theatre/room/add` - Add room (protected)
- `POST /api/admin/my-theatre/room/update` - Update room (protected)

### User
- `POST /api/user/update-city` - Update user city (protected)
- `POST /api/user/favorites/update` - Update favorites (protected)
- `GET /api/user/favorites` - Get user favorites (protected) 