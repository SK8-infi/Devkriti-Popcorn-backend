import axios from "axios"
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";
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
        const {movieId, showsInput, showPrice, theatreId} = req.body

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
                    showPrice,
                    occupiedSeats: {}
                })
            })
        });

        if(showsToCreate.length > 0){
            await Show.insertMany(showsToCreate);
        }

         //  Trigger Inngest event
         await inngest.send({
            name: "app/show.added",
             data: {movieTitle: movie.title}
         })

        res.json({success: true, message: 'Show Added successfully.'})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all shows from the database
export const getShows = async (req, res) =>{
    try {
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({ showDateTime: 1 });
        res.json({success: true, shows});
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get a single show from the database
export const getShow = async (req, res) =>{
    try {
        const {movieId} = req.params;
        // get all upcoming shows for the movie, and populate theatre
        const shows = await Show.find({movie: movieId, showDateTime: { $gte: new Date() }}).populate('theatre');

        const movie = await Movie.findById(movieId);
        const dateTime = {};

        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if(!dateTime[date]){
                dateTime[date] = []
            }
            // Debug log for show and theatre
            console.log('Show:', show);
            console.log('Show theatre:', show.theatre);
            dateTime[date].push({ 
                time: show.showDateTime, 
                showId: show._id,
                theatre: show.theatre?._id ? String(show.theatre._id) : String(show.theatre),
                theatreName: show.theatre?.name || '',
                theatreCity: show.theatre?.city || '',
                showPrice: show.showPrice // include showPrice for frontend tally
            })
        })

        res.json({success: true, movie, dateTime})
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}