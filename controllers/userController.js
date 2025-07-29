import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

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

// API Controller Function to update User City
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

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if userId is a valid MongoDB ObjectId
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
        
        let user = null;
        
        if (isValidObjectId) {
            // Try to find user by MongoDB ObjectId
            user = await User.findById(userId);
        }
        
        // If not found by ObjectId or userId is not a valid ObjectId, try other fields
        if (!user) {
            user = await User.findOne({
                $or: [
                    { googleId: userId },
                    { email: userId } // In case it's an email
                ]
            });
        }
        
        if (!user) {
            // Return a placeholder user for old user IDs
            return res.json({ 
                success: true, 
                user: {
                    _id: userId,
                    name: 'Admin User',
                    email: 'admin@theatre.com',
                    image: null
                }
            });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('getUserById error:', error);
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

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: 'User is already an admin' });
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

// API Controller Function to demote admin to user
export const demoteFromAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'User is not an admin' });
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

// API Controller Function to update User Theatre and City
export const updateUserTheatre = async (req, res) => {
    try {
        const userId = req.user._id;
        const { theatre, city } = req.body;
        
        if (!theatre || !city) {
            return res.status(400).json({ success: false, message: 'Theatre name and city are required' });
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            { theatre, city }, 
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ 
            success: true, 
            message: 'Theatre and city updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                theatre: user.theatre,
                city: user.city
            }
        });
    } catch (error) {
        console.error('Update theatre error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Check if user email is in AD_EMAILS list
export const checkAdAccess = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const adEmails = process.env.AD_EMAILS ? process.env.AD_EMAILS.split(',') : [];
        const hasAdAccess = adEmails.includes(user.email);

        res.json({ 
            success: true, 
            hasAdAccess,
            userEmail: user.email 
        });
    } catch (error) {
        console.error('Check AD access error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};