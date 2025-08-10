import mongoose from 'mongoose';
import 'dotenv/config';
import MovieReview from './models/MovieReview.js';
import Movie from './models/Movie.js';
import User from './models/User.js';

// Movie review templates with detailed content
const movieReviewTemplates = {
  excellent: {
    titles: [
      "Absolutely brilliant!",
      "A masterpiece of cinema",
      "Outstanding performance",
      "Must-watch movie",
      "Exceptional storytelling",
      "Cinematic perfection",
      "A true gem",
      "Incredible film",
      "Outstanding direction",
      "Perfect from start to finish"
    ],
    contents: [
      "This movie exceeded all my expectations! The storytelling was masterful, with a compelling narrative that kept me engaged from the very first scene to the last. The performances were absolutely outstanding - every actor brought their A-game and delivered authentic, emotionally resonant portrayals. The cinematography was breathtaking, with stunning visuals that enhanced the story perfectly. The direction was impeccable, with perfect pacing and excellent use of camera work. The soundtrack complemented the film beautifully, adding emotional depth to key moments. This is the kind of movie that stays with you long after the credits roll. Highly recommended for anyone who appreciates quality cinema!",
      "What an incredible cinematic experience! This film showcases the very best of what movies can achieve. The plot was brilliantly crafted with unexpected twists and turns that kept me on the edge of my seat. The character development was exceptional - I felt deeply connected to each character's journey. The visual effects were seamless and served the story perfectly. The dialogue was sharp, witty, and meaningful. The film's themes were handled with sensitivity and intelligence. The pacing was perfect, never feeling rushed or dragging. This is definitely one of the best films I've seen this year, and I can't wait to watch it again!",
      "A true masterpiece that deserves all the praise it receives! The film's narrative structure was innovative and engaging, keeping me guessing throughout. The performances were nothing short of extraordinary - each actor disappeared into their role completely. The production design was stunning, creating a world that felt both familiar and magical. The editing was flawless, with perfect timing and rhythm. The film tackles complex themes with nuance and intelligence. The emotional journey it takes you on is unforgettable. This is the kind of movie that reminds you why you love cinema. Absolutely brilliant in every aspect!",
      "This movie is a perfect example of what happens when every element of filmmaking comes together harmoniously. The script was intelligent and engaging, with dialogue that felt natural and meaningful. The performances were outstanding across the board - every actor brought depth and authenticity to their roles. The cinematography was beautiful, with every shot carefully composed to enhance the story. The soundtrack was perfectly chosen and integrated. The film's message was powerful and thought-provoking. The pacing was excellent, with perfect balance between action and character development. This is a film that will be remembered for years to come!",
      "An exceptional piece of cinema that showcases the very best of the medium! The storytelling was masterful, with a plot that was both original and compelling. The character arcs were beautifully developed, with each character having a meaningful journey. The performances were outstanding - every actor delivered nuanced, believable portrayals. The visual style was distinctive and beautiful. The film's themes were explored with depth and sensitivity. The emotional impact was profound and lasting. This is the kind of movie that makes you fall in love with cinema all over again. Absolutely outstanding!"
    ],
    pros: [
      ["Outstanding performances", "Brilliant storytelling", "Stunning cinematography", "Perfect pacing"],
      ["Exceptional direction", "Compelling narrative", "Beautiful visuals", "Emotional depth"],
      ["Masterful acting", "Innovative plot", "Seamless editing", "Powerful themes"],
      ["Perfect script", "Authentic characters", "Breathtaking scenes", "Memorable moments"],
      ["Outstanding production", "Engaging story", "Beautiful soundtrack", "Thought-provoking"]
    ],
    cons: [
      [],
      ["Ended too soon"],
      ["Wanted more"],
      ["Too perfect to find flaws"]
    ]
  },
  veryGood: {
    titles: [
      "Really enjoyed this movie",
      "Great film overall",
      "Highly recommended",
      "Solid entertainment",
      "Well-made movie",
      "Good watch",
      "Enjoyable experience",
      "Worth watching",
      "Quality film",
      "Good storytelling"
    ],
    contents: [
      "I really enjoyed this movie! The story was engaging and well-paced, keeping me interested throughout. The performances were strong, with the actors doing a great job bringing their characters to life. The cinematography was good, with some nice visual moments that enhanced the story. The direction was solid, with good pacing and effective use of camera work. The soundtrack was appropriate and added to the atmosphere. While not perfect, this is definitely a quality film that's worth watching. The characters were well-developed and relatable. Overall, a very good movie that I'd recommend to others.",
      "This was a solid, well-made film that delivered on its promises. The plot was interesting and had some nice twists that kept things engaging. The acting was good across the board, with believable performances that drew me into the story. The visual effects were well done and served the narrative effectively. The dialogue was natural and flowed well. The film had a good balance of action and character development. The pacing was generally good, though there were a few slower moments. The themes were handled appropriately. This is the kind of movie that provides good entertainment value and leaves you satisfied.",
      "A good movie that's definitely worth your time! The story was compelling and had enough depth to keep me engaged. The performances were strong, with the actors doing justice to their roles. The cinematography was competent and had some nice moments. The direction was steady and effective. The film managed to balance entertainment with substance well. The characters were interesting and had clear motivations. The plot had some nice surprises that kept things fresh. While it may not be groundbreaking, it's a solid piece of entertainment that delivers what it promises. Good value for money!",
      "This film was quite enjoyable and well-executed. The narrative was engaging and had a good structure that kept the story moving forward. The acting was good, with performances that felt authentic and engaging. The visual presentation was appealing, with good use of color and composition. The soundtrack was fitting and enhanced the mood appropriately. The film had a good mix of drama and lighter moments. The pacing was generally good, though there were a couple of slower sections. The ending was satisfying and tied things up well. Overall, a good movie that I'd recommend to others.",
      "A solid piece of entertainment that delivers on its premise! The story was interesting and had enough complexity to keep me engaged. The performances were good, with actors who seemed comfortable in their roles. The cinematography was competent and had some nice visual moments. The direction was steady and showed good understanding of the material. The film had a good balance of different elements. The characters were well-defined and had clear arcs. The plot had some nice developments that kept things interesting. While not perfect, this is definitely a movie worth watching."
    ],
    pros: [
      ["Good performances", "Engaging story", "Nice visuals", "Solid direction"],
      ["Interesting plot", "Well-acted", "Good pacing", "Enjoyable"],
      ["Strong characters", "Compelling narrative", "Good production", "Worth watching"],
      ["Quality acting", "Good storytelling", "Nice cinematography", "Entertaining"],
      ["Well-made", "Engaging plot", "Good performances", "Satisfying"]
    ],
    cons: [
      ["Some slow moments"],
      ["Could be better"],
      ["Minor issues"],
      ["Not perfect"],
      ["A few flaws"]
    ]
  },
  good: {
    titles: [
      "Decent movie",
      "Okay watch",
      "Not bad",
      "Acceptable",
      "Fair entertainment",
      "Average film",
      "Watchable",
      "Passable",
      "Decent enough",
      "Okay overall"
    ],
    contents: [
      "This was a decent movie that had its moments. The story was okay, though it could have been more engaging in places. The performances were adequate, with some actors doing better than others. The cinematography was functional but not particularly memorable. The direction was competent, though it lacked the flair that could have made it more interesting. The film had some good moments, but also some slower sections that dragged a bit. The characters were reasonably well-developed, though some could have been more interesting. Overall, it's watchable but not particularly memorable.",
      "An okay film that provides basic entertainment value. The plot was straightforward and easy to follow, though it lacked complexity. The acting was passable, with some performances being better than others. The visual presentation was adequate but not outstanding. The direction was competent but unremarkable. The film had some enjoyable moments, but also some parts that felt a bit dull. The pacing was uneven, with some sections moving too slowly. The characters were reasonably likable but not particularly memorable. It's the kind of movie you might watch once but probably wouldn't revisit.",
      "This movie was acceptable but not great. The story was simple and predictable, which made it easy to follow but not very engaging. The performances were mixed, with some actors doing better work than others. The cinematography was basic but functional. The direction was competent but lacked creativity. The film had some decent moments, but overall it felt a bit generic. The characters were okay but not particularly well-developed. The pacing was inconsistent, with some parts feeling rushed and others dragging. It's watchable but forgettable.",
      "A fair movie that meets basic expectations. The plot was straightforward and didn't offer many surprises. The acting was adequate, though nothing particularly impressive. The visual presentation was competent but unremarkable. The direction was steady but uninspired. The film had some okay moments, but overall it felt a bit bland. The characters were reasonably well-defined but not very interesting. The pacing was generally okay, though there were some slow sections. It's the kind of movie that provides basic entertainment but doesn't leave a lasting impression.",
      "This was a passable film that provides basic entertainment. The story was simple and easy to follow, though it lacked depth. The performances were okay, with some actors doing better than others. The cinematography was functional but not memorable. The direction was competent but unremarkable. The film had some decent moments, but overall it felt a bit generic. The characters were reasonably likable but not particularly well-developed. The pacing was generally okay, though there were some slower parts. It's watchable but not particularly memorable."
    ],
    pros: [
      ["Decent story", "Okay acting", "Watchable", "Basic entertainment"],
      ["Simple plot", "Passable performances", "Easy to follow", "Not terrible"],
      ["Acceptable", "Basic entertainment", "Watchable", "Okay"],
      ["Fair movie", "Decent enough", "Not bad", "Passable"],
      ["Okay overall", "Basic story", "Watchable", "Acceptable"]
    ],
    cons: [
      ["Generic plot", "Uninspired direction", "Slow pacing", "Forgettable"],
      ["Predictable story", "Mixed performances", "Bland visuals", "Unremarkable"],
      ["Lacks depth", "Basic direction", "Uneven pacing", "Generic"],
      ["Simple plot", "Uninspired", "Slow moments", "Forgettable"],
      ["Basic entertainment", "Lacks creativity", "Predictable", "Unremarkable"]
    ]
  },
  average: {
    titles: [
      "Mediocre at best",
      "Not very good",
      "Disappointing",
      "Below average",
      "Not worth it",
      "Poor quality",
      "Bad movie",
      "Terrible",
      "Awful",
      "Waste of time"
    ],
    contents: [
      "This movie was quite disappointing. The story was poorly developed and lacked coherence. The performances were weak, with actors who seemed disinterested in their roles. The cinematography was basic and uninspired. The direction was poor, with bad pacing and ineffective use of camera work. The film had very few redeeming qualities. The characters were poorly developed and unlikable. The plot was confusing and hard to follow. The pacing was terrible, with long boring sections. Overall, this was a waste of time and money.",
      "A really bad movie that fails on multiple levels. The plot was nonsensical and poorly written. The acting was terrible, with performances that felt fake and unconvincing. The visual presentation was amateurish and poorly executed. The direction was incompetent, with bad editing and poor pacing. The film had no redeeming qualities whatsoever. The characters were one-dimensional and uninteresting. The dialogue was cringe-worthy and poorly written. The pacing was awful, with the film feeling much longer than it actually was. Avoid this movie at all costs.",
      "This was one of the worst movies I've ever seen. The story was incomprehensible and made no sense. The performances were absolutely terrible, with actors who seemed to be reading their lines for the first time. The cinematography was amateurish and poorly executed. The direction was incompetent and showed no understanding of basic filmmaking. The film was a complete waste of time. The characters were unlikeable and poorly developed. The plot was confusing and poorly structured. The pacing was terrible, with the film dragging on forever. Do not watch this movie.",
      "A terrible film that fails in every aspect. The plot was poorly conceived and executed. The acting was atrocious, with performances that were painful to watch. The visual presentation was cheap and poorly done. The direction was incompetent and showed no skill. The film had no redeeming qualities. The characters were poorly written and unlikeable. The dialogue was terrible and unnatural. The pacing was awful, with the film feeling endless. This is the kind of movie that makes you question why you even bothered watching it.",
      "This movie was absolutely awful. The story was nonsensical and poorly written. The performances were terrible, with actors who seemed to have no talent whatsoever. The cinematography was amateurish and poorly executed. The direction was incompetent and showed no understanding of filmmaking. The film was a complete disaster. The characters were unlikeable and poorly developed. The plot was confusing and poorly structured. The pacing was terrible, with the film feeling much longer than it should have been. This is definitely one to avoid."
    ],
    pros: [
      ["It ended"],
      ["It's over"],
      ["No redeeming qualities"],
      ["Complete waste"],
      ["Terrible"]
    ],
    cons: [
      ["Terrible acting", "Poor plot", "Bad direction", "Waste of time", "Awful"],
      ["Nonsensical story", "Atrocious performances", "Amateurish", "Painful to watch", "Terrible"],
      ["Incomprehensible plot", "Terrible acting", "Poor execution", "Complete disaster", "Avoid"],
      ["Poorly written", "Bad performances", "Cheap production", "Waste of money", "Terrible"],
      ["Nonsensical", "Terrible acting", "Amateurish", "Complete waste", "Awful"]
    ]
  }
};

