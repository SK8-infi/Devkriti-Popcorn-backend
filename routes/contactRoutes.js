import express from 'express';
import { sendContactEmail } from '../controllers/contactController.js';

const router = express.Router();

// POST /api/contact - Send contact form email
router.post('/contact', sendContactEmail);

export default router;
