import mongoose from 'mongoose';
import 'dotenv/config';
import Movie from './models/Movie.js';
import fs from 'fs-extra';

const addMoviesFromJson = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Read the movies_latest.json file
    console.log('📂 Reading movies_latest.json...');
    const jsonData = await fs.readJson('./movies_latest.json');
    const moviesFromJson = jsonData.movies || [];
    
    console.log(`Found ${moviesFromJson.length} movies in JSON file\n`);

    // Get existing movies from database
    const existingMovies = await Movie.find({});
    const existingMovieIds = existingMovies.map(movie => movie._id);
    
    console.log(`Found ${existingMovies.length} existing movies in database\n`);

    // Filter out movies that already exist in database
    const newMovies = moviesFromJson.filter(movie => !existingMovieIds.includes(movie.id.toString()));
    
    console.log(`Found ${newMovies.length} new movies to add\n`);

    if (newMovies.length === 0) {
      console.log('❌ No new movies to add');
      return;
    }

    // Select 25 movies (or all if less than 25)
    const moviesToAdd = newMovies.slice(0, 25);
    
    console.log(`🎬 Adding ${moviesToAdd.length} movies to database...\n`);

    const moviesToInsert = moviesToAdd.map(movie => ({
      _id: movie.id.toString(),
      title: movie.title,
      overview: movie.overview || 'No overview available',
      poster_path: movie.poster_path || '',
      backdrop_path: movie.backdrop_path || '',
      release_date: movie.release_date || '',
      original_language: movie.original_language || 'en',
      tagline: movie.tagline || '',
      genres: movie.genres || [],
      casts: movie.casts || [],
      vote_average: movie.vote_average || 0,
      runtime: movie.runtime || 0
    }));

    // Insert movies in batches to avoid memory issues
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < moviesToInsert.length; i += batchSize) {
      const batch = moviesToInsert.slice(i, i + batchSize);
      const result = await Movie.insertMany(batch, { ordered: false });
      insertedCount += result.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${result.length} movies`);
    }

    console.log(`\n🎉 Successfully added ${insertedCount} movies to database!`);

    // Show some statistics
    const totalMovies = await Movie.countDocuments();
    console.log(`\n📊 DATABASE STATISTICS:`);
    console.log(`Total movies in database: ${totalMovies}`);

    // Show some of the newly added movies
    console.log('\n🎬 NEWLY ADDED MOVIES:');
    const recentMovies = await Movie.find({})
      .sort({ createdAt: -1 })
      .limit(insertedCount)
      .select('title release_date vote_average runtime');

    recentMovies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title} (${movie.release_date}) - ⭐${movie.vote_average}/10 - ${movie.runtime}min`);
    });

    // Genre distribution
    const allMovies = await Movie.find({});
    const genreStats = {};
    
    allMovies.forEach(movie => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach(genre => {
          const genreName = genre.name || genre;
          genreStats[genreName] = (genreStats[genreName] || 0) + 1;
        });
      }
    });

    console.log('\n🎭 GENRE DISTRIBUTION:');
    Object.entries(genreStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([genre, count]) => {
        console.log(`  ${genre}: ${count} movies`);
      });

    // Rating distribution
    const ratingStats = {};
    allMovies.forEach(movie => {
      const rating = Math.floor(movie.vote_average);
      ratingStats[rating] = (ratingStats[rating] || 0) + 1;
    });

    console.log('\n⭐ RATING DISTRIBUTION:');
    Object.entries(ratingStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([rating, count]) => {
        console.log(`  ${rating}/10: ${count} movies`);
      });

  } catch (error) {
    console.error('Error adding movies:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addMoviesFromJson();