// Generate review content based on rating
const generateMovieReview = (rating) => {
  let template;
  if (rating >= 4.5) {
    template = movieReviewTemplates.excellent;
  } else if (rating >= 3.5) {
    template = movieReviewTemplates.veryGood;
  } else if (rating >= 2.5) {
    template = movieReviewTemplates.good;
  } else {
    template = movieReviewTemplates.average;
  }

  const title = template.titles[Math.floor(Math.random() * template.titles.length)];
  const content = template.contents[Math.floor(Math.random() * template.contents.length)];
  
  const pros = template.pros[Math.floor(Math.random() * template.pros.length)];
  const cons = template.cons[Math.floor(Math.random() * template.cons.length)];

  return { title, content, pros, cons };
};

// Generate watch date within last 6 months
const generateWatchDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

// Rating distribution based on movie quality
const getRatingDistribution = (movieVoteAverage) => {
  const baseRating = movieVoteAverage / 2; // Convert 10-point scale to 5-point scale
  
  // Adjust distribution based on movie quality
  if (baseRating >= 4) {
    return { 5: 0.6, 4: 0.3, 3: 0.08, 2: 0.015, 1: 0.005 };
  } else if (baseRating >= 3.5) {
    return { 5: 0.4, 4: 0.4, 3: 0.15, 2: 0.04, 1: 0.01 };
  } else if (baseRating >= 3) {
    return { 5: 0.2, 4: 0.4, 3: 0.3, 2: 0.08, 1: 0.02 };
  } else if (baseRating >= 2.5) {
    return { 5: 0.1, 4: 0.25, 3: 0.4, 2: 0.2, 1: 0.05 };
  } else {
    return { 5: 0.05, 4: 0.15, 3: 0.3, 2: 0.3, 1: 0.2 };
  }
};

