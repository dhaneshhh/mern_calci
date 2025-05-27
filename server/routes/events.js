const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create an event
router.post('/', async (req, res) => {
  try {
    if (!req.body.title || !req.body.startDateTime) {
      return res.status(400).json({ message: 'Title and start date-time are required' });
    }

    // Check for conflicts
    const conflictingEvent = await Event.findOne({
      _id: { $ne: req.body._id },
      startDateTime: req.body.startDateTime,
    });
    if (conflictingEvent) {
      return res.status(400).json({ message: 'Event conflicts with an existing event' });
    }

    const event = new Event({
      title: req.body.title,
      startDateTime: req.body.startDateTime,
      description: req.body.description,
      recurrence: req.body.recurrence || 'none',
      category: req.body.category || 'Work',
    });

    const newEvent = await event.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!req.body.title || !req.body.startDateTime) {
      return res.status(400).json({ message: 'Title and start date-time are required' });
    }

    // Check for conflicts
    const conflictingEvent = await Event.findOne({
      _id: { $ne: req.params.id },
      startDateTime: req.body.startDateTime,
    });
    if (conflictingEvent) {
      return res.status(400).json({ message: 'Event conflicts with an existing event' });
    }

    event.title = req.body.title;
    event.startDateTime = req.body.startDateTime;
    event.description = req.body.description || null;
    event.recurrence = req.body.recurrence || 'none';
    event.category = req.body.category || 'Work';

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;