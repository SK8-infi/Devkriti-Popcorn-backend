import mongoose from 'mongoose';
import 'dotenv/config';
import Review from './models/Review.js';
import User from './models/User.js';
import Theatre from './models/Theatre.js';

// Comprehensive review templates with detailed content
const reviewTemplates = {
  positive: {
    titles: [
      "Exceptional movie experience!",
      "Best theatre in the city",
      "Outstanding cinema with premium facilities",
      "Highly recommended for movie lovers",
      "Fantastic theatre with amazing service",
      "Perfect movie watching experience",
      "Excellent picture and sound quality",
      "Premium cinema experience",
      "Wonderful theatre with great amenities",
      "Top-notch movie theatre"
    ],
    contents: [
      "Absolutely loved the movie experience here! The picture quality was crystal clear with vibrant colors, and the Dolby surround sound system created an immersive audio experience. The recliner seats were incredibly comfortable with ample legroom. The staff was professional and courteous throughout our visit. The food and beverage options were excellent with a good variety of snacks and drinks. The overall atmosphere was perfect for a movie night - clean, well-maintained, and modern. Will definitely be coming back for future movies!",
      "This theatre exceeded all my expectations! The screen was massive with perfect projection quality, making every scene come to life. The sound system delivered crisp, clear audio that enhanced the movie experience significantly. The seating arrangement is excellent with comfortable recliner chairs that have good spacing. The staff was very helpful and the service was quick. The food quality was surprisingly good for theatre food. The entire facility was spotlessly clean and well-organized. Highly recommend this theatre for anyone looking for a premium movie experience.",
      "One of the finest theatres I've ever visited! The visual quality is outstanding with sharp, clear images and excellent color reproduction. The audio system provides an immersive experience with perfect sound distribution throughout the auditorium. The seats are premium quality with good cushioning and proper lumbar support. The theatre maintains perfect temperature and the air quality is excellent. The staff is well-trained and provides excellent customer service. The food options are diverse and reasonably priced. The overall experience was worth every penny spent.",
      "Fantastic cinema with world-class facilities! The picture quality is absolutely stunning with 4K projection that makes every detail crystal clear. The sound system is phenomenal with Dolby Atmos creating a truly immersive experience. The seating is premium with electric recliners that are extremely comfortable. The theatre is impeccably clean with modern amenities. The staff is professional and attentive to customer needs. The food and beverage selection is impressive with both local and international options. The overall experience was exceptional and I can't wait to visit again.",
      "Excellent theatre with outstanding service! The visual presentation was perfect with excellent brightness and contrast levels. The audio quality was superb with clear dialogue and impactful sound effects. The seats are designed for maximum comfort with good ergonomics and proper spacing. The theatre environment is well-maintained with good ventilation and lighting. The staff is friendly and efficient, making the entire experience smooth and enjoyable. The food quality exceeded expectations with fresh and tasty options. The overall experience was memorable and highly satisfying."
    ],
    pros: [
      ["Crystal clear picture quality", "Immersive surround sound", "Comfortable recliner seats", "Professional staff"],
      ["Massive screen size", "Perfect audio distribution", "Premium seating", "Excellent food options"],
      ["4K projection quality", "Dolby Atmos sound", "Spacious legroom", "Clean environment"],
      ["Vibrant color reproduction", "Crisp audio clarity", "Modern amenities", "Good ventilation"],
      ["Sharp image quality", "Perfect sound balance", "Comfortable seating", "Friendly service"],
      ["Excellent brightness", "Clear dialogue", "Premium facilities", "Diverse food menu"],
      ["Stunning visual quality", "Immersive experience", "Well-maintained", "Professional atmosphere"],
      ["Perfect projection", "Outstanding audio", "Comfortable chairs", "Clean restrooms"]
    ],
    cons: [
      [],
      ["Slightly expensive tickets"],
      ["Premium pricing"],
      ["Higher cost than average"],
      ["Premium rates apply"]
    ]
  },
  mixed: {
    titles: [
      "Good theatre with room for improvement",
      "Decent movie experience overall",
      "Mixed feelings about this cinema",
      "Average theatre with some good points",
      "Okay experience with minor issues",
      "Fair theatre with potential",
      "Not bad, but could be better",
      "Acceptable movie watching experience",
      "Decent facilities with some drawbacks",
      "Average cinema experience"
    ],
    contents: [
      "The theatre is generally good with decent picture and sound quality. The screen size is adequate and the projection is clear enough. However, the seats could be more comfortable and the legroom is a bit tight. The sound system works well but could be better balanced. The staff is friendly but sometimes slow in service. The food options are limited and a bit overpriced. The overall experience was okay but there's definitely room for improvement in several areas.",
      "Had a mixed experience at this theatre. The picture quality is good and the screen is reasonably sized. The audio quality is acceptable but not exceptional. The seating is comfortable enough but could use better cushioning. The staff is helpful but not very proactive. The food selection is basic and the prices are a bit high for what you get. The theatre is clean but the facilities could be more modern. Overall, it's an average theatre that meets basic expectations.",
      "This cinema has its strengths and weaknesses. The visual quality is good with clear projection and decent brightness. The sound system is functional but lacks the immersive quality of premium theatres. The seats are comfortable but the spacing could be better. The staff is courteous but sometimes seems understaffed. The food options are standard theatre fare with typical pricing. The facility is maintained but shows some signs of wear. It's a decent option for movie watching but not exceptional.",
      "Mixed feelings about this theatre. The picture quality is satisfactory and the screen size is adequate. The audio is clear but not particularly impressive. The seating is comfortable enough but lacks premium features. The staff is friendly but service can be slow during peak times. The food selection is limited and prices are on the higher side. The overall environment is clean but basic. It's an acceptable theatre that gets the job done but doesn't excel in any particular area.",
      "The theatre provides a decent movie experience with some notable aspects. The picture quality is good with clear projection and reasonable brightness. The sound system delivers clear audio but lacks depth. The seats are comfortable but could be more spacious. The staff is helpful but not always available when needed. The food options are standard with typical theatre pricing. The facility is clean but could use some updates. Overall, it's a functional theatre that meets basic needs."
    ],
    pros: [
      ["Good picture quality", "Clear audio", "Friendly staff"],
      ["Decent screen size", "Comfortable seating", "Clean environment"],
      ["Satisfactory projection", "Functional sound", "Helpful employees"],
      ["Adequate facilities", "Reasonable pricing", "Convenient location"],
      ["Good visual quality", "Clear dialogue", "Professional staff"],
      ["Decent amenities", "Clean restrooms", "Easy parking"],
      ["Acceptable quality", "Friendly service", "Good location"]
    ],
    cons: [
      ["Uncomfortable seats", "Expensive food", "Limited amenities"],
      ["Tight legroom", "Poor sound balance", "Slow service"],
      ["Basic facilities", "High prices", "Limited food options"],
      ["Old seating", "Average audio", "Understaffed"],
      ["Small screen", "Poor ventilation", "Expensive tickets"],
      ["Limited parking", "Crowded lobby", "Basic food"],
      ["Worn facilities", "Poor lighting", "Slow staff"]
    ]
  },
  negative: {
    titles: [
      "Very disappointing experience",
      "Not worth the money spent",
      "Poor quality theatre",
      "Avoid this cinema",
      "Terrible movie experience",
      "Worst theatre I've visited",
      "Extremely disappointing",
      "Not recommended at all",
      "Poor facilities and service",
      "Bad experience overall"
    ],
    contents: [
      "Very disappointing experience at this theatre. The picture quality was poor with blurry projection and dim brightness. The sound system was terrible with muffled audio and poor dialogue clarity. The seats were extremely uncomfortable with no cushioning and very little legroom. The staff was unhelpful and seemed disinterested in customer service. The food was overpriced and of poor quality. The entire facility was dirty and poorly maintained. The overall experience was terrible and I would not recommend this theatre to anyone.",
      "This is one of the worst theatres I've ever visited. The screen was small and the projection quality was abysmal with poor resolution and color reproduction. The audio system was completely broken with distorted sound and no clear dialogue. The seats were in terrible condition with broken springs and no comfort whatsoever. The staff was rude and unprofessional throughout our visit. The food was not only expensive but also tasted terrible. The theatre needs major renovations and better staff training.",
      "Terrible movie experience that was a complete waste of money. The picture was constantly blurry and the brightness was so low that it was hard to see anything clearly. The sound system was malfunctioning with crackling audio and no proper sound distribution. The seats were dirty, uncomfortable, and some were actually broken. The staff was completely unhelpful and seemed annoyed by customer requests. The facility was in poor condition with dirty floors and bad ventilation. I would strongly advise against visiting this theatre.",
      "Avoid this cinema at all costs. The facilities are completely outdated with old equipment that barely functions. The picture quality is so poor that it's hard to follow the movie. The sound system is broken with no clear audio and constant technical issues. The seats are uncomfortable and in terrible condition. The staff is unprofessional and provides no customer service. The food is expensive and of very poor quality. The entire experience was horrible and not worth the money spent.",
      "Very poor theatre with terrible facilities. The screen is small and the projection quality is awful with poor resolution and dim lighting. The sound system doesn't work properly with muffled audio and no clear dialogue. The seats are extremely uncomfortable with no padding and very little space. The staff is rude and unhelpful. The food is overpriced and tastes terrible. The facility is dirty and poorly maintained. The overall experience was extremely disappointing and I would never visit again."
    ],
    pros: [
      ["Close to home"],
      ["Cheap tickets"],
      ["Easy to reach"],
      ["No crowds"],
      ["Quick entry"]
    ],
    cons: [
      ["Poor picture quality", "Terrible sound system", "Uncomfortable seats", "Rude staff", "Dirty environment"],
      ["Small screen", "Broken audio", "Dirty seats", "Unhelpful employees", "Expensive food"],
      ["Blurry projection", "Malfunctioning sound", "Broken seating", "Poor service", "Bad ventilation"],
      ["Dim brightness", "Crackling audio", "Dirty facility", "Unprofessional staff", "Overpriced food"],
      ["Low resolution", "Muffled dialogue", "Worn equipment", "Rude employees", "Poor maintenance"],
      ["Bad color reproduction", "Distorted sound", "Broken chairs", "Slow service", "Dirty restrooms"],
      ["Poor projection", "No clear audio", "Uncomfortable seating", "Unhelpful staff", "Terrible food"]
    ]
  }
};

