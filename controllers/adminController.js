import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import User from "../models/User.js";
import Theatre from '../models/Theatre.js';
import Movie from '../models/Movie.js';
import { triggerBookingCleanup } from '../utils/cronJobs.js';


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
        
        // Get active shows for this theatre only
        const activeShows = await Show.find({
            theatre: theatre._id,
            showDateTime: { $gte: new Date() }
        }).populate('movie');

        // Count users (this could be filtered by theatre city if needed)
        const totalUser = await User.countDocuments();

        const totalRevenue = bookings.reduce((acc, booking) => acc + (booking.amount || 0), 0);

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
        console.error('getAllShows error:', error);
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
            theatreId: theatreDoc._id, // Return the theatre ID
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
        const { city } = req.query; // Get city from query parameters
        
        let query = {};
        
        // Filter by city if provided
        if (city && city.trim() !== '') {
            query.city = { $regex: new RegExp(city.trim(), 'i') }; // Case-insensitive search
        }
        
        const theatres = await Theatre.find(query).populate('admin', 'name email googleId role');
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

// API to get admin analytics
export const getAdminAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const { period = 'month' } = req.query;
        
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }
        
        // Get admin's theatres
        const theatres = await Theatre.find({ admin: userId }).populate('rooms');
        
        if (!theatres || theatres.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No theatres found for this admin' 
            });
        }
        
        const analytics = [];
        
        for (const theatre of theatres) {
            // Get shows for this theatre in the period
            const shows = await Show.find({
                theatre: theatre._id,
                showDateTime: { 
                    $gte: startDate,
                    $lte: now 
                }
            }).populate('movie');
            
            const showIds = shows.map(show => show._id);
            
            // Get bookings for this period
            const bookings = await Booking.find({
                show: { $in: showIds },
                isPaid: true,
                createdAt: { 
                    $gte: startDate,
                    $lte: now 
                }
            }).populate('show');
            
            // Calculate previous period for comparison
            const prevStartDate = new Date(startDate);
            const prevEndDate = new Date(startDate);
            const periodDuration = now.getTime() - startDate.getTime();
            prevStartDate.setTime(startDate.getTime() - periodDuration);
            
            const prevBookings = await Booking.find({
                show: { $in: showIds },
                isPaid: true,
                createdAt: { 
                    $gte: prevStartDate,
                    $lte: prevEndDate 
                }
            });
            
            // Calculate metrics
            const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
            const totalBookings = bookings.length;
            
            const prevTotalRevenue = prevBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
            const prevTotalBookings = prevBookings.length;
            
            const revenueTrend = prevTotalRevenue > 0 
                ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
                : 0;
            const bookingsTrend = prevTotalBookings > 0 
                ? ((totalBookings - prevTotalBookings) / prevTotalBookings) * 100 
                : 0;
            
            // Calculate occupancy rates
            const totalSeats = shows.reduce((sum, show) => {
                const room = theatre.rooms.find(r => r._id.toString() === show.room.toString());
                return sum + (room ? room.totalSeats : 0);
            }, 0);
            
            const occupiedSeats = bookings.reduce((sum, booking) => sum + booking.seats.length, 0);
            const averageOccupancy = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0;
            
            // Find peak occupancy
            const showOccupancies = shows.map(show => {
                const showBookings = bookings.filter(b => b.show._id.toString() === show._id.toString());
                const room = theatre.rooms.find(r => r._id.toString() === show.room.toString());
                const showSeats = showBookings.reduce((sum, booking) => sum + booking.seats.length, 0);
                return room ? (showSeats / room.totalSeats) * 100 : 0;
            });
            const peakOccupancy = Math.max(...showOccupancies, 0);
            
            // Popular movies analysis
            const movieStats = {};
            bookings.forEach(booking => {
                if (booking.show && booking.show.movie) {
                    const movieId = booking.show.movie._id.toString();
                    if (!movieStats[movieId]) {
                        movieStats[movieId] = {
                            _id: movieId,
                            title: booking.show.movie.title,
                            bookings: 0,
                            revenue: 0,
                            seats: 0,
                            shows: new Set()
                        };
                    }
                    movieStats[movieId].bookings += 1;
                    movieStats[movieId].revenue += booking.amount || 0;
                    movieStats[movieId].seats += booking.seats.length;
                    movieStats[movieId].shows.add(booking.show._id.toString());
                }
            });
            
            const popularMovies = Object.values(movieStats)
                .map(movie => ({
                    ...movie,
                    showCount: movie.shows.size,
                    occupancy: movie.seats > 0 ? (movie.seats / (movie.showCount * 100)) * 100 : 0
                }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);
            
            // Peak hours analysis
            const hourStats = {};
            bookings.forEach(booking => {
                if (booking.show && booking.show.showDateTime) {
                    const hour = new Date(booking.show.showDateTime).getHours();
                    if (!hourStats[hour]) {
                        hourStats[hour] = 0;
                    }
                    hourStats[hour] += 1;
                }
            });
            
            const peakHours = Object.entries(hourStats)
                .map(([hour, bookings]) => ({
                    time: `${hour}:00`,
                    bookings
                }))
                .sort((a, b) => b.bookings - a.bookings)
                .slice(0, 5);
            
            // Room performance
            const roomPerformance = theatre.rooms.map(room => {
                const roomShows = shows.filter(show => show.room.toString() === room._id.toString());
                const roomBookings = bookings.filter(booking => 
                    roomShows.some(show => show._id.toString() === booking.show._id.toString())
                );
                
                const roomRevenue = roomBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
                const roomSeats = roomBookings.reduce((sum, booking) => sum + booking.seats.length, 0);
                const roomOccupancy = room.totalSeats > 0 && roomShows.length > 0 
                    ? (roomSeats / (room.totalSeats * roomShows.length)) * 100 
                    : 0;
                
                return {
                    name: room.name,
                    type: room.type,
                    occupancy: roomOccupancy,
                    revenue: roomRevenue
                };
            });
            
            // Active shows count
            const activeShows = await Show.countDocuments({
                theatre: theatre._id,
                showDateTime: { $gte: now }
            });
            
            const totalShows = await Show.countDocuments({
                theatre: theatre._id
            });
            
            analytics.push({
                theatre: {
                    _id: theatre._id,
                    name: theatre.name,
                    city: theatre.city,
                    averageRating: theatre.averageRating,
                    reviewCount: theatre.reviewCount
                },
                revenue: {
                    total: totalRevenue,
                    trend: revenueTrend
                },
                bookings: {
                    total: totalBookings,
                    trend: bookingsTrend
                },
                occupancy: {
                    average: averageOccupancy,
                    peak: peakOccupancy
                },
                shows: {
                    active: activeShows,
                    total: totalShows
                },
                popularMovies,
                peakHours,
                roomPerformance
            });
        }
        
        res.json({ 
            success: true, 
            analytics,
            period 
        });
        
    } catch (error) {
        console.error('getAdminAnalytics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get admin analytics',
            error: error.message 
        });
    }
};

// API to manually trigger booking cleanup (for testing)
export const triggerBookingCleanupAPI = async (req, res) => {
    try {
        const result = await triggerBookingCleanup();
        res.json({
            success: true,
            message: `Booking cleanup completed successfully`,
            result: result
        });
    } catch (error) {
        console.error('Error in booking cleanup API:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to trigger booking cleanup',
            error: error.message 
        });
    }
};