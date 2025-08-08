import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createReview,
  getTheatreReviews,
  markReviewHelpful,
  addTheatreResponse,
  getUserReviews,
  updateReview,
  deleteReview,
  getReviewAnalytics
} from '../controllers/reviewController.js';

const reviewRouter = express.Router();

// Public routes
reviewRouter.get('/theatre/:theatreId', getTheatreReviews);

// Protected routes
reviewRouter.post('/', authenticateToken, createReview);
reviewRouter.post('/:reviewId/helpful', authenticateToken, markReviewHelpful);
reviewRouter.post('/:reviewId/response', authenticateToken, addTheatreResponse);
reviewRouter.get('/user', authenticateToken, getUserReviews);
reviewRouter.put('/:reviewId', authenticateToken, updateReview);
reviewRouter.delete('/:reviewId', authenticateToken, deleteReview);
reviewRouter.get('/analytics', authenticateToken, getReviewAnalytics);

export default reviewRouter; 