// Generate realistic rating based on distribution
const generateRating = (movieVoteAverage) => {
  const distribution = getRatingDistribution(movieVoteAverage);
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

const addMovieReviews = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Get all movies and users
    const movies = await Movie.find({});
    const users = await User.find({ role: 'user' });
    const existingReviews = await MovieReview.find({});
    
    console.log(`Found ${movies.length} movies, ${users.length} users, ${existingReviews.length} existing reviews\n`);

    if (movies.length === 0 || users.length === 0) {
      console.log('❌ Need both movies and users to create reviews');
      return;
    }

    const reviewsToAdd = [];

    movies.forEach(movie => {
      console.log(`🎬 Processing movie: ${movie.title}`);
      
      // Generate 5-6 reviews per movie
      const numReviews = Math.floor(Math.random() * 2) + 5; // 5-6 reviews
      
      // Select random users for this movie's reviews
      const shuffledUsers = users.sort(() => 0.5 - Math.random());
      const selectedUsers = shuffledUsers.slice(0, numReviews);

      selectedUsers.forEach(user => {
        // Check if this user has already reviewed this movie
        const existingReview = existingReviews.find(r => 
          r.user.toString() === user._id.toString() && 
          r.movie === movie._id
        );
        
        if (existingReview) {
          console.log(`  ⚠️  User ${user.name} already reviewed ${movie.title}, skipping`);
          return;
        }

        // Generate rating based on movie quality
        const rating = generateRating(movie.vote_average);
        const { title, content, pros, cons } = generateMovieReview(rating);
        const watchDate = generateWatchDate();

        const review = {
          user: user._id,
          movie: movie._id,
          rating: rating,
          title: title,
          content: content,
          pros: pros,
          cons: cons,
          watchDate: watchDate,
          status: 'active'
        };

        reviewsToAdd.push(review);
        console.log(`    Added review: ${user.name} - ${rating}/5 stars`);
      });
    });

    console.log(`\n📝 CREATING MOVIE REVIEWS...`);
    console.log(`Total reviews to create: ${reviewsToAdd.length}`);

    if (reviewsToAdd.length === 0) {
      console.log('❌ No reviews to create');
      return;
    }

    // Insert reviews in batches
    const batchSize = 20;
    let insertedCount = 0;
    
    for (let i = 0; i < reviewsToAdd.length; i += batchSize) {
      const batch = reviewsToAdd.slice(i, i + batchSize);
      const result = await MovieReview.insertMany(batch, { ordered: false });
      insertedCount += result.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${result.length} reviews`);
    }

    console.log(`\n🎉 Successfully created ${insertedCount} movie reviews!`);

    // Statistics
    const totalReviews = await MovieReview.countDocuments();
    console.log(`\n📊 MOVIE REVIEW STATISTICS:`);
    console.log(`Total movie reviews in database: ${totalReviews}`);

    // Movie review distribution
    console.log('\n🎬 REVIEWS PER MOVIE:');
    const movieStats = {};
    reviewsToAdd.forEach(review => {
      const movieId = review.movie;
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
          console.log(`  ${movie.title}: ${count} reviews`);
        }
      });

    // Rating distribution
    console.log('\n⭐ RATING DISTRIBUTION:');
    const ratingStats = {};
    reviewsToAdd.forEach(review => {
      const rating = review.rating;
      if (!ratingStats[rating]) {
        ratingStats[rating] = 0;
      }
      ratingStats[rating]++;
    });

    Object.entries(ratingStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([rating, count]) => {
        const percentage = ((count / reviewsToAdd.length) * 100).toFixed(1);
        console.log(`  ${rating} Star: ${count} reviews (${percentage}%)`);
      });

    // User review distribution
    console.log('\n👥 REVIEWS PER USER:');
    const userStats = {};
    reviewsToAdd.forEach(review => {
      const userId = review.user.toString();
      if (!userStats[userId]) {
        userStats[userId] = 0;
      }
      userStats[userId]++;
    });

    Object.entries(userStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([userId, count]) => {
        const user = users.find(u => u._id.toString() === userId);
        if (user) {
          console.log(`  ${user.name}: ${count} reviews`);
        }
      });

    // Genre analysis
    console.log('\n🎭 REVIEWS BY MOVIE QUALITY:');
    const qualityStats = {};
    reviewsToAdd.forEach(review => {
      const movie = movies.find(m => m._id === review.movie);
      if (movie) {
        const quality = movie.vote_average >= 7 ? 'High' : 
                       movie.vote_average >= 5 ? 'Medium' : 'Low';
        if (!qualityStats[quality]) {
          qualityStats[quality] = { count: 0, totalRating: 0 };
        }
        qualityStats[quality].count++;
        qualityStats[quality].totalRating += review.rating;
      }
    });

    Object.entries(qualityStats).forEach(([quality, stats]) => {
      const avgRating = (stats.totalRating / stats.count).toFixed(1);
      console.log(`  ${quality} Quality Movies: ${stats.count} reviews, Avg Rating: ${avgRating}/5`);
    });

    // Feature usage
    console.log('\n📋 FEATURE USAGE:');
    const reviewsWithPros = reviewsToAdd.filter(r => r.pros && r.pros.length > 0);
    const reviewsWithCons = reviewsToAdd.filter(r => r.cons && r.cons.length > 0);

    console.log(`  Reviews with Pros: ${reviewsWithPros.length}/${reviewsToAdd.length} (${((reviewsWithPros.length/reviewsToAdd.length)*100).toFixed(1)}%)`);
    console.log(`  Reviews with Cons: ${reviewsWithCons.length}/${reviewsToAdd.length} (${((reviewsWithCons.length/reviewsToAdd.length)*100).toFixed(1)}%)`);

  } catch (error) {
    console.error('Error adding movie reviews:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addMovieReviews();
