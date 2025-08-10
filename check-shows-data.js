import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Show from './models/Show.js';
import Theatre from './models/Theatre.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkShowsData = async () => {
  try {
    await connectDB();
    
    // Check total shows
    const totalShows = await Show.countDocuments();
    console.log(`\n📊 Total shows in database: ${totalShows}`);
    
    if (totalShows === 0) {
      console.log('❌ No shows found in database!');
      return;
    }
    
    // Get all shows with populated theatre and movie data
    const shows = await Show.find()
      .populate('theatre', 'name city address')
      .populate('movie', 'title poster_path')
      .sort({ showDateTime: 1 });
    
    console.log('\n🎬 Shows found:');
    shows.forEach((show, index) => {
      console.log(`${index + 1}. ${show.movie?.title || 'Unknown Movie'} at ${show.theatre?.name || 'Unknown Theatre'}`);
      console.log(`   Date: ${new Date(show.showDateTime).toLocaleString()}`);
      console.log(`   Theatre ID: ${show.theatre?._id}`);
      console.log(`   Movie ID: ${show.movie?._id}`);
      console.log('');
    });
    
    // Check theatres
    const theatres = await Theatre.find();
    console.log(`\n🏢 Total theatres: ${theatres.length}`);
    theatres.forEach(theatre => {
      console.log(`- ${theatre.name} (ID: ${theatre._id}) in ${theatre.city}`);
    });
    
    // Check which theatres have shows
    const theatreIdsWithShows = [...new Set(shows.map(show => show.theatre?._id?.toString()).filter(Boolean))];
    console.log(`\n🎭 Theatres with shows: ${theatreIdsWithShows.length}`);
    theatreIdsWithShows.forEach(theatreId => {
      const theatre = theatres.find(t => t._id.toString() === theatreId);
      console.log(`- ${theatre?.name || 'Unknown'} (${theatreId})`);
    });
    
  } catch (error) {
    console.error('Error checking shows data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

checkShowsData();
