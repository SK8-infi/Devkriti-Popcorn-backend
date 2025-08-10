import mongoose from 'mongoose';
import 'dotenv/config';
import Show from './models/Show.js';
import Theatre from './models/Theatre.js';
import Movie from './models/Movie.js';

// Show time slots (2-3 times per day)
const showTimeSlots = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Languages for shows
const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada'];

// Generate random price based on room type
const generatePrice = (roomType) => {
  const basePrices = {
    'Normal': { silver: 150, gold: 200, premium: 250 },
    '3D': { silver: 200, gold: 250, premium: 300 },
    'IMAX': { silver: 300, gold: 400, premium: 500 }
  };
  
  const base = basePrices[roomType] || basePrices['Normal'];
  
  return {
    silverPrice: base.silver + Math.floor(Math.random() * 50),
    goldPrice: base.gold + Math.floor(Math.random() * 50),
    premiumPrice: base.premium + Math.floor(Math.random() * 100)
  };
};

// Check if two shows overlap
const showsOverlap = (show1, show2) => {
  const start1 = new Date(show1.showDateTime);
  const end1 = new Date(start1.getTime() + (show1.runtime || 120) * 60000); // Add runtime + buffer
  
  const start2 = new Date(show2.showDateTime);
  const end2 = new Date(start2.getTime() + (show2.runtime || 120) * 60000);
  
  return start1 < end2 && start2 < end1;
};

// Generate random show date between Aug 20-30, 2025
const generateShowDate = () => {
  const startDate = new Date('2025-08-20');
  const endDate = new Date('2025-08-30');
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(randomTime);
};

// Generate show time for a specific date
const generateShowTime = (date) => {
  const randomSlot = showTimeSlots[Math.floor(Math.random() * showTimeSlots.length)];
  const [hours, minutes] = randomSlot.split(':');
  
  const showDateTime = new Date(date);
  showDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return showDateTime;
};

