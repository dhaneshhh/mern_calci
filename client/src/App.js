import React, { useState } from 'react';
import Calendar from './components/Calendar';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container">
      <h1>Event Calendar</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search events by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Calendar searchQuery={searchQuery} />
    </div>
  );
}

export default App;