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
            layout: Array(8).fill().map(() => Array(10).fill(1))
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
      theatre: { 
        _id: theatreDoc._id, 
        name: theatreDoc.name, 
        layout: theatreDoc.layout,
        rooms: theatreDoc.rooms || []
      },
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

// Add a room to the authenticated admin's theatre
export const addRoomToTheatre = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, type, layout } = req.body;
    if (!name || !type || !Array.isArray(layout) || !Array.isArray(layout[0])) {
      return res.status(400).json({ success: false, message: 'Invalid room data' });
    }
    const theatreDoc = await Theatre.findOne({ admin: userId });
    if (!theatreDoc) return res.status(404).json({ success: false, message: 'Theatre not found for this admin' });
    theatreDoc.rooms.push({ name, type, layout });
    await theatreDoc.save();
    res.json({ success: true, message: 'Room added!', rooms: theatreDoc.rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update a room in the authenticated admin's theatre
export const updateRoomInTheatre = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId, name, type, layout } = req.body;
    if (!roomId || !name || !type || !Array.isArray(layout) || !Array.isArray(layout[0])) {
      return res.status(400).json({ success: false, message: 'Invalid room data' });
    }
    const theatreDoc = await Theatre.findOne({ admin: userId });
    if (!theatreDoc) return res.status(404).json({ success: false, message: 'Theatre not found for this admin' });
    
    const roomIndex = theatreDoc.rooms.findIndex(room => String(room._id) === String(roomId));
    if (roomIndex === -1) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    theatreDoc.rooms[roomIndex] = { ...theatreDoc.rooms[roomIndex], name, type, layout };
    await theatreDoc.save();
    res.json({ success: true, message: 'Room updated!', rooms: theatreDoc.rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a room from the authenticated admin's theatre
export const deleteRoomFromTheatre = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId is required' });
    const theatreDoc = await Theatre.findOne({ admin: userId });
    if (!theatreDoc) return res.status(404).json({ success: false, message: 'Theatre not found for this admin' });
    const initialLength = theatreDoc.rooms.length;
    theatreDoc.rooms = theatreDoc.rooms.filter(room => String(room._id) !== String(roomId));
    if (theatreDoc.rooms.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    await theatreDoc.save();
    res.json({ success: true, message: 'Room deleted!', rooms: theatreDoc.rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API to get all theatres
export const getAllTheatres = async (req, res) => {
    try {
        const theatres = await Theatre.find({});
        res.json({ success: true, theatres });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get a theatre by its ObjectId
export const getTheatreById = async (req, res) => {
    try {
        const { theatreId } = req.params;
        const theatre = await Theatre.findById(theatreId);
        if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });
        res.json({ success: true, theatre });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}