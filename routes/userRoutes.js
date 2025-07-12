import express from "express";
import { getFavorites, getUserBookings, updateFavorite } from "../controllers/userController.js";
import User from '../models/User.js';
import { protectAdmin } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.get('/bookings', getUserBookings)
userRouter.post('/update-favorite', updateFavorite)
userRouter.get('/favorites', getFavorites)

// Get current user from MongoDB
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