import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
    getCancellationPolicy, 
    cancelBooking, 
    getCancellationHistory,
    getAllCancellations 
} from '../controllers/cancellationController.js';

const router = express.Router();

// User routes (requires authentication)
router.get('/policy/:bookingId', authenticateToken, getCancellationPolicy);
router.post('/cancel/:bookingId', authenticateToken, cancelBooking);
router.get('/history', authenticateToken, getCancellationHistory);

// Admin routes (requires admin privileges)
router.get('/admin/all', authenticateToken, getAllCancellations);

export default router;