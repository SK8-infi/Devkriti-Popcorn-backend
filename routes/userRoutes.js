import express from "express";
import {
    getFavorites,
    getUserBookings,
    updateFavorite,
    getUserById,
    updateUserCity,
    promoteToAdmin,
    demoteFromAdmin,
    updateUserTheatre,
    checkAdAccess,
    updateUserCityPublic
} from "../controllers/userController.js";
import User from '../models/User.js';
import { authenticateToken, protectAdmin } from '../middleware/auth.js';

const userRouter = express.Router();

// Protected routes - require authentication
userRouter.get('/bookings', authenticateToken, getUserBookings);
userRouter.post('/update-favorite', authenticateToken, updateFavorite);
userRouter.get('/favorites', authenticateToken, getFavorites);
userRouter.post('/update-city', authenticateToken, updateUserCity);
userRouter.post('/update-theatre', authenticateToken, updateUserTheatre);
userRouter.get('/ad-access', authenticateToken, checkAdAccess);

// Admin routes - require admin authentication
userRouter.post('/promote-to-admin', protectAdmin, promoteToAdmin);
userRouter.post('/demote-from-admin', protectAdmin, demoteFromAdmin);

// Public routes
userRouter.get('/by-id/:userId', getUserById);
userRouter.post('/update-city-public', updateUserCityPublic);

// Admin route - get current user
userRouter.get('/me', protectAdmin, async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId);
        if (!user) return res.json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

export default userRouter;
