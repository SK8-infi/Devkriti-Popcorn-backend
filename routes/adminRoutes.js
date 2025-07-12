import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import { getAllBookings, getAllShows, getDashboardData, isAdmin, setTheatreName, getMyTheatre, updateMyTheatreLayout } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get('/is-admin', protectAdmin, isAdmin)
adminRouter.get('/dashboard', protectAdmin, getDashboardData)
adminRouter.get('/all-shows', protectAdmin, getAllShows)
adminRouter.get('/all-bookings', protectAdmin, getAllBookings)
adminRouter.get('/my-theatre', protectAdmin, getMyTheatre);
adminRouter.post('/set-theatre', protectAdmin, setTheatreName);
adminRouter.post('/my-theatre/layout', protectAdmin, updateMyTheatreLayout);

export default adminRouter;