import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import { getAllBookings, getAllShows, getDashboardData, isAdmin, setTheatreName, getMyTheatre, updateMyTheatreLayout, getAllTheatres, getTheatreById, addRoomToTheatre, updateRoomInTheatre, deleteRoomFromTheatre, getAllUsers, updateTheatreAdmin, getTheatreAdminInfo } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get('/is-admin', protectAdmin, isAdmin)
adminRouter.get('/dashboard', protectAdmin, getDashboardData)
adminRouter.get('/all-shows', protectAdmin, getAllShows)
adminRouter.get('/shows', protectAdmin, getAllShows)
adminRouter.get('/all-bookings', protectAdmin, getAllBookings)
adminRouter.get('/all-theatres', getAllTheatres);
adminRouter.get('/my-theatre', protectAdmin, getMyTheatre);
adminRouter.get('/all-users', protectAdmin, getAllUsers);
adminRouter.post('/set-theatre', protectAdmin, setTheatreName);
adminRouter.post('/my-theatre/layout', protectAdmin, updateMyTheatreLayout);
adminRouter.post('/my-theatre/room/add', protectAdmin, addRoomToTheatre);
adminRouter.post('/my-theatre/room/update', protectAdmin, updateRoomInTheatre);
adminRouter.post('/my-theatre/room/delete', protectAdmin, deleteRoomFromTheatre);
adminRouter.get('/theatre/:theatreId', getTheatreById);

// Theatre admin management routes
adminRouter.put('/theatre/admin', protectAdmin, updateTheatreAdmin);
adminRouter.get('/theatre/:theatreId/admin', getTheatreAdminInfo);

export default adminRouter;