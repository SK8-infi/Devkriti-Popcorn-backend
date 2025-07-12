import express from 'express';
import { getLatestMovies } from '../controllers/movieController.js';

const router = express.Router();

router.get('/latest', getLatestMovies);

export default router; 