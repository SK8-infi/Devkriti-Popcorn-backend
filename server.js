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
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import { startMovieFetcher, fetchAndCacheLatestMovies } from './controllers/movieController.js';
import { startCronJobs } from './utils/cronJobs.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Allow all origins for CORS
app.use(cors());

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

app.listen(port, ()=> console.log(`Server listening at http://localhost:${port}`)); 