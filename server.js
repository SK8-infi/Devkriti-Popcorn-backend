import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import passport from 'passport';
import './configs/passport.js';

import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import movieRouter from './routes/movieRoutes.js';
import authRouter from './routes/authRoutes.js';
import cronRouter from './routes/cronRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import ticketRouter from './routes/ticketRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import { startMovieFetcher, fetchAndCacheLatestMovies } from './controllers/movieController.js';
import { startCronJobs } from './utils/cronJobs.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration - Allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Global CORS headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve images with CORS headers
app.use('/api/images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'images')));

const port = 3000;

await connectDB();

// Start TMDB movie fetcher
startMovieFetcher();

// Fetch and cache latest movies on server startup
fetchAndCacheLatestMovies();

// Start custom cron jobs (replaces Inngest scheduled functions)
startCronJobs();
console.log('✅ Cron jobs started: Show reminders (8h), Booking cleanup (5m), Ticket cleanup (24h)');

// Stripe Webhooks Route
app.use('/api/stripe', express.raw({type: 'application/json'}), stripeWebhooks);

// Middleware
app.use(express.json());
app.use(passport.initialize());

// API Routes
app.get('/', (req, res)=> res.send('Server is Live!'));

app.use('/api/auth', authRouter);
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/movies', movieRouter);
app.use('/api/cron', cronRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/tickets', ticketRouter);

app.listen(port, ()=> {}); 