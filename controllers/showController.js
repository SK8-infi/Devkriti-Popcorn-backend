import axios from "axios"
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { sendNewShowNotifications } from '../utils/emailService.js';
import { createNewShowNotification } from '../utils/notificationService.js';
import User from '../models/User.js';
import fs from 'fs-extra';
import path from 'path';

const MOVIES_JSON_PATH = path.join(process.cwd(), 'movies_latest.json');

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res)=>{
    try {
        const data = await fs.readJson(MOVIES_JSON_PATH);
        res.json({success: true, movies: data.movies});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to add a new show to the database
export const addShow = async (req, res) =>{
    try {
        const {movieId, showsInput, silverPrice, goldPrice, premiumPrice, theatreId, roomId, language} = req.body

        // Validate theatre exists
        const Theatre = (await import('../models/Theatre.js')).default;
        const theatre = await Theatre.findById(theatreId);
        if (!theatre) {
            return res.json({ success: false, message: 'Theatre not found.' });
        }

        // Validate room exists in theatre
        const roomExists = theatre.rooms && theatre.rooms.some(room => String(room._id) === String(roomId));
        if (!roomExists) {
            return res.json({ success: false, message: 'Room not found in theatre.' });
        }

        // Check for 3-hour duration conflicts with existing shows
        const existingShows = await Show.find({ 
            theatre: theatreId, 
            room: roomId,
            showDateTime: { $gte: new Date() }
        }).populate('movie');

        for (const showInput of showsInput) {
            for (const time of showInput.time) {
                const newShowStart = new Date(`${showInput.date}T${time}`);
                const newShowEnd = new Date(newShowStart.getTime() + (3 * 60 * 60 * 1000)); // 3 hours later
                
                // Check for conflicts with existing shows
                const conflict = existingShows.find(existingShow => {
                    const existingStart = new Date(existingShow.showDateTime);
                    const existingEnd = new Date(existingStart.getTime() + (3 * 60 * 60 * 1000)); // 3 hours later
                    
                    // Check for overlap
                    return newShowStart < existingEnd && newShowEnd > existingStart;
                });
                
                if (conflict) {
                    return res.json({ 
                        success: false, 
                        message: `Time slot conflicts with existing show: ${conflict.movie?.title || 'Unknown Movie'} at ${conflict.showDateTime.toLocaleString()}` 
                    });
                }
            }
        }

        let movie = await Movie.findById(movieId)

        if(!movie) {
            // Look up movie details from the local cache
            const data = await fs.readJson(MOVIES_JSON_PATH);
            const cachedMovie = data.movies.find(m => String(m.id) === String(movieId));
            if (!cachedMovie) {
                return res.json({ success: false, message: 'Movie not found in local cache.' });
            }
            // Use genres and casts if available, fallback to empty array
            const movieDetails = {
                _id: movieId,
                title: cachedMovie.title,
                overview: cachedMovie.overview,
                poster_path: cachedMovie.poster_path,
                backdrop_path: cachedMovie.backdrop_path,
                genres: cachedMovie.genres || [],
                casts: cachedMovie.casts || [],
                release_date: cachedMovie.release_date,
                original_language: cachedMovie.original_language,
                tagline: cachedMovie.tagline || "",
                vote_average: cachedMovie.vote_average,
                runtime: cachedMovie.runtime,
            }
            // Add movie to the database
            movie = await Movie.create(movieDetails);
        }

        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            show.time.forEach((time)=>{
                const dateTimeString = `${showDate}T${time}`;
                showsToCreate.push({
                    movie: movieId,
                    theatre: theatreId,
                    showDateTime: new Date(dateTimeString),
                    silverPrice,
                    goldPrice,
                    premiumPrice,
                    language,
                    occupiedSeats: {},
                    room: roomId
                })
            })
        });

        if(showsToCreate.length > 0){
            await Show.insertMany(showsToCreate);
        }

         // Send new show notifications to all users
         sendNewShowNotifications(movie.title).catch(error => {
             console.error('Error sending new show notifications:', error);
         });

         // Create in-app notifications for all users
         try {
             const users = await User.find({});
             for (const user of users) {
                 await createNewShowNotification(user._id, movie.title);
             }
         } catch (notificationError) {
             console.error('Error creating new show notifications:', notificationError);
         }

        res.json({success: true, message: 'Show Added successfully.'})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all shows from the database
export const getShows = async (req, res) =>{
    try {
        const { city } = req.query; // Get city from query parameters
        
        let query = { showDateTime: { $gte: new Date() } };
        
        // First get all shows and populate both movie and theatre
        const shows = await Show.find(query)
            .populate('movie')
            .populate('theatre') // Add theatre population
            .sort({ showDateTime: 1 });
        
        // Filter by city if provided
        let filteredShows = shows;
        if (city && city.trim() !== '') {
            filteredShows = shows.filter(show => 
                show.theatre && 
                show.theatre.city && 
                show.theatre.city.toLowerCase() === city.toLowerCase()
            );
        }
        
        res.json({success: true, shows: filteredShows});
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get a single show from the database
export const getShow = async (req, res) =>{
    try {
        const {movieId} = req.params;
        const { city } = req.query; // Get city from query parameters
        
        // get all upcoming shows for the movie, and populate theatre
        const shows = await Show.find({movie: movieId, showDateTime: { $gte: new Date() }}).populate('theatre');

        // Filter by city if provided
        let filteredShows = shows;
        if (city && city.trim() !== '') {
            filteredShows = shows.filter(show => 
                show.theatre && 
                show.theatre.city && 
                show.theatre.city.toLowerCase() === city.toLowerCase()
            );
        }

        const movie = await Movie.findById(movieId);
        const dateTime = {};

        filteredShows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if(!dateTime[date]){
                dateTime[date] = []
            }
            
            // Get room information for format filtering
            let roomInfo = null;
            if (show.theatre && show.theatre.rooms) {
                roomInfo = show.theatre.rooms.find(room => room._id.toString() === show.room);
            }
            
            dateTime[date].push({ 
                time: show.showDateTime, 
                showId: show._id,
                theatre: show.theatre?._id ? String(show.theatre._id) : String(show.theatre),
                theatreName: show.theatre?.name || '',
                theatreCity: show.theatre?.city || '',
                theatreAddress: show.theatre?.address || '',
                silverPrice: show.silverPrice,
                goldPrice: show.goldPrice,
                premiumPrice: show.premiumPrice,
                language: show.language,
                format: roomInfo?.type || 'Normal', // Use room type as format
                roomName: roomInfo?.name || 'Unknown Room'
            })
        })

        res.json({success: true, movie, dateTime})
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}