import mongoose from 'mongoose';

const movieReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: String,
    ref: 'Movie',
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
  watchDate: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['active', 'hidden'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Prevent multiple reviews from same user for same movie
movieReviewSchema.index({ user: 1, movie: 1 }, { unique: true });

export default mongoose.model('MovieReview', movieReviewSchema);
