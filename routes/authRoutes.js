import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
    googleAuth, 
    googleAuthCallback, 
    handleGoogleAuthSuccess, 
    getCurrentUser, 
    logout, 
    checkAdminStatus,
    testEndpoint,
    debugUserData,
    debugAuthStatus
} from '../controllers/authController.js';

const authRouter = express.Router();

// Test endpoint (no auth required)
authRouter.get('/test', testEndpoint);

// Debug endpoint (no auth required)
authRouter.get('/debug-auth', debugAuthStatus);

// Google OAuth routes
authRouter.get('/google', googleAuth);
authRouter.get('/google/callback', googleAuthCallback, handleGoogleAuthSuccess);

// Protected routes
authRouter.get('/me', authenticateToken, getCurrentUser);
authRouter.get('/admin/check', authenticateToken, checkAdminStatus);
authRouter.get('/debug', authenticateToken, debugUserData);

// Logout (client-side token removal)
authRouter.post('/logout', logout);

export default authRouter; 