import express from 'express';
import { getLatestMovies, getMovieById, getAllMovies, populateMoviesFromCache, debugMovies } from '../controllers/movieController.js';

const router = express.Router();

router.get('/', getAllMovies);
router.get('/all', getAllMovies);
router.get('/debug', debugMovies);
router.get('/latest', getLatestMovies);
router.post('/populate-from-cache', populateMoviesFromCache);
router.get('/:id', getMovieById);

export default router; 