// Theatre quality assessment based on name and features
const getTheatreQuality = (theatre) => {
  const premiumKeywords = ['PVR', 'INOX', 'Cinepolis', 'IMAX', 'Luxe', 'Palazzo', 'Escape'];
  const budgetKeywords = ['Raj', 'Sapna', 'Tara', 'Shree', 'Lakshmi', 'Ganesh', 'Krishna'];
  
  const name = theatre.name.toLowerCase();
  
  if (premiumKeywords.some(keyword => name.includes(keyword.toLowerCase()))) {
    return 'premium';
  } else if (budgetKeywords.some(keyword => name.includes(keyword.toLowerCase()))) {
    return 'budget';
  } else {
    return 'standard';
  }
};

// Rating distribution based on theatre quality and user type
const getRatingDistribution = (theatreQuality, userType) => {
  const baseRatings = {
    'premium': { 5: 0.65, 4: 0.25, 3: 0.08, 2: 0.015, 1: 0.005 },
    'standard': { 5: 0.35, 4: 0.4, 3: 0.2, 2: 0.04, 1: 0.01 },
    'budget': { 5: 0.15, 4: 0.25, 3: 0.4, 2: 0.15, 1: 0.05 }
  };

  const userAdjustments = {
    'admin': { 5: -0.1, 4: -0.05, 3: 0.05, 2: 0.05, 1: 0.05 },
    'owner': { 5: 0.05, 4: 0.05, 3: 0, 2: -0.05, 1: -0.05 },
    'user': { 5: 0.05, 4: 0.05, 3: -0.05, 2: -0.02, 1: -0.03 }
  };

  const base = baseRatings[theatreQuality] || baseRatings['standard'];
  const adjustment = userAdjustments[userType] || userAdjustments['user'];

  const adjusted = {};
  Object.keys(base).forEach(rating => {
    adjusted[rating] = Math.max(0, Math.min(1, base[rating] + adjustment[rating]));
  });

  return adjusted;
};

