import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { RRule } from 'rrule';
import axios from 'axios';
import EventForm from './EventForm';

const Calendar = ({ searchQuery }) => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events');
        console.log('Fetched events:', response.data);
        setEvents(response.data);
      } catch (err) {
        console.error('Error fetching events:', err.message, err.response?.data);
      }
    };
    fetchEvents();
  }, []);

  // Generate recurring event instances
  const getRecurringEvents = (event) => {
    const recurrence = event.recurrence || 'none';
    console.log(`Processing event: ${event.title}, Recurrence: ${recurrence}, StartDateTime: ${event.startDateTime}`);

    // Normalize startDateTime: Remove any existing offset and ensure proper format
    let startDateTime = event.startDateTime;
    if (startDateTime.includes('+')) {
      startDateTime = startDateTime.split('+')[0]; // Remove offset (e.g., "+05:30")
    }
    if (!startDateTime.includes('T')) {
      startDateTime = `${startDateTime}T00:00:00`; // Add time if missing
    } else if (!startDateTime.includes(':')) {
      startDateTime = `${startDateTime}:00`; // Add seconds if missing
    }

    if (recurrence === 'none') {
      const singleEvent = {
        ...event,
        id: event._id,
        start: startDateTime,
        allDay: !event.startDateTime.includes('T') || event.startDateTime.endsWith('T00:00:00'),
      };
      console.log(`Non-recurring event:`, singleEvent);
      return [singleEvent];
    }

    const ruleOptions = {
      freq: {
        daily: RRule.DAILY,
        weekly: RRule.WEEKLY,
        monthly: RRule.MONTHLY,
      }[recurrence],
      dtstart: new Date(startDateTime),
      until: new Date(new Date(startDateTime).setDate(new Date(startDateTime).getDate() + 30)),
    };

    try {
      const rule = new RRule(ruleOptions);
      const instances = rule.all().map((date) => ({
        ...event,
        id: `${event._id}-${date.toISOString()}`,
        start: date.toISOString(),
        allDay: false,
      }));
      console.log(`Generated ${instances.length} instances for ${event.title}`);
      return instances;
    } catch (err) {
      console.error(`Error generating recurring instances for ${event.title}:`, err);
      return [{
        ...event,
        id: event._id,
        start: startDateTime,
        allDay: false,
      }];
    }
  };

  // Flatten all events with recurring instances
  const allEvents = events.flatMap(getRecurringEvents);
  console.log('All events:', allEvents);

  // Filter events by search query
  const filteredEvents = allEvents.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ).map((event) => ({
    ...event,
    backgroundColor: {
      Work: '#3b82f6',
      Personal: '#22c55e',
      Other: '#f97316',
    }[event.category],
    borderColor: {
      Work: '#2563eb',
      Personal: '#16a34a',
      Other: '#ea580c',
    }[event.category],
  }));
  console.log('Filtered events for FullCalendar:', filteredEvents);

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setSelectedEvent(null);
    setShowForm(true);
  };

  const handleEventClick = (arg) => {
    const originalEvent = events.find((e) => e._id === arg.event.id.split('-')[0]);
    setSelectedEvent(originalEvent);
    setShowForm(true);
  };

  const handleEventDrop = async (arg) => {
    const { event } = arg;
    const originalEventId = event.id.split('-')[0];
    const startDateTime = event.start.toISOString().split('+')[0]; // Remove offset

    // Conflict check
    const overlapping = allEvents.some(
      (e) =>
        e.id !== event.id &&
        e.id.split('-')[0] !== originalEventId &&
        new Date(e.start).getTime() === new Date(startDateTime).getTime()
    );
    if (overlapping) {
      alert('Event conflicts with another event!');
      arg.revert();
      return;
    }

    try {
      const updatedEvent = {
        ...events.find((e) => e._id === originalEventId),
        startDateTime: startDateTime,
      };

      const response = await axios.put(`http://localhost:5000/api/events/${originalEventId}`, updatedEvent);
      setEvents((prev) =>
        prev.map((e) => (e._id === originalEventId ? response.data : e))
      );
    } catch (err) {
      console.error('Error updating event:', err.message, err.response?.data);
      arg.revert();
    }
  };

  const handleSave = async (newEvent) => {
    console.log('Saving event:', newEvent);
    if (!newEvent.startDateTime) {
      alert('Start date and time are required!');
      return;
    }

    // Add seconds and IST offset if not already present
    let startDateTime = newEvent.startDateTime;
    if (!startDateTime.includes('T')) {
      startDateTime = `${startDateTime}T00:00:00`;
    } else if (!startDateTime.includes(':')) {
      startDateTime = `${startDateTime}:00`;
    }
    startDateTime = startDateTime.endsWith('Z') || startDateTime.includes('+')
      ? startDateTime
      : `${startDateTime}+05:30`;

    // Conflict check
    const overlapping = allEvents.some(
      (e) =>
        e._id !== newEvent._id &&
        new Date(e.start).getTime() === new Date(startDateTime).getTime()
    );
    if (overlapping) {
      alert('Event conflicts with another event!');
      return;
    }

    try {
      let response;
      if (newEvent._id) {
        // Update existing event
        response = await axios.put(`http://localhost:5000/api/events/${newEvent._id}`, {
          title: newEvent.title,
          startDateTime: startDateTime,
          description: newEvent.description,
          recurrence: newEvent.recurrence,
          category: newEvent.category,
        });
        setEvents((prev) =>
          prev.map((e) => (e._id === newEvent._id ? response.data : e))
        );
      } else {
        // Add new event
        response = await axios.post('http://localhost:5000/api/events', {
          title: newEvent.title,
          startDateTime: startDateTime,
          description: newEvent.description,
          recurrence: newEvent.recurrence || 'none',
          category: newEvent.category,
        });
        setEvents((prev) => [...prev, response.data]);
      }
      setShowForm(false);
    } catch (err) {
      console.error('Error saving event:', err.message, err.response?.data);
      alert(`Failed to save event: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/events/${selectedEvent._id}`);
      setEvents((prev) => prev.filter((e) => e._id !== selectedEvent._id));
      setShowForm(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Error deleting event:', err.message, err.response?.data);
      alert(`Failed to delete event: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={filteredEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        editable={true}
        selectable={true}
        eventContent={(arg) => (
          <div className="event-content">
            <b>{arg.event.title}</b>
            <p>
              {new Date(arg.event.start).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {arg.event.extendedProps.description && (
              <p>{arg.event.extendedProps.description}</p>
            )}
          </div>
        )}
      />
      {showForm && (
        <EventForm
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
      {selectedEvent && (
        <button onClick={handleDelete} className="delete">
          Delete Event
        </button>
      )}
    </div>
  );
};

export default Calendar;