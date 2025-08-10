import mongoose from 'mongoose';
import 'dotenv/config';
import Review from './models/Review.js';
import User from './models/User.js';
import Theatre from './models/Theatre.js';

// Review templates
const reviewTemplates = {
  positive: {
    titles: ["Excellent experience!", "Great theatre!", "Highly recommended", "Amazing cinema"],
    contents: ["Had an amazing time. Great picture and sound quality. Comfortable seats and friendly staff."],
    pros: [["Great picture quality", "Comfortable seats", "Excellent sound"]],
    cons: [[]]
  },
  mixed: {
    titles: ["Good but could be better", "Decent experience", "Mixed feelings"],
    contents: ["Overall good but some areas need improvement. Picture quality is good but seats could be better."],
    pros: [["Good picture quality", "Large screen"]],
    cons: [["Uncomfortable seats", "Expensive food"]]
  },
  negative: {
    titles: ["Disappointing", "Not worth it", "Poor experience"],
    contents: ["Very disappointing. Poor picture quality, bad sound, and uncomfortable seats."],
    pros: [["Close to home"]],
    cons: [["Poor quality", "Bad service", "Expensive"]]
  }
};

const generateReview = (rating) => {
  let template;
  if (rating >= 4) template = reviewTemplates.positive;
  else if (rating >= 3) template = reviewTemplates.mixed;
  else template = reviewTemplates.negative;

  return {
    title: template.titles[Math.floor(Math.random() * template.titles.length)],
    content: template.contents[0],
    pros: template.pros[0],
    cons: template.cons[0]
  };
};

const addTheatreReviews = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    const users = await User.find({ role: 'user' });
    const theatres = await Theatre.find({});
    
    console.log(`Found ${users.length} users and ${theatres.length} theatres\n`);

    const reviewsToAdd = [];

    users.forEach(user => {
      if (!user.city) return;

      const cityTheatres = theatres.filter(t => t.city === user.city);
      if (cityTheatres.length === 0) return;

      const numReviews = Math.floor(Math.random() * 2) + 1;
      const selectedTheatres = cityTheatres.slice(0, numReviews);

      selectedTheatres.forEach(theatre => {
        const rating = Math.floor(Math.random() * 5) + 1;
        const { title, content, pros, cons } = generateReview(rating);
        
        const review = {
          user: user._id,
          theatre: theatre._id,
          rating: rating,
          title: title,
          content: content,
          pros: pros,
          cons: cons,
          visitDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          helpful: [],
          isVerified: Math.random() < 0.3,
          reviewerBadge: 'none',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        reviewsToAdd.push(review);
      });
    });

    console.log(`Creating ${reviewsToAdd.length} reviews...\n`);
    const result = await Review.insertMany(reviewsToAdd);
    console.log(`✅ Created ${result.length} reviews!\n`);

    // Statistics
    const ratingStats = {};
    result.forEach(r => ratingStats[r.rating] = (ratingStats[r.rating] || 0) + 1);

    console.log('📊 RATING DISTRIBUTION:');
    Object.entries(ratingStats).forEach(([rating, count]) => {
      console.log(`  ${rating} Star: ${count} reviews`);
    });

    const totalReviews = await Review.countDocuments();
    console.log(`\nTotal reviews in database: ${totalReviews}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

addTheatreReviews();
