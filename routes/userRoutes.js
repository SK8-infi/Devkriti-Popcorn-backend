import express from "express";
import { getFavorites, getUserBookings, updateFavorite, getUserById, updateUserCity, promoteToAdmin, demoteFromAdmin, updateUserTheatre, checkAdAccess } from "../controllers/userController.js";
import User from '../models/User.js';
import { authenticateToken, protectAdmin } from '../middleware/auth.js';

const userRouter = express.Router();

// Protected routes - require authentication
userRouter.get('/bookings', authenticateToken, getUserBookings)
userRouter.post('/update-favorite', authenticateToken, updateFavorite)
userRouter.get('/favorites', authenticateToken, getFavorites)
userRouter.post('/update-city', authenticateToken, updateUserCity)
userRouter.post('/update-theatre', authenticateToken, updateUserTheatre)
userRouter.get('/ad-access', authenticateToken, checkAdAccess);

// Admin routes - require admin authentication
userRouter.post('/promote-to-admin', protectAdmin, promoteToAdmin)
userRouter.post('/demote-from-admin', protectAdmin, demoteFromAdmin)

// Public route - get user by ID
userRouter.get('/by-id/:userId', getUserById);

export default userRouter;