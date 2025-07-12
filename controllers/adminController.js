import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import User from "../models/User.js";
import Theatre from '../models/Theatre.js';
import { clerkClient } from '@clerk/express';


// API to check if user is admin
export const isAdmin = async (req, res) =>{
    res.json({success: true, isAdmin: true})
}

// API to get dashboard data
export const getDashboardData = async (req, res) =>{
    try {
        const bookings = await Booking.find({isPaid: true});
        const activeShows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie');

        const totalUser = await User.countDocuments();

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking)=> acc + booking.amount, 0),
            activeShows,
            totalUser
        }

        res.json({success: true, dashboardData})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all shows
export const getAllShows = async (req, res) =>{
    try {
        const shows = await Show.find({showDateTime: { $gte: new Date() }}).populate('movie').sort({ showDateTime: 1 })
        res.json({success: true, shows})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all bookings
export const getAllBookings = async (req, res) =>{
    try {
        const bookings = await Booking.find({}).populate('user').populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({ createdAt: -1 })
        res.json({success: true, bookings })
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

export const setTheatreName = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { theatre, city } = req.body;
        const allowedCities = ["Delhi", "Mumbai", "Gwalior", "Indore", "Pune", "Chennai"];
        if (!theatre || typeof theatre !== 'string' || !theatre.trim()) {
            return res.json({ success: false, message: 'Theatre name is required.' });
        }
        if (!city || typeof city !== 'string' || !allowedCities.includes(city)) {
            return res.json({ success: false, message: 'Valid city is required.' });
        }
        // Check if a theatre already exists for this admin
        let theatreDoc = await Theatre.findOne({ admin: userId });
        if (theatreDoc) {
            return res.json({ success: false, message: 'Theatre already set for this admin.' });
        }
        // Create new theatre for this admin
        theatreDoc = await Theatre.create({
            name: theatre.trim(),
            city,
            admin: userId,
            layout: [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]]
        });
        res.json({ success: true, message: 'Theatre created successfully.', theatre: theatreDoc.name, city: theatreDoc.city });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export const getMyTheatre = async (req, res) => {
  try {
    const userId = req.user._id;
    const theatreDoc = await Theatre.findOne({ admin: userId });
    if (!theatreDoc) return res.status(404).json({ success: false, message: "Theatre not found for this admin" });
    res.json({
      success: true,
      theatre: { name: theatreDoc.name, layout: theatreDoc.layout },
      city: theatreDoc.city
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateMyTheatreLayout = async (req, res) => {
  try {
    const userId = req.user._id;
    const theatreDoc = await Theatre.findOne({ admin: userId });
    if (!theatreDoc) return res.status(404).json({ success: false, message: "Theatre not found for this admin" });
    const { layout } = req.body;
    if (!Array.isArray(layout) || !Array.isArray(layout[0])) {
      return res.json({ success: false, message: "Invalid layout format" });
    }
    theatreDoc.layout = layout;
    await theatreDoc.save();
    res.json({ success: true, message: "Layout updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};