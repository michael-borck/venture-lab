import React, { useState } from 'react';
import EnhancedSettingsPage from './components/EnhancedSettingsPage';

function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="App" style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '3em', 
          margin: '0 0 10px 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          🚀 VentureLab
        </h1>
        <p style={{ 
          fontSize: '1.2em', 
          opacity: 0.9,
          margin: '0 0 30px 0'
        }}>
          Where AI meets entrepreneurship
        </p>
        <button 
          onClick={() => setShowSettings(true)}
          style={{
            padding: '15px 30px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1em',
            fontWeight: '600',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ⚙️ Settings & Configuration
        </button>
      </div>
      
      {showSettings && (
        <EnhancedSettingsPage onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
