import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ success: false, message: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

// Check if user is admin
export const protectAdmin = async (req, res, next) => {
    try {
        await authenticateToken(req, res, () => {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }
            next();
        });
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

// Generate JWT token
export const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};