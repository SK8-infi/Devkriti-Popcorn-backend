import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";


// API Controller Function to Get User Bookings
export const getUserBookings = async (req, res)=>{
    try {
        const user = req.auth().userId;

        const bookings = await Booking.find({user}).populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({createdAt: -1 })
        res.json({success: true, bookings})
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

// API Controller Function to update Favorite Movie in Clerk User Metadata
export const updateFavorite = async (req, res)=>{
    try {
        const { movieId } = req.body;
        const userId = req.auth().userId;

        const user = await clerkClient.users.getUser(userId)

        if(!user.privateMetadata.favorites){
            user.privateMetadata.favorites = []
        }

        if(!user.privateMetadata.favorites.includes(movieId)){
            user.privateMetadata.favorites.push(movieId)
        }else{
            user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item => item !== movieId)
        }

        await clerkClient.users.updateUserMetadata(userId, {privateMetadata: user.privateMetadata})

        res.json({success: true, message: "Favorite movies updated" })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getFavorites = async (req, res) =>{
    try {
        const user = await clerkClient.users.getUser(req.auth().userId)
        const favorites = user.privateMetadata.favorites;

        // Getting movies from database
        const movies = await Movie.find({_id: {$in: favorites}})

        res.json({success: true, movies})
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
        const userId = req.auth().userId;
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
}

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};