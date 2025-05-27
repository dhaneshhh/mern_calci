const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDateTime: { type: String, required: true }, // e.g., "2025-05-26T14:00:00"
  description: { type: String },
  recurrence: { type: String, default: 'none' },
  category: { type: String, default: 'Work' },
});

module.exports = mongoose.model('Event', eventSchema);