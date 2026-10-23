const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  recordType: {
    type: String,
    default: 'Meal Review',
  },
  mealDate: {
    type: String,
    required: true,
    index: true,
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    index: true,
  },
  mealPeriod: {
    type: String,
    required: true,
    enum: ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner'],
    index: true,
  },
  dishName: {
    type: String,
    required: true,
    trim: true,
  },
  ratings: {
    foodQuality: { type: Number, min: 1, max: 5, default: 4 },
    taste: { type: Number, min: 1, max: 5, default: 4 },
    hygiene: { type: Number, min: 1, max: 5, default: 4 },
    portionSize: { type: Number, min: 1, max: 5, default: 4 },
    average: { type: Number, min: 1, max: 5, default: 4 },
  },
  problems: {
    type: [String],
    default: [],
  },
  severity: {
    type: String,
    enum: ['None', 'Low', 'Medium', 'High', 'Critical'],
    default: 'None',
  },
  isAnonymous: {
    type: Boolean,
    default: true,
  },
  student: {
    fullName: { type: String, default: '' },
    erpNumber: { type: String, default: '' },
    phone: { type: String, default: '' },
    rollNumber: { type: String, default: '' },
    hostelBlock: { type: String, default: '' },
    roomNumber: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  comments: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['Logged', 'Under Review', 'Resolved'],
    default: 'Logged',
    index: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resolutionNote: {
    type: String,
    default: '',
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: String,
    default: '',
  },
  timestampIst: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
