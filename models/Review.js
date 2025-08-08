import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  theatre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theatre',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  pros: [{
    type: String,
    maxlength: 200
  }],
  cons: [{
    type: String,
    maxlength: 200
  }],
  visitDate: {
    type: Date,
    default: Date.now
  },
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  reviewerBadge: {
    type: String,
    enum: ['none', 'verified', 'frequent', 'expert'],
    default: 'none'
  },
  theatreResponse: {
    content: {
      type: String,
      maxlength: 1000
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: ['active', 'hidden'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Prevent multiple reviews from same user for same theatre
reviewSchema.index({ user: 1, theatre: 1 }, { unique: true });

// Update reviewer badge based on review count
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const userReviewCount = await mongoose.model('Review').countDocuments({ 
      user: this.user, 
      status: 'active' 
    });
    
    if (userReviewCount >= 50) {
      this.reviewerBadge = 'expert';
    } else if (userReviewCount >= 20) {
      this.reviewerBadge = 'frequent';
    } else if (userReviewCount >= 5) {
      this.reviewerBadge = 'verified';
    }
  }
  next();
});

export default mongoose.model('Review', reviewSchema); 