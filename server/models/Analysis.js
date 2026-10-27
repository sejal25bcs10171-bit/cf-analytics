const mongoose = require('mongoose');

const tagStatSchema = new mongoose.Schema({
  tag: String,
  attempted: Number,
  solved: Number,
  ratio: Number,
});

const suggestionSchema = new mongoose.Schema({
  id: Number,
  index: String,
  name: String,
  rating: Number,
  tags: [String],
  url: String,
});

const ratingPointSchema = new mongoose.Schema({
  contestId: Number,
  contestName: String,
  rank: Number,
  ratingUpdateTimeSeconds: Number,
  oldRating: Number,
  newRating: Number,
});

const analysisSchema = new mongoose.Schema({
  handle: { type: String, required: true, unique: true },
  fetchedAt: { type: Date, default: Date.now },
  ratingHistory: [ratingPointSchema],
  tagStats: [tagStatSchema],
  suggestions: [suggestionSchema],
});

module.exports = mongoose.model('Analysis', analysisSchema);

