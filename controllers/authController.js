import passport from 'passport';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

// Google OAuth Strategy
export const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

// Google OAuth Callback
export const googleAuthCallback = passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`,
    session: false
});

// Handle successful authentication
export const handleGoogleAuthSuccess = async (req, res) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
        }

        const token = generateToken(user._id);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Google auth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
};

// Get current user
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-__v');
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
};

// Logout (client-side token removal)
export const logout = (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
};

// Test endpoint (no auth required)
export const testEndpoint = (req, res) => {
    res.json({ success: true, message: 'Server is working' });
};

// Check if user is admin
export const checkAdminStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ 
            success: true, 
            isAdmin: user.role === 'admin' 
        });
    } catch (error) {
        console.error('Check admin status error:', error);
        res.status(500).json({ success: false, message: 'Error checking admin status' });
    }
}; 