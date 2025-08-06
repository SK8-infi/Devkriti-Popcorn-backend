# Devkriti Popcorn - Backend API

A comprehensive Node.js/Express.js backend API for a movie theatre booking system with integrated payment processing, user management, and automated email notifications.

## Features

### Core Functionality
- **Movie Management**: Integration with TMDB API for latest movies, trailers, and metadata
- **Theatre Management**: Multi-theatre support with room layouts and seat management
- **Show Scheduling**: Create and manage movie shows with time slots and pricing
- **Booking System**: Real-time seat booking with conflict detection
- **Payment Processing**: Stripe integration for secure payment processing
- **User Authentication**: Google OAuth 2.0 with JWT token management
- **Role-Based Access**: Admin, Owner, and User roles with specific permissions

### Advanced Features
- **Email Notifications**: Automated booking confirmations, show reminders, and new show notifications
- **Cron Jobs**: Scheduled tasks for show reminders and maintenance
- **Booking Timeouts**: Automatic seat release for unpaid bookings
- **Webhook Handling**: Stripe webhook processing for payment status updates
- **Image Caching**: Local storage of movie posters and backdrops
- **CORS Support**: Full cross-origin resource sharing configuration

## Tech Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with Google OAuth 2.0
- **Payment**: Stripe API
- **Email**: Nodemailer
- **Image Processing**: fs-extra for file operations
- **HTTP Client**: Axios for external API calls
- **Development**: Nodemon for hot reloading

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Google OAuth 2.0 credentials
- Stripe account and API keys
- TMDB API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Devkriti-Popcorn-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # TMDB API
   TMDB_API_KEY=your_tmdb_api_key
   TMDB_BEARER_TOKEN=your_tmdb_bearer_token
   
   # Email Configuration
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if running locally)
   mongod
   
   # Run initial setup scripts (if needed)
   node make-first-user-admin.js
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run server
   
   # Production mode
   npm start
   ```

## Project Structure

```
Devkriti-Popcorn-backend/
├── configs/                 # Configuration files
│   ├── db.js               # Database connection
│   ├── passport.js         # Passport authentication setup
│   └── nodeMailer.js       # Email configuration
├── controllers/            # Business logic
│   ├── adminController.js  # Admin operations
│   ├── authController.js   # Authentication logic
│   ├── bookingController.js # Booking management
│   ├── movieController.js  # Movie data handling
│   ├── showController.js   # Show management
│   ├── stripeWebhooks.js  # Stripe webhook processing
│   └── userController.js   # User operations
├── middleware/             # Custom middleware
│   ├── auth.js            # Authentication middleware
│   └── admin.js           # Admin access control
├── models/                # Database schemas
│   ├── Booking.js         # Booking model
│   ├── Movie.js           # Movie model
│   ├── Show.js            # Show model
│   ├── Theatre.js         # Theatre model
│   └── User.js            # User model
├── routes/                # API route definitions
│   ├── adminRoutes.js     # Admin endpoints
│   ├── authRoutes.js      # Authentication routes
│   ├── bookingRoutes.js   # Booking endpoints
│   ├── cronRoutes.js      # Cron job endpoints
│   ├── movieRoutes.js     # Movie endpoints
│   ├── showRoutes.js      # Show endpoints
│   └── userRoutes.js      # User endpoints
├── utils/                 # Utility functions
│   ├── bookingTimeout.js  # Booking timeout management
│   ├── cronJobs.js        # Scheduled tasks
│   └── emailService.js    # Email service functions
├── images/                # Cached movie images
├── server.js              # Main application entry point
└── package.json           # Dependencies and scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/logout` - User logout

### Movies
- `GET /api/movies/latest` - Get latest movies from TMDB
- `GET /api/movies/:id` - Get specific movie details
- `GET /api/movies/trailers/:id` - Get movie trailers

### Shows
- `POST /api/show/create` - Create new show (Admin)
- `GET /api/show/theatre/:theatreId` - Get shows by theatre
- `GET /api/show/movie/:movieId` - Get shows by movie
- `PUT /api/show/:id` - Update show details (Admin)
- `DELETE /api/show/:id` - Delete show (Admin)

### Bookings
- `POST /api/booking/create` - Create new booking
- `GET /api/booking/user/:userId` - Get user bookings
- `GET /api/booking/:id` - Get specific booking
- `PUT /api/booking/:id/status` - Update booking status

### Admin Operations
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/shows` - Get all shows for admin's theatre
- `POST /api/admin/set-theatre` - Set admin's theatre
- `GET /api/admin/bookings` - Get theatre bookings

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/owner-access` - Check owner access
- `GET /api/user/all` - Get all users (Owner only)

### Stripe Webhooks
- `POST /api/stripe/webhooks` - Stripe webhook processing

## Authentication & Authorization

### User Roles
- **User**: Basic booking and profile management
- **Admin**: Theatre management, show creation, booking oversight
- **Owner**: Full system access including user management

### JWT Token Management
- Tokens are automatically generated on Google OAuth login
- Middleware validates tokens for protected routes
- Role-based access control for admin/owner operations

## Payment Integration

### Stripe Configuration
- Supports INR currency with proper amount conversion
- Minimum amount validation (₹50 equivalent)
- Webhook processing for payment status updates
- Automatic booking timeout for unpaid reservations

### Payment Flow
1. User selects seats and initiates booking
2. Backend creates Stripe Checkout Session
3. User completes payment on Stripe
4. Webhook updates booking status
5. Email confirmation sent to user

## Email System

### Email Types
- **Booking Confirmations**: Sent immediately after successful payment
- **Show Reminders**: Automated reminders 8 hours before show time
- **New Show Notifications**: Notify users of new movie shows

### Configuration
- Uses Gmail SMTP with app passwords
- HTML email templates with booking details
- Error handling and retry mechanisms

## Cron Jobs

### Scheduled Tasks
- **Show Reminders**: Runs every 8 hours
- **Movie Data Updates**: Fetches latest movies from TMDB
- **Booking Cleanup**: Removes expired unpaid bookings

## Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- Database connection string
- OAuth credentials
- Stripe API keys
- Email configuration
- TMDB API credentials

### Production Considerations
- Use HTTPS in production
- Set proper CORS origins
- Configure proper logging
- Set up monitoring and error tracking
- Use environment-specific configurations

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **OAuth Errors**: Verify Google OAuth credentials and callback URLs
3. **Stripe Webhooks**: Use Stripe CLI for local testing
4. **Email Delivery**: Check Gmail app password configuration

### Debug Mode
For development, you can enable additional logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

## Scripts

### Available Commands
- `npm run server` - Start development server with nodemon
- `npm start` - Start production server
- `node make-first-user-admin.js` - Set up first admin user
- `node update-theatre-admins.js` - Update theatre admin references

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions:
- Check the existing documentation
- Review the codebase structure
- Contact the development team

---

**Note**: This backend is designed to work with the Devkriti Popcorn frontend application. Ensure both applications are properly configured and running for full functionality. 