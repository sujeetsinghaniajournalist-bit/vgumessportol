const mongoose = require('mongoose');

const MealSlotSchema = new mongoose.Schema({
  dishName: { type: String, default: '' },
  available: { type: Boolean, default: true },
  remarks: { type: String, default: 'Weekly' },
  rotations: [
    {
      week: { type: String },
      dish: { type: String },
    }
  ],
}, { _id: false });

const DayScheduleSchema = new mongoose.Schema({
  Breakfast: { type: MealSlotSchema, default: () => ({}) },
  Lunch: { type: MealSlotSchema, default: () => ({}) },
  'Evening Snacks': { type: MealSlotSchema, default: () => ({}) },
  Dinner: { type: MealSlotSchema, default: () => ({}) },
}, { _id: false });

const WeeklyMenuSchema = new mongoose.Schema({
  weekLabel: {
    type: String,
    default: 'Official Mess Menu — Vivekananda Global University, Jaipur',
  },
  menuPublished: {
    type: Boolean,
    default: true,
  },
  schedule: {
    Monday: { type: DayScheduleSchema, default: () => ({}) },
    Tuesday: { type: DayScheduleSchema, default: () => ({}) },
    Wednesday: { type: DayScheduleSchema, default: () => ({}) },
    Thursday: { type: DayScheduleSchema, default: () => ({}) },
    Friday: { type: DayScheduleSchema, default: () => ({}) },
    Saturday: { type: DayScheduleSchema, default: () => ({}) },
    Sunday: { type: DayScheduleSchema, default: () => ({}) },
  },
  updatedBy: {
    type: String,
    default: 'Mess Committee Head (Sujeet Kumar)',
  },
  lastUpdatedIst: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WeeklyMenu', WeeklyMenuSchema);
