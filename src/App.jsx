import React, { useState } from 'react';
import SettingsPage from './components/SettingsPage';

function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="App">
      <h1>Entrepreneurship AI Tools</h1>
      <button onClick={() => setShowSettings(true)}>
        Open Settings
      </button>
      
      {showSettings && (
        <SettingsPage onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
