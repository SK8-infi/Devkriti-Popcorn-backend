import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import { getAllBookings, getAllShows, getDashboardData, isAdmin, setTheatreName, getMyTheatre, updateMyTheatreLayout, getAllTheatres, getTheatreById } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get('/is-admin', protectAdmin, isAdmin)
adminRouter.get('/dashboard', protectAdmin, getDashboardData)
adminRouter.get('/all-shows', protectAdmin, getAllShows)
adminRouter.get('/all-bookings', protectAdmin, getAllBookings)
adminRouter.get('/all-theatres', getAllTheatres);
adminRouter.get('/my-theatre', protectAdmin, getMyTheatre);
adminRouter.post('/set-theatre', protectAdmin, setTheatreName);
adminRouter.post('/my-theatre/layout', protectAdmin, updateMyTheatreLayout);
adminRouter.get('/theatre/:theatreId', getTheatreById);

export default adminRouter;