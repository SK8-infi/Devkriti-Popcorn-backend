import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import User from "../models/User.js";
import Theatre from '../models/Theatre.js';


// API to check if user is admin
export const isAdmin = async (req, res) =>{
    res.json({success: true, isAdmin: true})
}

// API to get dashboard data
export const getDashboardData = async (req, res) =>{
    try {
        const userId = req.user._id;
        
        // Get the admin's theatre
        const theatre = await Theatre.findOne({ admin: userId });
        if (!theatre) {
            return res.status(404).json({ success: false, message: 'Theatre not found for this admin' });
        }
        
        // Get all shows for this theatre
        const theatreShows = await Show.find({ theatre: theatre._id }).select('_id');
        const showIds = theatreShows.map(show => show._id);
        
        // Get bookings for this theatre's shows only
        const bookings = await Booking.find({
            show: { $in: showIds },
            isPaid: true
        });
        
        console.log('Theatre ID:', theatre._id);
        console.log('Show IDs:', showIds);
        console.log('Bookings found:', bookings.length);
        console.log('Booking amounts:', bookings.map(b => b.amount));
        
        // Get active shows for this theatre only
        const activeShows = await Show.find({
            theatre: theatre._id,
            showDateTime: { $gte: new Date() }
        }).populate('movie');

        console.log('🔍 Admin Dashboard: Theatre ID:', theatre._id);
        console.log('🔍 Admin Dashboard: Active shows found:', activeShows.length);
        console.log('🔍 Admin Dashboard: Active shows data:', activeShows);

        // Count users (this could be filtered by theatre city if needed)
        const totalUser = await User.countDocuments();

        const totalRevenue = bookings.reduce((acc, booking) => acc + (booking.amount || 0), 0);
        console.log('Total revenue calculated:', totalRevenue);

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue,
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
        const userId = req.user._id;
        
        // Get the admin's theatre
        const theatre = await Theatre.findOne({ admin: userId });
        if (!theatre) {
            return res.status(404).json({ success: false, message: 'Theatre not found for this admin' });
        }
        
        // Get shows for this theatre only
        const shows = await Show.find({
            theatre: theatre._id,
            showDateTime: { $gte: new Date() }
        }).populate('movie').sort({ showDateTime: 1 });
        
        res.json({success: true, shows})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all bookings
export const getAllBookings = async (req, res) =>{
    try {
        const userId = req.user._id;
        
        // Get the admin's theatre
        const theatre = await Theatre.findOne({ admin: userId });
        if (!theatre) {
            return res.status(404).json({ success: false, message: 'Theatre not found for this admin' });
        }
        
        // First get all shows for this theatre
        const theatreShows = await Show.find({ theatre: theatre._id }).select('_id');
        const showIds = theatreShows.map(show => show._id);
        
        // Then fetch bookings for these shows
        const bookings = await Booking.find({
            show: { $in: showIds }
        }).populate('user').populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({ createdAt: -1 });
        
        res.json({success: true, bookings });
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

export const setTheatreName = async (req, res) => {
    try {
        const userId = req.user._id;
        const { theatre, city, address } = req.body;
        const allowedCities = ["Delhi", "Mumbai", "Gwalior", "Indore", "Pune", "Chennai"];
        
        // Validate user exists and has admin role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can create theatres.' });
        }
        
        if (!theatre || typeof theatre !== 'string' || !theatre.trim()) {
            return res.json({ success: false, message: 'Theatre name is required.' });
        }
        if (!city || typeof city !== 'string' || !allowedCities.includes(city)) {
            return res.json({ success: false, message: 'Valid city is required.' });
        }
        
        // Check if a theatre already exists for this admin
        let theatreDoc = await Theatre.findOne({ admin: userId });
        if (theatreDoc) {
            // Update existing theatre
            theatreDoc.name = theatre.trim();
            theatreDoc.city = city;
            theatreDoc.address = address || '';
            await theatreDoc.save();
        } else {
            // Create new theatre for this admin using Google ID reference
            theatreDoc = await Theatre.create({
                name: theatre.trim(),
                city,
                address: address || '',
                admin: userId, // This is now a proper MongoDB ObjectId
                layout: Array(8).fill().map(() => Array(10).fill(1))
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Theatre updated successfully.', 
            theatre: theatreDoc.name, 
            city: theatreDoc.city,
            address: theatreDoc.address,
            adminId: theatreDoc.admin // Return the admin ID for verification
        });
    } catch (error) {
        console.error('Set theatre name error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyTheatre = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const theatreDoc = await Theatre.findOne({ admin: userId });
    if (!theatreDoc) {
      return res.status(404).json({ 
        success: false, 
        message: "Theatre not found for this admin",
        adminId: userId,
        adminEmail: user.email
      });
    }
    
    res.json({
      success: true,
      theatre: { 
        _id: theatreDoc._id, 
        name: theatreDoc.name, 
        layout: theatreDoc.layout,
        rooms: theatreDoc.rooms || [],
        address: theatreDoc.address
      },
      city: theatreDoc.city,
      address: theatreDoc.address,
      admin: {
        id: theatreDoc.admin,
        name: user.name,
        email: user.email,
        googleId: user.googleId
      }
    });
  } catch (err) {
    console.error('getMyTheatre error:', err);
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
        const theatres = await Theatre.find({}).populate('admin', 'name email googleId role');
        res.json({ success: true, theatres });
    } catch (error) {
        console.error('getAllTheatres error:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to get a theatre by its ObjectId
export const getTheatreById = async (req, res) => {
    try {
        const { theatreId } = req.params;
        const theatre = await Theatre.findById(theatreId).populate('admin', 'name email googleId role');
        if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });
        res.json({ success: true, theatre });
    } catch (error) {
        console.error('getTheatreById error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get all users (for admin management)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-__v').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to update theatre admin (for migration purposes)
export const updateTheatreAdmin = async (req, res) => {
    try {
        const { theatreId, newAdminId } = req.body;
        
        if (!theatreId || !newAdminId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Theatre ID and new admin ID are required' 
            });
        }
        
        // Validate theatre exists
        const theatre = await Theatre.findById(theatreId);
        if (!theatre) {
            return res.status(404).json({ 
                success: false, 
                message: 'Theatre not found' 
            });
        }
        
        // Validate new admin user exists and is admin
        const newAdmin = await User.findById(newAdminId);
        if (!newAdmin) {
            return res.status(404).json({ 
                success: false, 
                message: 'New admin user not found' 
            });
        }
        
        if (newAdmin.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'User must be an admin to be assigned as theatre admin' 
            });
        }
        
        // Update theatre admin
        theatre.admin = newAdminId;
        await theatre.save();
        
        res.json({ 
            success: true, 
            message: 'Theatre admin updated successfully',
            theatre: {
                id: theatre._id,
                name: theatre.name,
                city: theatre.city,
                admin: {
                    id: newAdmin._id,
                    name: newAdmin.name,
                    email: newAdmin.email,
                    googleId: newAdmin.googleId
                }
            }
        });
        
    } catch (error) {
        console.error('updateTheatreAdmin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get theatre admin info
export const getTheatreAdminInfo = async (req, res) => {
    try {
        const { theatreId } = req.params;
        
        const theatre = await Theatre.findById(theatreId).populate('admin', 'name email googleId role');
        if (!theatre) {
            return res.status(404).json({ 
                success: false, 
                message: 'Theatre not found' 
            });
        }
        
        res.json({ 
            success: true, 
            admin: theatre.admin,
            theatre: {
                id: theatre._id,
                name: theatre.name,
                city: theatre.city
            }
        });
        
    } catch (error) {
        console.error('getTheatreAdminInfo error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};