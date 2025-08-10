import MovieReview from '../models/MovieReview.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Create a new movie review
export const createMovieReview = async (req, res) => {
  try {
    const { movieId, rating, title, content, pros, cons, watchDate } = req.body;
    const userId = req.user._id;

    // Convert movieId to string (since Movie model uses String _id)
    const movieIdString = movieId.toString();

    // Check if user already reviewed this movie
    const existingReview = await MovieReview.findOne({ user: userId, movie: movieIdString });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this movie' });
    }

    // Verify movie exists
    const movie = await Movie.findById(movieIdString);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const review = await MovieReview.create({
      user: userId,
      movie: movieIdString,
      rating,
      title,
      content,
      pros: pros || [],
      cons: cons || [],
      watchDate: watchDate || new Date()
    });

    // Update movie average rating
    await updateMovieRating(movieIdString);

    // Populate user info for response
    await review.populate('user', 'name email profilePicture');

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews for a specific movie
export const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 10, sort = 'newest', rating } = req.query;

    // Convert movieId to string (since Movie model uses String _id)
    const movieIdString = movieId.toString();

    const skip = (page - 1) * limit;
    let sortOption = { createdAt: -1 };

    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'helpful') sortOption = { 'helpful.length': -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    // Build filter query
    let filterQuery = { movie: movieIdString, status: 'active' };
    
    if (rating) {
      filterQuery.rating = parseInt(rating);
    }

    const reviews = await MovieReview.find(filterQuery)
      .populate('user', 'name email profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MovieReview.countDocuments(filterQuery);

    res.json({
      success: true,
      reviews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasMore: skip + reviews.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Get user's movie reviews
export const getUserMovieReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const reviews = await MovieReview.find({ user: userId, status: 'active' })
      .populate('movie', 'title poster_path')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update movie review
export const updateMovieReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, content, pros, cons, watchDate } = req.body;
    const userId = req.user._id;

    const review = await MovieReview.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.rating = rating;
    review.title = title;
    review.content = content;
    review.pros = pros || [];
    review.cons = cons || [];
    review.watchDate = watchDate || review.watchDate;

    await review.save();

    // Update movie average rating
    await updateMovieRating(review.movie);

    await review.populate('user', 'name email profilePicture');
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete movie review
export const deleteMovieReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await MovieReview.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const movieId = review.movie;
    await review.deleteOne();

    // Update movie average rating
    await updateMovieRating(movieId);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get movie review analytics
export const getMovieReviewAnalytics = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Convert movieId to string (since Movie model uses String _id)
    const movieIdString = movieId.toString();

    const reviews = await MovieReview.find({ movie: movieIdString, status: 'active' });
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };

    res.json({
      success: true,
      analytics: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to update movie average rating
const updateMovieRating = async (movieId) => {
  try {
    const reviews = await MovieReview.find({ movie: movieId, status: 'active' });
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    await Movie.findByIdAndUpdate(movieId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating movie rating:', error);
  }
};
