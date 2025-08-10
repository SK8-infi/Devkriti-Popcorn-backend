import mongoose from 'mongoose';
import 'dotenv/config';
import Review from './models/Review.js';
import User from './models/User.js';
import Theatre from './models/Theatre.js';

const analyzeReviews = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Get all reviews with populated user and theatre info
    const allReviews = await Review.find({})
      .populate('user', 'name email role city')
      .populate('theatre', 'name city')
      .populate('theatreResponse.respondedBy', 'name role')
      .sort({ createdAt: -1 });

    console.log(`Total reviews found: ${allReviews.length}\n`);
    console.log('='.repeat(80));

    if (allReviews.length === 0) {
      console.log('📝 No reviews found in the database.');
      console.log('The review system is ready but has no data yet.');
      return;
    }

    // Display each review
    allReviews.forEach((review, index) => {
      console.log(`\n📝 REVIEW ${index + 1}:`);
      console.log('='.repeat(50));
      console.log(`ID: ${review._id}`);
      console.log(`User: ${review.user?.name} (${review.user?.email}) - ${review.user?.role}`);
      console.log(`Theatre: ${review.theatre?.name} (${review.theatre?.city})`);
      console.log(`Rating: ${review.rating}/5`);
      console.log(`Title: ${review.title}`);
      console.log(`Content: ${review.content.substring(0, 100)}${review.content.length > 100 ? '...' : ''}`);
      
      if (review.pros && review.pros.length > 0) {
        console.log(`Pros: ${review.pros.join(', ')}`);
      }
      
      if (review.cons && review.cons.length > 0) {
        console.log(`Cons: ${review.cons.join(', ')}`);
      }
      
      console.log(`Visit Date: ${review.visitDate ? review.visitDate.toLocaleDateString() : 'Not set'}`);
      console.log(`Helpful Votes: ${review.helpful?.length || 0}`);
      console.log(`Verified: ${review.isVerified ? 'Yes' : 'No'}`);
      console.log(`Reviewer Badge: ${review.reviewerBadge}`);
      console.log(`Status: ${review.status}`);
      
      if (review.theatreResponse && review.theatreResponse.content) {
        console.log(`Theatre Response: ${review.theatreResponse.content.substring(0, 100)}${review.theatreResponse.content.length > 100 ? '...' : ''}`);
        console.log(`Responded By: ${review.theatreResponse.respondedBy?.name} (${review.theatreResponse.respondedBy?.role})`);
        console.log(`Response Date: ${review.theatreResponse.respondedAt ? review.theatreResponse.respondedAt.toLocaleDateString() : 'Not set'}`);
      }
      
      console.log(`Created: ${review.createdAt ? review.createdAt.toLocaleString() : 'Not available'}`);
      console.log(`Updated: ${review.updatedAt ? review.updatedAt.toLocaleString() : 'Not available'}`);
    });

    // Show summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('📊 REVIEW STATISTICS:');
    console.log('='.repeat(50));
    
    const totalReviews = allReviews.length;
    const activeReviews = allReviews.filter(r => r.status === 'active').length;
    const hiddenReviews = allReviews.filter(r => r.status === 'hidden').length;
    
    console.log(`Total Reviews: ${totalReviews}`);
    console.log(`Active Reviews: ${activeReviews}`);
    console.log(`Hidden Reviews: ${hiddenReviews}`);

    // Rating distribution
    const ratingDistribution = {
      1: allReviews.filter(r => r.rating === 1).length,
      2: allReviews.filter(r => r.rating === 2).length,
      3: allReviews.filter(r => r.rating === 3).length,
      4: allReviews.filter(r => r.rating === 4).length,
      5: allReviews.filter(r => r.rating === 5).length
    };

    console.log('\n⭐ RATING DISTRIBUTION:');
    Object.entries(ratingDistribution).forEach(([rating, count]) => {
      const percentage = ((count / totalReviews) * 100).toFixed(1);
      console.log(`  ${rating} Star: ${count} reviews (${percentage}%)`);
    });

    // Badge distribution
    const badgeDistribution = {
      none: allReviews.filter(r => r.reviewerBadge === 'none').length,
      verified: allReviews.filter(r => r.reviewerBadge === 'verified').length,
      frequent: allReviews.filter(r => r.reviewerBadge === 'frequent').length,
      expert: allReviews.filter(r => r.reviewerBadge === 'expert').length
    };

    console.log('\n🏆 BADGE DISTRIBUTION:');
    Object.entries(badgeDistribution).forEach(([badge, count]) => {
      const percentage = ((count / totalReviews) * 100).toFixed(1);
      console.log(`  ${badge}: ${count} reviews (${percentage}%)`);
    });

    // Theatre distribution
    const theatreStats = {};
    allReviews.forEach(review => {
      const theatreName = review.theatre?.name || 'Unknown';
      if (!theatreStats[theatreName]) {
        theatreStats[theatreName] = { count: 0, totalRating: 0 };
      }
      theatreStats[theatreName].count++;
      theatreStats[theatreName].totalRating += review.rating;
    });

    console.log('\n🎭 THEATRE REVIEW STATISTICS:');
    Object.entries(theatreStats).forEach(([theatre, stats]) => {
      const avgRating = (stats.totalRating / stats.count).toFixed(1);
      console.log(`  ${theatre}: ${stats.count} reviews, Avg Rating: ${avgRating}/5`);
    });

    // User distribution
    const userStats = {};
    allReviews.forEach(review => {
      const userName = review.user?.name || 'Unknown';
      if (!userStats[userName]) {
        userStats[userName] = { count: 0, totalRating: 0 };
      }
      userStats[userName].count++;
      userStats[userName].totalRating += review.rating;
    });

    console.log('\n👤 USER REVIEW STATISTICS:');
    Object.entries(userStats).forEach(([user, stats]) => {
      const avgRating = (stats.totalRating / stats.count).toFixed(1);
      console.log(`  ${user}: ${stats.count} reviews, Avg Rating: ${avgRating}/5`);
    });

    // Response statistics
    const reviewsWithResponses = allReviews.filter(r => r.theatreResponse && r.theatreResponse.content);
    console.log(`\n💬 THEATRE RESPONSES: ${reviewsWithResponses.length}/${totalReviews} reviews have responses`);

    // Verification statistics
    const verifiedReviews = allReviews.filter(r => r.isVerified);
    console.log(`\n✅ VERIFIED REVIEWS: ${verifiedReviews.length}/${totalReviews} reviews are verified`);

    // Helpful votes statistics
    const totalHelpfulVotes = allReviews.reduce((sum, r) => sum + (r.helpful?.length || 0), 0);
    const reviewsWithHelpfulVotes = allReviews.filter(r => r.helpful && r.helpful.length > 0);
    console.log(`\n👍 HELPFUL VOTES: ${totalHelpfulVotes} total votes across ${reviewsWithHelpfulVotes.length} reviews`);

    // Pros/Cons statistics
    const reviewsWithPros = allReviews.filter(r => r.pros && r.pros.length > 0);
    const reviewsWithCons = allReviews.filter(r => r.cons && r.cons.length > 0);
    console.log(`\n📋 PROS/CONS: ${reviewsWithPros.length} reviews have pros, ${reviewsWithCons.length} reviews have cons`);

  } catch (error) {
    console.error('Error analyzing reviews:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

analyzeReviews();
