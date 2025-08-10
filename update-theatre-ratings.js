import mongoose from 'mongoose';
import 'dotenv/config';
import Theatre from './models/Theatre.js';
import Review from './models/Review.js';

const updateTheatreRatings = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Get all theatres and reviews
    const theatres = await Theatre.find({});
    const reviews = await Review.find({ status: 'active' }).populate('theatre', 'name');
    
    console.log(`Found ${theatres.length} theatres and ${reviews.length} active reviews\n`);

    if (theatres.length === 0) {
      console.log('❌ No theatres found');
      return;
    }

    // Group reviews by theatre
    const theatreReviews = {};
    reviews.forEach(review => {
      const theatreId = review.theatre._id.toString();
      if (!theatreReviews[theatreId]) {
        theatreReviews[theatreId] = [];
      }
      theatreReviews[theatreId].push(review);
    });

    console.log('📊 CALCULATING THEATRE RATINGS...\n');

    let updatedTheatres = 0;
    let theatresWithReviews = 0;
    let theatresWithoutReviews = 0;

    // Process each theatre
    for (const theatre of theatres) {
      const theatreId = theatre._id.toString();
      const theatreReviewList = theatreReviews[theatreId] || [];
      
      if (theatreReviewList.length === 0) {
        // Theatre has no reviews - set default values
        theatre.averageRating = 0;
        theatre.reviewCount = 0;
        theatresWithoutReviews++;
        console.log(`  ${theatre.name}: No reviews - Rating: 0.0, Count: 0`);
      } else {
        // Calculate average rating and review count
        const totalRating = theatreReviewList.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / theatreReviewList.length;
        const reviewCount = theatreReviewList.length;
        
        theatre.averageRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
        theatre.reviewCount = reviewCount;
        theatresWithReviews++;
        
        console.log(`  ${theatre.name}: Rating: ${theatre.averageRating}, Count: ${reviewCount} (${theatreReviewList.length} reviews)`);
      }

      // Save the updated theatre
      await theatre.save();
      updatedTheatres++;
    }

    console.log(`\n✅ UPDATED ${updatedTheatres} THEATRES`);
    console.log(`  Theatres with reviews: ${theatresWithReviews}`);
    console.log(`  Theatres without reviews: ${theatresWithoutReviews}`);

    // Statistics
    console.log('\n📈 RATING STATISTICS:');
    
    const theatresWithRatings = theatres.filter(t => t.reviewCount > 0);
    const totalRating = theatresWithRatings.reduce((sum, t) => sum + t.averageRating, 0);
    const overallAverage = totalRating / theatresWithRatings.length;
    
    console.log(`  Overall average rating: ${overallAverage.toFixed(1)}/5`);
    console.log(`  Total reviews across all theatres: ${reviews.length}`);
    
    // Rating distribution
    const ratingRanges = {
      '4.5-5.0': 0,
      '4.0-4.4': 0,
      '3.5-3.9': 0,
      '3.0-3.4': 0,
      '2.5-2.9': 0,
      '2.0-2.4': 0,
      '1.5-1.9': 0,
      '1.0-1.4': 0,
      '0.0-0.9': 0
    };

    theatresWithRatings.forEach(theatre => {
      if (theatre.averageRating >= 4.5) ratingRanges['4.5-5.0']++;
      else if (theatre.averageRating >= 4.0) ratingRanges['4.0-4.4']++;
      else if (theatre.averageRating >= 3.5) ratingRanges['3.5-3.9']++;
      else if (theatre.averageRating >= 3.0) ratingRanges['3.0-3.4']++;
      else if (theatre.averageRating >= 2.5) ratingRanges['2.5-2.9']++;
      else if (theatre.averageRating >= 2.0) ratingRanges['2.0-2.4']++;
      else if (theatre.averageRating >= 1.5) ratingRanges['1.5-1.9']++;
      else if (theatre.averageRating >= 1.0) ratingRanges['1.0-1.4']++;
      else ratingRanges['0.0-0.9']++;
    });

    console.log('\n📊 RATING DISTRIBUTION:');
    Object.entries(ratingRanges).forEach(([range, count]) => {
      if (count > 0) {
        const percentage = ((count / theatresWithRatings.length) * 100).toFixed(1);
        console.log(`  ${range}: ${count} theatres (${percentage}%)`);
      }
    });

    // Top rated theatres
    console.log('\n🏆 TOP RATED THEATRES:');
    const topTheatres = theatresWithRatings
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10);
    
    topTheatres.forEach((theatre, index) => {
      console.log(`  ${index + 1}. ${theatre.name}: ${theatre.averageRating}/5 (${theatre.reviewCount} reviews)`);
    });

    // Most reviewed theatres
    console.log('\n📝 MOST REVIEWED THEATRES:');
    const mostReviewed = theatresWithRatings
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 10);
    
    mostReviewed.forEach((theatre, index) => {
      console.log(`  ${index + 1}. ${theatre.name}: ${theatre.reviewCount} reviews (${theatre.averageRating}/5)`);
    });

    // City-wise statistics
    console.log('\n🌆 CITY-WISE STATISTICS:');
    const cityStats = {};
    
    theatresWithRatings.forEach(theatre => {
      if (!cityStats[theatre.city]) {
        cityStats[theatre.city] = { count: 0, totalRating: 0, totalReviews: 0 };
      }
      cityStats[theatre.city].count++;
      cityStats[theatre.city].totalRating += theatre.averageRating;
      cityStats[theatre.city].totalReviews += theatre.reviewCount;
    });

    Object.entries(cityStats).forEach(([city, stats]) => {
      const avgRating = (stats.totalRating / stats.count).toFixed(1);
      console.log(`  ${city}: ${stats.count} theatres, Avg: ${avgRating}/5, Total Reviews: ${stats.totalReviews}`);
    });

  } catch (error) {
    console.error('Error updating theatre ratings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

updateTheatreRatings();
