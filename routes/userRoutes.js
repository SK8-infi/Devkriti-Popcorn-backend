import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { 
    getUserBookings, 
    updateFavorite, 
    getFavorites, 
    updateUserCity, 
    updateUserCityPublic, 
    getUserById, 
    promoteToAdmin, 
    demoteFromAdmin, 
    updateUserTheatre, 
    checkOwnerAccess 
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get('/bookings', authenticateToken, getUserBookings);
userRouter.post('/favorites', authenticateToken, updateFavorite);
userRouter.post('/update-favorite', authenticateToken, updateFavorite); // Alternative route for MovieDetails
userRouter.get('/favorites', authenticateToken, getFavorites);
userRouter.put('/city', authenticateToken, updateUserCity);
userRouter.put('/city/public', updateUserCityPublic);
userRouter.get('/by-id/:userId', getUserById);
userRouter.post('/promote-admin', authenticateToken, promoteToAdmin);
userRouter.post('/demote-admin', authenticateToken, demoteFromAdmin);
userRouter.post('/theatre', authenticateToken, updateUserTheatre);
userRouter.get('/owner-access', authenticateToken, checkOwnerAccess);

export default userRouter;
