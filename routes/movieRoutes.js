import express from 'express';
import { getLatestMovies, getMovieById, getAllMovies } from '../controllers/movieController.js';

const router = express.Router();

router.get('/', getAllMovies);
router.get('/latest', getLatestMovies);
router.get('/:id', getMovieById);

export default router; 