import express from 'express';
import { getLatestMovies, getMovieById, getAllMovies, refreshMovieCache, fetchMovieById } from '../controllers/movieController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllMovies);
router.get('/latest', getLatestMovies);
router.post('/refresh-cache', refreshMovieCache);
router.post('/fetch-by-id', authenticateToken, fetchMovieById);
router.get('/:id', getMovieById);

export default router; 