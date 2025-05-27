import React, { useState, useEffect } from 'react';
import '../styles.css';

const EventForm = ({ selectedDate, selectedEvent, onSave, onCancel }) => {
  const [event, setEvent] = useState({
    title: '',
    start: selectedDate || '',
    startTime: '',
    description: '',
    recurrence: 'none',
    category: 'Work',
  });

  useEffect(() => {
    if (selectedEvent) {
      setEvent({
        _id: selectedEvent._id,
        title: selectedEvent.title || '',
        start: selectedEvent.startDateTime ? selectedEvent.startDateTime.split('T')[0] : selectedEvent.start || '',
        startTime: selectedEvent.startDateTime ? selectedEvent.startDateTime.split('T')[1]?.slice(0, 5) : selectedEvent.startTime || '',
        description: selectedEvent.description || '',
        recurrence: selectedEvent.recurrence || 'none',
        category: selectedEvent.category || 'Work',
      });
    }
  }, [selectedEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!event.start) {
      alert('Start date is required!');
      return;
    }

    const startDateTime = event.startTime
      ? `${event.start}T${event.startTime}`
      : `${event.start}T00:00`;

    const eventToSave = {
      ...event,
      startDateTime: startDateTime,
    };
    console.log('Submitting event:', eventToSave);
    onSave(eventToSave);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{selectedEvent ? 'Edit Event' : 'Add Event'}</h2>
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={event.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Start Date:</label>
            <input
              type="date"
              name="start"
              value={event.start}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Start Time:</label>
            <input
              type="time"
              name="startTime"
              value={event.startTime}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={event.description}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Recurrence:</label>
            <select name="recurrence" value={event.recurrence} onChange={handleChange}>
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="form-group">
            <label>Category:</label>
            <select name="category" value={event.category} onChange={handleChange}>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="modal-buttons">
            <button type="submit" className="save">Save</button>
            <button type="button" onClick={onCancel} className="cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;