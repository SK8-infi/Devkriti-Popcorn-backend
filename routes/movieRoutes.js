import express from 'express';
import { getLatestMovies, getMovieById } from '../controllers/movieController.js';

const router = express.Router();

router.get('/latest', getLatestMovies);
router.get('/:id', getMovieById);

export default router; 