// Generate realistic rating based on distribution
const generateRating = (theatreQuality, userType) => {
  const distribution = getRatingDistribution(theatreQuality, userType);
  const random = Math.random();
  let cumulative = 0;
  
  for (let rating = 1; rating <= 5; rating++) {
    cumulative += distribution[rating];
    if (random <= cumulative) {
      return rating;
    }
  }
  return 3; // fallback
};

// Generate review content based on rating
const generateReview = (rating, theatreQuality) => {
  let template;
  if (rating >= 4) {
    template = reviewTemplates.positive;
  } else if (rating >= 3) {
    template = reviewTemplates.mixed;
  } else {
    template = reviewTemplates.negative;
  }

  const title = template.titles[Math.floor(Math.random() * template.titles.length)];
  const content = template.contents[Math.floor(Math.random() * template.contents.length)];
  
  const pros = template.pros[Math.floor(Math.random() * template.pros.length)];
  const cons = template.cons[Math.floor(Math.random() * template.cons.length)];

  return { title, content, pros, cons };
};

// Generate visit date within last 6 months
const generateVisitDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

// Generate helpful votes based on review quality
const generateHelpfulVotes = (rating, reviewAge) => {
  const baseVotes = rating >= 4 ? Math.floor(Math.random() * 20) : 
                   rating >= 3 ? Math.floor(Math.random() * 10) : 
                   Math.floor(Math.random() * 5);
  
  const ageMultiplier = Math.min(3, 1 + (reviewAge / (30 * 24 * 60 * 60 * 1000)));
  return Math.floor(baseVotes * ageMultiplier);
};

