const mongoose = require('mongoose');

const IssueReportSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  recordType: {
    type: String,
    default: 'Issue Report',
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  severity: {
    type: String,
    enum: ['Normal', 'Urgent', 'Critical Food Safety Hazard'],
    default: 'Urgent',
    index: true,
  },
  incidentDate: {
    type: String,
    required: true,
    index: true,
  },
  mealPeriod: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner', 'General / Kitchen'],
    default: 'Lunch',
  },
  location: {
    type: String,
    required: true,
    default: 'Central Dining Hall',
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  evidence: {
    name: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
    dataUrl: { type: String, default: '' },
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  reporter: {
    fullName: { type: String, default: '' },
    erpNumber: { type: String, default: '' },
    rollNumber: { type: String, default: '' },
    hostelBlock: { type: String, default: '' },
    roomNumber: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['Open (Urgent)', 'Investigating', 'Action Taken & Resolved', 'Rejected'],
    default: 'Open (Urgent)',
    index: true,
  },
  verificationState: {
    type: String,
    enum: ['Unverified', 'Verified Legitimate', 'False Alarm'],
    default: 'Unverified',
    index: true,
  },
  assignedTo: {
    type: String,
    default: 'Mess Committee Head (Sujeet Kumar)',
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

module.exports = mongoose.model('IssueReport', IssueReportSchema);
