import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
    googleAuth, 
    googleAuthCallback, 
    handleGoogleAuthSuccess, 
    getCurrentUser, 
    logout, 
    checkAdminStatus,
    testEndpoint
} from '../controllers/authController.js';

const authRouter = express.Router();

// Test endpoint (no auth required)
authRouter.get('/test', testEndpoint);

// Google OAuth routes
authRouter.get('/google', googleAuth);
authRouter.get('/google/callback', googleAuthCallback, handleGoogleAuthSuccess);

// Protected routes
authRouter.get('/me', authenticateToken, getCurrentUser);
authRouter.get('/admin/check', authenticateToken, checkAdminStatus);

// Logout (client-side token removal)
authRouter.post('/logout', logout);

export default authRouter; 