// Generate theatre response
const generateTheatreResponse = (rating, theatreQuality, reviewAge) => {
  if (reviewAge < 24 * 60 * 60 * 1000) return null;
  
  const responseChance = rating <= 2 ? 0.8 : 
                        rating >= 4 ? 0.2 : 
                        0.5;
  
  if (Math.random() > responseChance) return null;

  const responses = {
    positive: [
      "Thank you for your wonderful feedback! We're delighted you enjoyed your experience and look forward to serving you again.",
      "We appreciate your kind words and are glad we could provide you with an excellent movie experience. Thank you for choosing us!",
      "Thank you for the positive review! Your satisfaction is our top priority and we're thrilled you had a great time.",
      "We're so happy you enjoyed your visit! Thank you for your feedback and we hope to see you again soon."
    ],
    mixed: [
      "Thank you for your feedback. We're constantly working to improve our services and appreciate your input.",
      "We value your review and will address the areas you mentioned. Thank you for helping us improve.",
      "Thank you for your honest feedback. We're committed to enhancing our services based on customer input.",
      "We appreciate your review and will work on the areas you highlighted. Thank you for your patience."
    ],
    negative: [
      "We sincerely apologize for your disappointing experience. Please contact us directly so we can address your concerns and make things right.",
      "We're very sorry you didn't have a good time. We'd like to make it up to you - please reach out to us for a resolution.",
      "We apologize for the issues you faced. We're working hard to improve our services and would appreciate another chance.",
      "We're sorry about your experience and take your feedback seriously. Please give us another opportunity to serve you better."
    ]
  };

  let responseType;
  if (rating >= 4) responseType = 'positive';
  else if (rating >= 3) responseType = 'mixed';
  else responseType = 'negative';

  const responseText = responses[responseType][Math.floor(Math.random() * responses[responseType].length)];
  
  return {
    content: responseText,
    respondedAt: new Date(Date.now() - Math.random() * reviewAge)
  };
};