const addShowsForTheatres = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Get all theatres, movies, and existing shows
    const theatres = await Theatre.find({});
    const movies = await Movie.find({});
    const existingShows = await Show.find({});
    
    console.log(`Found ${theatres.length} theatres, ${movies.length} movies, ${existingShows.length} existing shows\n`);

    if (theatres.length === 0 || movies.length === 0) {
      console.log('❌ Need both theatres and movies to create shows');
      return;
    }

    const showsToAdd = [];
    const cityMovieDistribution = {}; // Track movies per city for common movies

    // Initialize city movie distribution
    theatres.forEach(theatre => {
      if (!cityMovieDistribution[theatre.city]) {
        cityMovieDistribution[theatre.city] = [];
      }
    });

    theatres.forEach(theatre => {
      console.log(`🎭 Processing theatre: ${theatre.name} (${theatre.city})`);
      
      if (!theatre.rooms || theatre.rooms.length === 0) {
        console.log(`⚠️  Theatre ${theatre.name} has no rooms, skipping`);
        return;
      }

      // Select 5-6 movies for this theatre
      const numMovies = Math.floor(Math.random() * 2) + 5; // 5-6 movies
      
      // Get movies for this city (some common, some unique)
      const cityMovies = cityMovieDistribution[theatre.city];
      const availableMovies = movies.filter(movie => !cityMovies.includes(movie._id));
      
             // Select movies for this theatre
       const selectedMovies = [];
       
       // Add some common movies (if available)
       if (cityMovies.length > 0) {
         const commonMovies = cityMovies.slice(0, Math.min(2, cityMovies.length));
         selectedMovies.push(...commonMovies);
       }
       
       // Add unique movies
       const uniqueMoviesNeeded = numMovies - selectedMovies.length;
       const shuffledMovies = availableMovies.sort(() => 0.5 - Math.random());
       selectedMovies.push(...shuffledMovies.slice(0, uniqueMoviesNeeded).map(movie => movie._id));
      
      // Update city movie distribution
      selectedMovies.forEach(movieId => {
        if (!cityMovieDistribution[theatre.city].includes(movieId)) {
          cityMovieDistribution[theatre.city].push(movieId);
        }
      });

             console.log(`  Selected ${selectedMovies.length} movies for ${theatre.name}`);

       // Create shows for each movie
       selectedMovies.forEach(movieId => {
         console.log(`    Processing movie: ${movieId}`);
        const movie = movies.find(m => m._id === movieId);
        if (!movie) return;

        // Get movie runtime (default 120 minutes if not available)
        const movieRuntime = movie.runtime || 120;
        
                 // Generate 2-3 shows per movie
         const numShows = Math.floor(Math.random() * 2) + 2; // 2-3 shows
         
         for (let i = 0; i < numShows; i++) {
           console.log(`      Creating show ${i + 1} for movie ${movie.title}`);
           
           // Select random room for each show
           const randomRoom = theatre.rooms[Math.floor(Math.random() * theatre.rooms.length)];
           
           // Generate show date and time
           const showDate = generateShowDate();
           const showDateTime = generateShowTime(showDate);
           
           // Check for conflicts with existing shows in this theatre
           const existingTheatreShows = existingShows.filter(show => 
             show.theatre.toString() === theatre._id.toString()
           );
           
           const newShow = {
             movie: movieId,
             theatre: theatre._id,
             showDateTime: showDateTime,
             runtime: movieRuntime,
             room: randomRoom._id.toString(),
             language: languages[Math.floor(Math.random() * languages.length)],
             occupiedSeats: {}
           };
          
                     // Generate prices based on room type
           const prices = generatePrice(randomRoom.type);
           newShow.silverPrice = prices.silverPrice;
           newShow.goldPrice = prices.goldPrice;
           newShow.premiumPrice = prices.premiumPrice;
           
           showsToAdd.push(newShow);
           existingShows.push(newShow); // Add to existing shows for conflict checking
           console.log(`        Added show: ${movie.title} at ${showDateTime.toLocaleString()} in ${randomRoom.name}`);
        }
      });
    });

    console.log(`\n📅 CREATING SHOWS...`);
    console.log(`Total shows to create: ${showsToAdd.length}`);

    if (showsToAdd.length === 0) {
      console.log('❌ No shows to create');
      return;
    }

    // Insert shows in batches
    const batchSize = 20;
    let insertedCount = 0;
    
    for (let i = 0; i < showsToAdd.length; i += batchSize) {
      const batch = showsToAdd.slice(i, i + batchSize);
      const result = await Show.insertMany(batch, { ordered: false });
      insertedCount += result.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${result.length} shows`);
    }

    console.log(`\n🎉 Successfully created ${insertedCount} shows!`);

    // Statistics
    const totalShows = await Show.countDocuments();
    console.log(`\n📊 SHOW STATISTICS:`);
    console.log(`Total shows in database: ${totalShows}`);

    // Theatre show distribution
    console.log('\n🎭 SHOWS PER THEATRE:');
    const theatreStats = {};
    showsToAdd.forEach(show => {
      const theatreId = show.theatre.toString();
      if (!theatreStats[theatreId]) {
        theatreStats[theatreId] = 0;
      }
      theatreStats[theatreId]++;
    });

    for (const [theatreId, count] of Object.entries(theatreStats)) {
      const theatre = theatres.find(t => t._id.toString() === theatreId);
      if (theatre) {
        console.log(`  ${theatre.name}: ${count} shows`);
      }
    }

    // Movie show distribution
    console.log('\n🎬 SHOWS PER MOVIE:');
    const movieStats = {};
    showsToAdd.forEach(show => {
      const movieId = show.movie;
      if (!movieStats[movieId]) {
        movieStats[movieId] = 0;
      }
      movieStats[movieId]++;
    });

    Object.entries(movieStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([movieId, count]) => {
        const movie = movies.find(m => m._id === movieId);
        if (movie) {
          console.log(`  ${movie.title}: ${count} shows`);
        }
      });

    // City distribution
    console.log('\n🏙️  SHOWS PER CITY:');
    const cityStats = {};
    showsToAdd.forEach(show => {
      const theatre = theatres.find(t => t._id.toString() === show.theatre.toString());
      if (theatre) {
        const city = theatre.city;
        if (!cityStats[city]) {
          cityStats[city] = 0;
        }
        cityStats[city]++;
      }
    });

    Object.entries(cityStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([city, count]) => {
        console.log(`  ${city}: ${count} shows`);
      });

    // Date distribution
    console.log('\n📅 SHOWS PER DATE:');
    const dateStats = {};
    showsToAdd.forEach(show => {
      const date = show.showDateTime.toISOString().split('T')[0];
      if (!dateStats[date]) {
        dateStats[date] = 0;
      }
      dateStats[date]++;
    });

    Object.entries(dateStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        console.log(`  ${date}: ${count} shows`);
      });

    // Room type distribution
    console.log('\n🎪 SHOWS PER ROOM TYPE:');
    const roomTypeStats = {};
    showsToAdd.forEach(show => {
      const theatre = theatres.find(t => t._id.toString() === show.theatre.toString());
      if (theatre) {
        const room = theatre.rooms.find(r => r._id?.toString() === show.room?.toString() || r.name === show.room);
        if (room) {
          const roomType = room.type;
          if (!roomTypeStats[roomType]) {
            roomTypeStats[roomType] = 0;
          }
          roomTypeStats[roomType]++;
        }
      }
    });

    Object.entries(roomTypeStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([roomType, count]) => {
        console.log(`  ${roomType}: ${count} shows`);
      });

  } catch (error) {
    console.error('Error adding shows:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addShowsForTheatres();
