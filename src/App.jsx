import React, { useState } from 'react';
import AIProvidersPage from './components/AIProvidersPage';
import UsageStatsPage from './components/UsageStatsPage';
import IdeaForge from './components/IdeaForge';
import GlobalCompass from './components/GlobalCompass';
import PitchPerfect from './components/PitchPerfect';
import PRDGenerator from './components/PRDGenerator';
import PromptManager from './components/PromptManager';

function App() {
  const [showAIProviders, setShowAIProviders] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showUsageStats, setShowUsageStats] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);

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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowAIProviders(true)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1em',
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
            🤖 AI Providers
          </button>
          <button 
            onClick={() => setShowPrompts(true)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1em',
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
            🧠 Prompts
          </button>
          <button 
            onClick={() => setShowUsageStats(true)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1em',
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
            📊 Usage
          </button>
        </div>
      </div>
      
      {/* Tools Grid */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        padding: '0 20px'
      }}>
        {/* Idea Forge Tool */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          color: '#333'
        }}
        onClick={() => setCurrentTool('idea-forge')}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        }}>
          <div style={{ fontSize: '3em', marginBottom: '15px' }}>🔥</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3em', fontWeight: '700' }}>Idea Forge</h3>
          <p style={{ margin: 0, color: '#666', lineHeight: '1.5' }}>
            Generate innovative business ideas with AI-powered brainstorming and creativity controls
          </p>
        </div>
        
        {/* Global Compass Tool */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          color: '#333'
        }}
        onClick={() => setCurrentTool('global-compass')}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        }}>
          <div style={{ fontSize: '3em', marginBottom: '15px' }}>🌍</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3em', fontWeight: '700' }}>Global Compass</h3>
          <p style={{ margin: 0, color: '#666', lineHeight: '1.5' }}>
            Analyze market opportunities across different regions with AI-driven insights
          </p>
        </div>
        
        {/* Pitch Perfect Tool */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          color: '#333'
        }}
        onClick={() => setCurrentTool('pitch-perfect')}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        }}>
          <div style={{ fontSize: '3em', marginBottom: '15px' }}>🎤</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3em', fontWeight: '700' }}>Pitch Perfect</h3>
          <p style={{ margin: 0, color: '#666', lineHeight: '1.5' }}>
            Perfect your pitch with AI coaching, scoring, and improvement suggestions
          </p>
        </div>
        
        {/* PRD Generator Tool */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          color: '#333'
        }}
        onClick={() => setCurrentTool('prd-generator')}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        }}>
          <div style={{ fontSize: '3em', marginBottom: '15px' }}>📋</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3em', fontWeight: '700' }}>PRD Generator</h3>
          <p style={{ margin: 0, color: '#666', lineHeight: '1.5' }}>
            Create comprehensive Product Requirements Documents through AI-guided workflows
          </p>
        </div>
      </div>
      
      {showAIProviders && (
        <AIProvidersPage onClose={() => setShowAIProviders(false)} />
      )}
      
      {showPrompts && (
        <PromptManager onClose={() => setShowPrompts(false)} />
      )}
      
      {showUsageStats && (
        <UsageStatsPage onClose={() => setShowUsageStats(false)} />
      )}
      
      {currentTool === 'idea-forge' && (
        <IdeaForge onClose={() => setCurrentTool(null)} />
      )}
      
      {currentTool === 'global-compass' && (
        <GlobalCompass onClose={() => setCurrentTool(null)} />
      )}
      
      {currentTool === 'pitch-perfect' && (
        <PitchPerfect onClose={() => setCurrentTool(null)} />
      )}
      
      {currentTool === 'prd-generator' && (
        <PRDGenerator onClose={() => setCurrentTool(null)} />
      )}
    </div>
  );
}

export default App;