const addComplexReviews = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    const users = await User.find({ role: 'user' });
    const theatres = await Theatre.find({});
    
    console.log(`Found ${users.length} normal users and ${theatres.length} theatres\n`);

    if (users.length === 0 || theatres.length === 0) {
      console.log('❌ Need both users and theatres to create reviews');
      return;
    }

    // Get existing reviews to avoid duplicates
    const existingReviews = await Review.find({});
    console.log(`Found ${existingReviews.length} existing reviews\n`);

    const reviewsToAdd = [];
    const cityMatchStats = { matched: 0, total: 0, reviewsCreated: 0 };

    users.forEach(user => {
      if (!user.city) {
        console.log(`⚠️  User ${user.name} has no city assigned, skipping`);
        return;
      }

      const cityTheatres = theatres.filter(t => t.city === user.city);
      
      if (cityTheatres.length === 0) {
        console.log(`⚠️  No theatres found in ${user.city} for user ${user.name}`);
        return;
      }

      cityMatchStats.total++;
      
      // Each user reviews 2-5 theatres in their city to ensure more coverage
      const numReviews = Math.floor(Math.random() * 4) + 2; // 2-5 reviews per user
      const selectedTheatres = cityTheatres
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(numReviews, cityTheatres.length));

      selectedTheatres.forEach(theatre => {
        // Check if this user has already reviewed this theatre
        const existingReview = existingReviews.find(r => 
          r.user.toString() === user._id.toString() && 
          r.theatre.toString() === theatre._id.toString()
        );
        
        if (existingReview) {
          console.log(`⚠️  User ${user.name} already reviewed ${theatre.name}, skipping`);
          return;
        }

        const theatreQuality = getTheatreQuality(theatre);
        const rating = generateRating(theatreQuality, user.role);
        const { title, content, pros, cons } = generateReview(rating, theatreQuality);
        const visitDate = generateVisitDate();
        const reviewAge = Date.now() - visitDate.getTime();
        const helpfulVotes = generateHelpfulVotes(rating, reviewAge);
        const theatreResponse = generateTheatreResponse(rating, theatreQuality, reviewAge);

        // Generate helpful votes (array of user IDs)
        const helpfulUsers = [];
        if (helpfulVotes > 0) {
          const potentialVoters = users.filter(u => u._id.toString() !== user._id.toString());
          const numVoters = Math.min(helpfulVotes, potentialVoters.length);
          const selectedVoters = potentialVoters
            .sort(() => 0.5 - Math.random())
            .slice(0, numVoters);
          helpfulUsers.push(...selectedVoters.map(v => v._id));
        }

        const review = {
          user: user._id,
          theatre: theatre._id,
          rating: rating,
          title: title,
          content: content,
          pros: pros,
          cons: cons,
          visitDate: visitDate,
          helpful: helpfulUsers,
          isVerified: Math.random() < 0.25, // 25% chance of being verified
          reviewerBadge: 'none', // Will be set by pre-save hook
          theatreResponse: theatreResponse ? {
            content: theatreResponse.content,
            respondedBy: theatre.admin,
            respondedAt: theatreResponse.respondedAt
          } : undefined,
          status: 'active',
          createdAt: new Date(visitDate.getTime() + Math.random() * (Date.now() - visitDate.getTime())),
          updatedAt: new Date()
        };

        reviewsToAdd.push(review);
        cityMatchStats.reviewsCreated++;
      });

      cityMatchStats.matched++;
    });

    console.log(`📊 CITY MATCHING STATISTICS:`);
    console.log(`Users with city matches: ${cityMatchStats.matched}/${cityMatchStats.total}`);
    console.log(`Reviews to create: ${cityMatchStats.reviewsCreated}\n`);

    if (reviewsToAdd.length === 0) {
      console.log('❌ No reviews to create');
      return;
    }

    console.log('🔧 CREATING COMPLEX REVIEWS...');
    const result = await Review.insertMany(reviewsToAdd);
    console.log(`✅ Successfully created ${result.length} complex reviews!\n`);

    // Detailed statistics
    console.log('📊 COMPLEX REVIEW STATISTICS:');
    console.log('='.repeat(50));

    // Rating distribution
    const ratingStats = {};
    result.forEach(r => ratingStats[r.rating] = (ratingStats[r.rating] || 0) + 1);

    console.log('\n⭐ RATING DISTRIBUTION:');
    Object.entries(ratingStats).sort(([a], [b]) => parseInt(a) - parseInt(b)).forEach(([rating, count]) => {
      const percentage = ((count / result.length) * 100).toFixed(1);
      console.log(`  ${rating} Star: ${count} reviews (${percentage}%)`);
    });

    // Theatre quality analysis
    const theatreQualityStats = {};
    result.forEach(review => {
      const theatre = theatres.find(t => t._id.toString() === review.theatre.toString());
      const quality = getTheatreQuality(theatre);
      if (!theatreQualityStats[quality]) {
        theatreQualityStats[quality] = { count: 0, totalRating: 0 };
      }
      theatreQualityStats[quality].count++;
      theatreQualityStats[quality].totalRating += review.rating;
    });

    console.log('\n🎭 THEATRE QUALITY ANALYSIS:');
    Object.entries(theatreQualityStats).forEach(([quality, stats]) => {
      const avgRating = (stats.totalRating / stats.count).toFixed(1);
      console.log(`  ${quality}: ${stats.count} reviews, Avg Rating: ${avgRating}/5`);
    });

    // Feature usage statistics
    const reviewsWithPros = result.filter(r => r.pros && r.pros.length > 0);
    const reviewsWithCons = result.filter(r => r.cons && r.cons.length > 0);
    const reviewsWithResponses = result.filter(r => r.theatreResponse && r.theatreResponse.content);
    const verifiedReviews = result.filter(r => r.isVerified);
    const totalHelpfulVotes = result.reduce((sum, r) => sum + (r.helpful?.length || 0), 0);

    console.log('\n📋 FEATURE USAGE:');
    console.log(`  Reviews with Pros: ${reviewsWithPros.length}/${result.length} (${((reviewsWithPros.length/result.length)*100).toFixed(1)}%)`);
    console.log(`  Reviews with Cons: ${reviewsWithCons.length}/${result.length} (${((reviewsWithCons.length/result.length)*100).toFixed(1)}%)`);
    console.log(`  Theatre Responses: ${reviewsWithResponses.length}/${result.length} (${((reviewsWithResponses.length/result.length)*100).toFixed(1)}%)`);
    console.log(`  Verified Reviews: ${verifiedReviews.length}/${result.length} (${((verifiedReviews.length/result.length)*100).toFixed(1)}%)`);
    console.log(`  Total Helpful Votes: ${totalHelpfulVotes}`);

    // City distribution
    const cityStats = {};
    result.forEach(review => {
      const user = users.find(u => u._id.toString() === review.user.toString());
      const city = user?.city || 'Unknown';
      if (!cityStats[city]) {
        cityStats[city] = { count: 0, totalRating: 0 };
      }
      cityStats[city].count++;
      cityStats[city].totalRating += review.rating;
    });

    console.log('\n🏙️  CITY DISTRIBUTION:');
    Object.entries(cityStats).forEach(([city, stats]) => {
      const avgRating = (stats.totalRating / stats.count).toFixed(1);
      console.log(`  ${city}: ${stats.count} reviews, Avg Rating: ${avgRating}/5`);
    });

    const totalReviews = await Review.countDocuments();
    console.log('\n📈 TOTAL DATABASE STATISTICS:');
    console.log(`Total reviews in database: ${totalReviews}`);

    // Theatre coverage analysis
    const theatreCoverage = {};
    const allReviews = await Review.find({}).populate('theatre', 'name city');
    allReviews.forEach(review => {
      const theatreName = review.theatre.name;
      if (!theatreCoverage[theatreName]) {
        theatreCoverage[theatreName] = 0;
      }
      theatreCoverage[theatreName]++;
    });

    console.log('\n🎭 THEATRE COVERAGE ANALYSIS:');
    const theatresWithoutReviews = theatres.filter(t => !theatreCoverage[t.name]);
    console.log(`Theatres with reviews: ${Object.keys(theatreCoverage).length}/${theatres.length}`);
    console.log(`Theatres without reviews: ${theatresWithoutReviews.length}`);
    
    if (theatresWithoutReviews.length > 0) {
      console.log('\nTheatres without reviews:');
      theatresWithoutReviews.forEach(t => console.log(`  - ${t.name} (${t.city})`));
    }

  } catch (error) {
    console.error('Error adding complex reviews:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addComplexReviews();
