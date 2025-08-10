import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createMovieReview,
  getMovieReviews,
  getUserMovieReviews,
  updateMovieReview,
  deleteMovieReview,
  getMovieReviewAnalytics
} from '../controllers/movieReviewController.js';

const router = express.Router();

// Public routes
router.get('/movie/:movieId', getMovieReviews);
router.get('/movie/:movieId/analytics', getMovieReviewAnalytics);

// Protected routes (require authentication)
router.post('/', authenticateToken, createMovieReview);
router.put('/:reviewId', authenticateToken, updateMovieReview);
router.delete('/:reviewId', authenticateToken, deleteMovieReview);

router.get('/user', authenticateToken, getUserMovieReviews);

export default router;
