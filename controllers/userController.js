import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";
import Theatre from "../models/Theatre.js";

// API Controller Function to Get User Bookings
export const getUserBookings = async (req, res)=>{
    try {
        const userId = req.user._id;

        const bookings = await Booking.find({user: userId}).populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({createdAt: -1 })
        res.json({success: true, bookings})
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

// API Controller Function to update Favorite Movie (MongoDB-based)
export const updateFavorite = async (req, res)=>{
    try {
        const { movieId } = req.body;
        const userId = req.user._id; // MongoDB ObjectId from JWT token

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.favorites) {
            user.favorites = [];
        }

        if (!user.favorites.includes(movieId)) {
            user.favorites.push(movieId);
        } else {
            user.favorites = user.favorites.filter(item => item !== movieId);
        }

        await user.save();

        res.json({success: true, message: "Favorite movies updated" })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getFavorites = async (req, res) =>{
    try {
        const userId = req.user._id; // MongoDB ObjectId from JWT token
        const user = await User.findById(userId);
        
        if (!user || !user.favorites) {
            return res.json({ success: true, favorites: [] });
        }

        // Getting movies from database using string IDs
        const movies = await Movie.find({_id: {$in: user.favorites}})

        res.json({success: true, favorites: movies})
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Allowed cities for location selection
const allowedCities = ["Delhi", "Mumbai", "Gwalior", "Indore", "Pune", "Chennai"];

// API Controller Function to update User City (for authenticated users)
export const updateUserCity = async (req, res) => {
    try {
        const userId = req.user._id;
        const { city } = req.body;
        if (!city || typeof city !== 'string' || !allowedCities.includes(city)) {
            return res.json({ success: false, message: 'Valid city is required.' });
        }
        const user = await User.findByIdAndUpdate(userId, { city }, { new: true });
        if (!user) return res.json({ success: false, message: 'User not found' });
        res.json({ success: true, city: user.city });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API Controller Function to update User City (for non-authenticated users)
export const updateUserCityPublic = async (req, res) => {
    try {
        const { city } = req.body;
        if (!city || typeof city !== 'string' || !allowedCities.includes(city)) {
            return res.json({ success: false, message: 'Valid city is required.' });
        }
        // For non-authenticated users, just return success
        // The frontend will handle storing in localStorage
        res.json({ success: true, city: city });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// API Controller Function to get user by ID
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('-__v');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API Controller Function to promote user to admin
export const promoteToAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if current user is owner only
        const currentUser = req.user;
        if (currentUser.role !== 'owner') {
            return res.status(403).json({ success: false, message: 'Only owners can promote users' });
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: 'User is already an admin' });
        }

        if (user.role === 'owner') {
            return res.status(400).json({ success: false, message: 'Cannot promote an owner' });
        }

        user.role = 'admin';
        await user.save();

        res.json({ 
            success: true, 
            message: 'User promoted to admin successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Promote to admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API Controller Function to demote user from admin
export const demoteFromAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if current user is owner only
        const currentUser = req.user;
        if (currentUser.role !== 'owner') {
            return res.status(403).json({ success: false, message: 'Only owners can demote users' });
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'User is not an admin' });
        }

        // Prevent demoting owners
        if (user.role === 'owner') {
            return res.status(400).json({ success: false, message: 'Cannot demote an owner' });
        }

        user.role = 'user';
        await user.save();

        res.json({ 
            success: true, 
            message: 'User demoted from admin successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Demote from admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API Controller Function to update User Theatre and City (now works with Theatre model)
export const updateUserTheatre = async (req, res) => {
    try {
        const userId = req.user._id;
        const { theatre, city, address } = req.body;
        
        if (!theatre || !city) {
            return res.status(400).json({ success: false, message: 'Theatre name and city are required' });
        }

        // Check if user is admin or owner
        const user = await User.findById(userId);
        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            return res.status(403).json({ success: false, message: 'Only admins and owners can manage theatres' });
        }

        // Check if theatre already exists for this admin
        let theatreDoc = await Theatre.findOne({ admin: userId });
        
        if (theatreDoc) {
            // Update existing theatre
            theatreDoc.name = theatre;
            theatreDoc.city = city;
            theatreDoc.address = address || '';
            await theatreDoc.save();
        } else {
            // Create new theatre
            theatreDoc = await Theatre.create({
                name: theatre,
                city: city,
                address: address || '',
                admin: userId,
                layout: Array(8).fill().map(() => Array(10).fill(1))
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Theatre updated successfully',
            theatre: {
                name: theatreDoc.name,
                city: theatreDoc.city,
                address: theatreDoc.address,
                admin: theatreDoc.admin
            }
        });
    } catch (error) {
        console.error('Update theatre error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Check if user has owner role
export const checkOwnerAccess = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hasOwnerAccess = user.role === 'owner';

        // Debug logging
        console.log('🔍 Owner Access Check Debug:');
        console.log('  User ID:', userId);
        console.log('  User Email:', user.email);
        console.log('  User Role:', user.role);
        console.log('  Has Owner Access:', hasOwnerAccess);

        res.json({ 
            success: true, 
            hasOwnerAccess,
            userEmail: user.email,
            userRole: user.role
        });
    } catch (error) {
        console.error('Check owner access error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};