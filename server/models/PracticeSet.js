const mongoose = require('mongoose');

const practiceProblemSchema = new mongoose.Schema({
  contestId: Number,
  index: String,
  name: String,
  rating: Number,
  url: String,
  solved: { type: Boolean, default: false },
  solvedAt: { type: Date, default: null },
});

const practiceSetSchema = new mongoose.Schema({
  handle: { type: String, required: true, unique: true },
  tag: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  problems: [practiceProblemSchema],
  completionPct: { type: Number, default: 0 },
});

module.exports = mongoose.model('PracticeSet', practiceSetSchema);

