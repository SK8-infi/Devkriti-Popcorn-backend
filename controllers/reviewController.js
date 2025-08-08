import Review from '../models/Review.js';
import Theatre from '../models/Theatre.js';
import User from '../models/User.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { theatreId, rating, title, content, pros, cons, visitDate } = req.body;
    const userId = req.user._id;

    // Check if user already reviewed this theatre
    const existingReview = await Review.findOne({ user: userId, theatre: theatreId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this theatre' });
    }

    // Verify theatre exists
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found' });
    }

    const review = await Review.create({
      user: userId,
      theatre: theatreId,
      rating,
      title,
      content,
      pros: pros || [],
      cons: cons || [],
      visitDate: visitDate || new Date()
    });

    // Update theatre average rating
    await updateTheatreRating(theatreId);

    // Populate user info for response
    await review.populate('user', 'name email profilePicture');

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews for a specific theatre
export const getTheatreReviews = async (req, res) => {
  try {
    const { theatreId } = req.params;
    const { page = 1, limit = 10, sort = 'newest', rating, verified, badge } = req.query;

    const skip = (page - 1) * limit;
    let sortOption = { createdAt: -1 };

    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'helpful') sortOption = { 'helpful.length': -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    // Build filter query
    let filterQuery = { theatre: theatreId, status: 'active' };
    
    if (rating) {
      filterQuery.rating = parseInt(rating);
    }
    
    if (verified === 'true') {
      filterQuery.isVerified = true;
    }
    
    if (badge && badge !== 'all') {
      filterQuery.reviewerBadge = badge;
    }

    const reviews = await Review.find(filterQuery)
      .populate('user', 'name email profilePicture')
      .populate('theatreResponse.respondedBy', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filterQuery);

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

// Mark review as helpful
export const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const helpfulIndex = review.helpful.indexOf(userId);
    if (helpfulIndex > -1) {
      review.helpful.splice(helpfulIndex, 1);
    } else {
      review.helpful.push(userId);
    }

    await review.save();
    res.json({ success: true, helpful: review.helpful.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add theatre response to review
export const addTheatreResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Check if user is theatre owner/admin
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Only theatre owners can respond to reviews' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if theatre belongs to this user
    const theatre = await Theatre.findById(review.theatre);
    if (!theatre || theatre.admin.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only respond to reviews for your own theatre' });
    }

    review.theatreResponse = {
      content,
      respondedBy: userId,
      respondedAt: new Date()
    };

    await review.save();
    await review.populate('theatreResponse.respondedBy', 'name');

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: userId })
      .populate('theatre', 'name city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: userId });

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

// Update user's review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, content, pros, cons, visitDate } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own reviews' });
    }

    review.rating = rating;
    review.title = title;
    review.content = content;
    review.pros = pros || [];
    review.cons = cons || [];
    review.visitDate = visitDate || review.visitDate;

    await review.save();
    await updateTheatreRating(review.theatre);

    await review.populate('user', 'name email profilePicture');

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user's review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(reviewId);
    await updateTheatreRating(review.theatre);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get review analytics for admin
export const getReviewAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user is admin/owner
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get theatres owned by this user
    const theatres = await Theatre.find({ admin: userId });
    const theatreIds = theatres.map(t => t._id);

    // Get analytics for each theatre
    const analytics = await Promise.all(theatreIds.map(async (theatreId) => {
      const theatre = await Theatre.findById(theatreId);
      
      const reviews = await Review.find({ theatre: theatreId, status: 'active' });
      
      const ratingDistribution = {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length
      };

      const badgeDistribution = {
        none: reviews.filter(r => r.reviewerBadge === 'none').length,
        verified: reviews.filter(r => r.reviewerBadge === 'verified').length,
        frequent: reviews.filter(r => r.reviewerBadge === 'frequent').length,
        expert: reviews.filter(r => r.reviewerBadge === 'expert').length
      };

      const recentReviews = reviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      return {
        theatre: {
          _id: theatre._id,
          name: theatre.name,
          city: theatre.city
        },
        totalReviews: reviews.length,
        averageRating: avgRating,
        ratingDistribution,
        badgeDistribution,
        recentReviews: recentReviews.map(r => ({
          _id: r._id,
          rating: r.rating,
          title: r.title,
          createdAt: r.createdAt,
          reviewerBadge: r.reviewerBadge
        }))
      };
    }));

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to update theatre rating
const updateTheatreRating = async (theatreId) => {
  const reviews = await Review.find({ theatre: theatreId, status: 'active' });
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  await Theatre.findByIdAndUpdate(theatreId, {
    averageRating: avgRating,
    reviewCount: reviews.length
  });
}; 