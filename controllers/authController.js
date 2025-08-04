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

// Debug endpoint to check auth status
export const debugAuthStatus = (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    res.json({ 
        success: true, 
        hasAuthHeader: !!authHeader,
        hasToken: !!token,
        authHeader: authHeader ? 'present' : 'missing',
        tokenLength: token ? token.length : 0
    });
};

// Check if user is admin or owner
export const checkAdminStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ 
            success: true, 
            isAdmin: user.role === 'admin',
            isOwner: user.role === 'owner'
        });
    } catch (error) {
        console.error('Check admin status error:', error);
        res.status(500).json({ success: false, message: 'Error checking admin status' });
    }
};

// Debug endpoint to check user data
export const debugUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ 
            success: true, 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                googleId: user.googleId,
                role: user.role,
                city: user.city, // Personal city preference
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Debug user data error:', error);
        res.status(500).json({ success: false, message: 'Error fetching user data' });
    }
}; 

// Debug endpoint to check Google OAuth configuration
export const debugGoogleOAuthConfig = (req, res) => {
    const config = {
        hasClientID: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        backendURL: process.env.BACKEND_URL || 'http://localhost:3000',
        frontendURL: process.env.FRONTEND_URL || 'http://localhost:5173',
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    };
    
    res.json({ 
        success: true, 
        message: 'Google OAuth Configuration Debug',
        config
    });
}; 