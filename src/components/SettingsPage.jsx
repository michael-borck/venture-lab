import React, { useState, useEffect } from 'react';
import { 
    saveSettings, 
    loadSettings, 
    testProviderConnection,
    testCustomProviderConnection,
    listAvailableModels,
    DEFAULT_PROVIDERS,
    getUsageStats,
    getUsageHistory,
    clearUsageHistory,
    exportUsageData,
    saveFileToDownloads
} from '../lib/tauri_frontend_api';

export default function SettingsPage({ onClose }) {
    const [settings, setSettings] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState({});
    const [connectionStatus, setConnectionStatus] = useState({});
    const [availableModels, setAvailableModels] = useState({});
    
    // Usage tracking state
    const [usageStats, setUsageStats] = useState(null);
    const [usageHistory, setUsageHistory] = useState([]);
    const [usageLoading, setUsageLoading] = useState(false);
    const [usageTimePeriod, setUsageTimePeriod] = useState(30);
    const [activeUsageTab, setActiveUsageTab] = useState('overview');
    
    useEffect(() => {
        loadSettings().then(result => {
            if (result.success) {
                setSettings(result.data);
            } else {
                console.error('Failed to load settings:', result.error);
            }
            setLoading(false);
        });
    }, []);
    
    const testConnection = async (providerType) => {
        setTesting(prev => ({ ...prev, [providerType]: true }));
        
        try {
            // Create a test config with current form values instead of saved settings
            const currentConfig = {
                provider_type: providerType,
                api_key: settings[providerType]?.api_key || null,
                base_url: settings[providerType]?.base_url || DEFAULT_PROVIDERS[providerType]?.base_url,
                model: settings[providerType]?.model || DEFAULT_PROVIDERS[providerType]?.default_model,
                enabled: true
            };
            
            // Use testCustomProviderConnection with current form values
            const result = await testCustomProviderConnection(currentConfig);
            setConnectionStatus(prev => ({ 
                ...prev, 
                [providerType]: result 
            }));
            
            if (result.success && result.models) {
                setAvailableModels(prev => ({
                    ...prev,
                    [providerType]: result.models
                }));
            }
        } catch (error) {
            setConnectionStatus(prev => ({ 
                ...prev, 
                [providerType]: { 
                    success: false, 
                    error: error.toString() 
                } 
            }));
        } finally {
            setTesting(prev => ({ ...prev, [providerType]: false }));
        }
    };
    
    const updateProviderConfig = (providerType, field, value) => {
        setSettings(prev => ({
            ...prev,
            [providerType]: {
                ...prev[providerType],
                [field]: value
            }
        }));
    };

    // Usage tracking functions
    const loadUsageStats = async (days = null) => {
        setUsageLoading(true);
        try {
            const statsResult = await getUsageStats(days);
            if (statsResult.success) {
                setUsageStats(statsResult.data);
            }
            
            const historyResult = await getUsageHistory(50, 0);
            if (historyResult.success) {
                setUsageHistory(historyResult.data);
            }
        } catch (error) {
            console.error('Failed to load usage stats:', error);
        } finally {
            setUsageLoading(false);
        }
    };

    const handleClearUsageHistory = async () => {
        if (window.confirm('Are you sure you want to clear all usage history? This action cannot be undone.')) {
            const result = await clearUsageHistory();
            if (result.success) {
                setUsageStats(null);
                setUsageHistory([]);
                alert('Usage history cleared successfully.');
            } else {
                alert('Failed to clear usage history: ' + result.error);
            }
        }
    };

    const handleExportUsageData = async () => {
        try {
            const result = await exportUsageData();
            if (result.success) {
                const filename = `usage-data-${new Date().toISOString().split('T')[0]}.json`;
                const saveResult = await saveFileToDownloads(filename, JSON.stringify(result.data, null, 2));
                if (saveResult.success) {
                    alert(`Usage data exported to: ${saveResult.filePath}`);
                } else {
                    alert('Failed to save exported data: ' + saveResult.error);
                }
            } else {
                alert('Failed to export usage data: ' + result.error);
            }
        } catch (error) {
            alert('Error exporting usage data: ' + error.toString());
        }
    };

    // Load usage stats when component mounts
    useEffect(() => {
        loadUsageStats(usageTimePeriod);
    }, [usageTimePeriod]);

    // Helper functions for usage display
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const formatTokens = (tokens) => {
        if (!tokens && tokens !== 0) return '0';
        return formatNumber(tokens);
    };

    const getProviderColor = (provider) => {
        const colors = {
            openai: '#10b981',
            anthropic: '#f59e0b',
            gemini: '#3b82f6',
            ollama: '#8b5cf6',
            default: '#6b7280'
        };
        return colors[provider] || colors.default;
    };

    const getToolDisplayName = (tool) => {
        const toolNames = {
            'idea_forge': 'Idea Forge',
            'global_compass': 'Global Compass',
            'pitch_perfect': 'Pitch Perfect',
            'prd_generator': 'PRD Generator',
            'general': 'General',
            'unknown': 'Other'
        };
        return toolNames[tool] || tool;
    };

    const renderUsageCard = (title, value, subtitle, color = '#4facfe') => (
        <div style={{
            background: 'linear-gradient(135deg, white, #f8fafc)',
            border: `2px solid ${color}20`,
            borderRadius: '12px',
            padding: '20px',
            flex: 1,
            minWidth: '200px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: color, marginBottom: '5px' }}>
                {value}
            </div>
            <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>
                {title}
            </div>
            {subtitle && (
                <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                    {subtitle}
                </div>
            )}
        </div>
    );
    
    if (loading || !settings) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{ color: 'white', fontSize: '1.2em' }}>Loading settings...</div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                width: '95%',
                maxWidth: '900px',
                maxHeight: '95vh',
                overflow: 'auto',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '30px',
                    borderBottom: '2px solid #f1f5f9',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em' }}>⚙️ Settings</h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '2em',
                            cursor: 'pointer',
                            padding: 0,
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ color: '#333', marginBottom: '15px' }}>AI Provider</h3>
                        
                        {['ollama', 'openai', 'anthropic', 'gemini'].map(provider => {
                            const providerInfo = {
                                ollama: { name: 'Ollama (Local)', desc: 'Free, runs on your computer' },
                                openai: { name: 'OpenAI', desc: 'ChatGPT/GPT-4 - Requires API key' },
                                anthropic: { name: 'Anthropic', desc: 'Claude - Requires API key' },
                                gemini: { name: 'Google Gemini', desc: 'Gemini Pro - Requires API key' }
                            }[provider];
                            
                            return (
                                <label key={provider} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    padding: '15px', 
                                    border: '2px solid #e1e5e9', 
                                    borderRadius: '10px', 
                                    marginBottom: '10px',
                                    cursor: 'pointer',
                                    backgroundColor: settings.preferred_provider === provider ? '#f0f9ff' : 'white'
                                }}>
                                    <input
                                        type="radio"
                                        name="provider"
                                        value={provider}
                                        checked={settings.preferred_provider === provider}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            preferred_provider: e.target.value
                                        }))}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: '#333' }}>{providerInfo.name}</div>
                                        <div style={{ color: '#666', fontSize: '0.9em' }}>{providerInfo.desc}</div>
                                    </div>
                                    {connectionStatus[provider] && (
                                        <div style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.8em',
                                            fontWeight: '600',
                                            backgroundColor: connectionStatus[provider].success ? '#dcfce7' : '#fecaca',
                                            color: connectionStatus[provider].success ? '#166534' : '#991b1b'
                                        }}>
                                            {connectionStatus[provider].success ? '✓ Connected' : '✗ Failed'}
                                        </div>
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    {settings.preferred_provider !== 'ollama' && (
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#333', marginBottom: '15px' }}>
                                {settings.preferred_provider.charAt(0).toUpperCase() + settings.preferred_provider.slice(1)} Configuration
                            </h3>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                    API Key:
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="password"
                                        value={settings[settings.preferred_provider]?.api_key || ''}
                                        onChange={(e) => updateProviderConfig(settings.preferred_provider, 'api_key', e.target.value)}
                                        placeholder={settings.preferred_provider === 'openai' ? 'sk-...' : 'Enter API key'}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            border: '2px solid #e1e5e9',
                                            borderRadius: '8px',
                                            fontSize: '16px'
                                        }}
                                    />
                                    <button
                                        onClick={() => testConnection(settings.preferred_provider)}
                                        disabled={testing[settings.preferred_provider]}
                                        style={{
                                            padding: '12px 20px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            backgroundColor: '#4facfe',
                                            color: 'white',
                                            fontWeight: '600',
                                            cursor: testing[settings.preferred_provider] ? 'not-allowed' : 'pointer',
                                            opacity: testing[settings.preferred_provider] ? 0.6 : 1
                                        }}
                                    >
                                        {testing[settings.preferred_provider] ? 'Testing...' : 'Test Connection'}
                                    </button>
                                </div>
                                
                                {connectionStatus[settings.preferred_provider]?.error && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        backgroundColor: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        color: '#991b1b',
                                        fontSize: '0.9em'
                                    }}>
                                        {connectionStatus[settings.preferred_provider].error}
                                    </div>
                                )}
                                
                                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.9em' }}>
                                    {settings.preferred_provider === 'openai' && (
                                        <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI Platform</a></>
                                    )}
                                    {settings.preferred_provider === 'anthropic' && (
                                        <>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Anthropic Console</a></>
                                    )}
                                    {settings.preferred_provider === 'gemini' && (
                                        <>Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a></>
                                    )}
                                </small>
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                    Base URL:
                                </label>
                                <input
                                    type="text"
                                    value={settings[settings.preferred_provider]?.base_url || ''}
                                    onChange={(e) => updateProviderConfig(settings.preferred_provider, 'base_url', e.target.value)}
                                    placeholder={DEFAULT_PROVIDERS[settings.preferred_provider]?.base_url}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                />
                                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.9em' }}>
                                    Default: {DEFAULT_PROVIDERS[settings.preferred_provider]?.base_url}
                                </small>
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                    Model:
                                </label>
                                <select
                                    value={settings[settings.preferred_provider]?.model || ''}
                                    onChange={(e) => updateProviderConfig(settings.preferred_provider, 'model', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                >
                                    {(() => {
                                        const currentModel = settings[settings.preferred_provider]?.model;
                                        const models = availableModels[settings.preferred_provider] || [];
                                        
                                        // If current model is not in the list, add it as the first option
                                        if (currentModel && !models.includes(currentModel)) {
                                            return [
                                                <option key={currentModel} value={currentModel}>
                                                    {currentModel} (current)
                                                </option>,
                                                ...models.map(model => (
                                                    <option key={model} value={model}>{model}</option>
                                                ))
                                            ];
                                        }
                                        
                                        return models.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ));
                                    })()}
                                </select>
                            </div>
                        </div>
                    )}

                    {settings.preferred_provider === 'ollama' && (
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#333', marginBottom: '15px' }}>Ollama Configuration</h3>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                    Ollama URL:
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={settings.ollama?.base_url || ''}
                                        onChange={(e) => updateProviderConfig('ollama', 'base_url', e.target.value)}
                                        placeholder="http://localhost:11434"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            border: '2px solid #e1e5e9',
                                            borderRadius: '8px',
                                            fontSize: '16px'
                                        }}
                                    />
                                    <button
                                        onClick={() => testConnection('ollama')}
                                        disabled={testing.ollama}
                                        style={{
                                            padding: '12px 20px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            backgroundColor: '#4facfe',
                                            color: 'white',
                                            fontWeight: '600',
                                            cursor: testing.ollama ? 'not-allowed' : 'pointer',
                                            opacity: testing.ollama ? 0.6 : 1
                                        }}
                                    >
                                        {testing.ollama ? 'Testing...' : 'Test Connection'}
                                    </button>
                                </div>
                                
                                {connectionStatus.ollama?.error && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        backgroundColor: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        color: '#991b1b',
                                        fontSize: '0.9em'
                                    }}>
                                        {connectionStatus.ollama.error}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                    Model:
                                </label>
                                <select
                                    value={settings.ollama?.model || ''}
                                    onChange={(e) => updateProviderConfig('ollama', 'model', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                >
                                    {(() => {
                                        const currentModel = settings.ollama?.model;
                                        const models = availableModels.ollama || [];
                                        
                                        // If current model is not in the list, add it as the first option
                                        if (currentModel && !models.includes(currentModel)) {
                                            return [
                                                <option key={currentModel} value={currentModel}>
                                                    {currentModel} (current)
                                                </option>,
                                                ...models.map(model => (
                                                    <option key={model} value={model}>{model}</option>
                                                ))
                                            ];
                                        }
                                        
                                        return models.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ));
                                    })()}
                                </select>
                                {availableModels.ollama && (
                                    <small style={{ display: 'block', marginTop: '5px', color: '#10b981', fontSize: '0.9em' }}>
                                        ✓ Found {availableModels.ollama.length} local models
                                    </small>
                                )}
                            </div>

                            <div style={{
                                background: '#f0f9ff',
                                border: '1px solid #0ea5e9',
                                borderRadius: '8px',
                                padding: '15px',
                                marginTop: '15px'
                            }}>
                                <p style={{ margin: '0 0 10px 0', color: '#0ea5e9' }}>
                                    💡 <strong>Ollama Setup:</strong>
                                </p>
                                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li style={{ marginBottom: '5px', color: '#374151' }}>
                                        Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener">ollama.ai</a>
                                    </li>
                                    <li style={{ marginBottom: '5px', color: '#374151' }}>
                                        Run: <code style={{ background: '#e1e5e9', padding: '2px 6px', borderRadius: '4px' }}>
                                            ollama pull {settings.ollama?.model || 'llama3.1'}
                                        </code>
                                    </li>
                                    <li style={{ marginBottom: '5px', color: '#374151' }}>
                                        Start: <code style={{ background: '#e1e5e9', padding: '2px 6px', borderRadius: '4px' }}>
                                            ollama serve
                                        </code>
                                    </li>
                                    <li style={{ marginBottom: '5px', color: '#374151' }}>
                                        <strong>For remote servers:</strong> Change the URL above to your server (e.g., https://your-server.com)
                                    </li>
                                </ol>
                                <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '4px' }}>
                                    <small style={{ color: '#0c4a6e' }}>
                                        <strong>💡 Tip:</strong> You can use any Ollama-compatible server by changing the Base URL above.
                                    </small>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Usage Statistics Section */}
                    <div style={{ marginTop: '40px', marginBottom: '30px' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ color: '#333', margin: 0 }}>📊 Usage Statistics</h3>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <select
                                    value={usageTimePeriod}
                                    onChange={(e) => setUsageTimePeriod(parseInt(e.target.value))}
                                    style={{
                                        padding: '8px 12px',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value={7}>Last 7 days</option>
                                    <option value={30}>Last 30 days</option>
                                    <option value={null}>All time</option>
                                </select>
                                <button
                                    onClick={() => loadUsageStats(usageTimePeriod)}
                                    disabled={usageLoading}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        backgroundColor: '#4facfe',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: usageLoading ? 'not-allowed' : 'pointer',
                                        opacity: usageLoading ? 0.6 : 1
                                    }}
                                >
                                    {usageLoading ? '🔄' : '🔄 Refresh'}
                                </button>
                            </div>
                        </div>

                        {usageLoading ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#6b7280',
                                fontSize: '1.1em'
                            }}>
                                Loading usage statistics...
                            </div>
                        ) : usageStats ? (
                            <>
                                {/* Overview Cards */}
                                <div style={{
                                    display: 'flex',
                                    gap: '15px',
                                    marginBottom: '30px',
                                    flexWrap: 'wrap'
                                }}>
                                    {renderUsageCard(
                                        'Total API Calls',
                                        formatNumber(usageStats.total_requests || 0),
                                        usageTimePeriod ? `Last ${usageTimePeriod} days` : 'All time',
                                        '#4facfe'
                                    )}
                                    {renderUsageCard(
                                        'Input Tokens',
                                        formatTokens(usageStats.total_input_tokens || 0),
                                        'Tokens sent',
                                        '#10b981'
                                    )}
                                    {renderUsageCard(
                                        'Output Tokens',
                                        formatTokens(usageStats.total_output_tokens || 0),
                                        'Tokens received',
                                        '#f59e0b'
                                    )}
                                    {renderUsageCard(
                                        'Total Tokens',
                                        formatTokens((usageStats.total_input_tokens || 0) + (usageStats.total_output_tokens || 0)),
                                        'Combined usage',
                                        '#8b5cf6'
                                    )}
                                </div>

                                {/* Usage Breakdown Tabs */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '2px', marginBottom: '20px' }}>
                                        {['overview', 'providers', 'tools'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveUsageTab(tab)}
                                                style={{
                                                    padding: '10px 20px',
                                                    border: 'none',
                                                    borderRadius: activeUsageTab === tab ? '8px 8px 0 0' : '8px',
                                                    backgroundColor: activeUsageTab === tab ? '#4facfe' : '#f1f5f9',
                                                    color: activeUsageTab === tab ? 'white' : '#374151',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {tab === 'overview' ? '📈 Overview' : 
                                                 tab === 'providers' ? '🔧 By Provider' : 
                                                 '🛠️ By Tool'}
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{
                                        background: '#f8fafc',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '0 12px 12px 12px',
                                        padding: '20px',
                                        minHeight: '200px'
                                    }}>
                                        {activeUsageTab === 'overview' && (
                                            <div>
                                                <h4 style={{ color: '#333', marginTop: 0 }}>Recent Activity</h4>
                                                {usageHistory.length > 0 ? (
                                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        {usageHistory.slice(0, 10).map((entry, index) => (
                                                            <div key={index} style={{
                                                                background: 'white',
                                                                border: '1px solid #e1e5e9',
                                                                borderRadius: '8px',
                                                                padding: '12px',
                                                                marginBottom: '8px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', color: '#333' }}>
                                                                        {getToolDisplayName(entry.tool || 'unknown')}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                                                                        {entry.provider} • {new Date(entry.timestamp).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <div style={{ textAlign: 'right', fontSize: '0.9em' }}>
                                                                    <div style={{ color: '#10b981' }}>
                                                                        📥 {formatTokens(entry.input_tokens || 0)}
                                                                    </div>
                                                                    <div style={{ color: '#f59e0b' }}>
                                                                        📤 {formatTokens(entry.output_tokens || 0)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                                                        No usage history available
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeUsageTab === 'providers' && (
                                            <div>
                                                <h4 style={{ color: '#333', marginTop: 0 }}>Usage by Provider</h4>
                                                {usageStats.by_provider && Object.keys(usageStats.by_provider).length > 0 ? (
                                                    <div>
                                                        {Object.entries(usageStats.by_provider).map(([provider, stats]) => (
                                                            <div key={provider} style={{
                                                                background: 'white',
                                                                border: '1px solid #e1e5e9',
                                                                borderRadius: '8px',
                                                                padding: '15px',
                                                                marginBottom: '10px',
                                                                borderLeft: `4px solid ${getProviderColor(provider)}`
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    <div>
                                                                        <div style={{ 
                                                                            fontWeight: '600', 
                                                                            color: getProviderColor(provider),
                                                                            fontSize: '1.1em'
                                                                        }}>
                                                                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                                                                            {formatNumber(stats.requests)} requests
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div style={{ fontSize: '0.9em', color: '#10b981' }}>
                                                                            📥 {formatTokens(stats.input_tokens)}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.9em', color: '#f59e0b' }}>
                                                                            📤 {formatTokens(stats.output_tokens)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                                                        No provider usage data available
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeUsageTab === 'tools' && (
                                            <div>
                                                <h4 style={{ color: '#333', marginTop: 0 }}>Usage by Tool</h4>
                                                {usageStats.by_tool && Object.keys(usageStats.by_tool).length > 0 ? (
                                                    <div>
                                                        {Object.entries(usageStats.by_tool).map(([tool, stats]) => (
                                                            <div key={tool} style={{
                                                                background: 'white',
                                                                border: '1px solid #e1e5e9',
                                                                borderRadius: '8px',
                                                                padding: '15px',
                                                                marginBottom: '10px'
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    <div>
                                                                        <div style={{ 
                                                                            fontWeight: '600', 
                                                                            color: '#333',
                                                                            fontSize: '1.1em'
                                                                        }}>
                                                                            {getToolDisplayName(tool)}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                                                                            {formatNumber(stats.requests)} requests
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div style={{ fontSize: '0.9em', color: '#10b981' }}>
                                                                            📥 {formatTokens(stats.input_tokens)}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.9em', color: '#f59e0b' }}>
                                                                            📤 {formatTokens(stats.output_tokens)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                                                        No tool usage data available
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{
                                    display: 'flex',
                                    gap: '10px',
                                    justifyContent: 'center',
                                    marginTop: '20px'
                                }}>
                                    <button
                                        onClick={handleExportUsageData}
                                        style={{
                                            padding: '10px 20px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        📥 Export Data
                                    </button>
                                    <button
                                        onClick={handleClearUsageHistory}
                                        style={{
                                            padding: '10px 20px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        🗑️ Clear History
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#6b7280',
                                fontSize: '1.1em'
                            }}>
                                No usage statistics available yet. Start using the AI tools to see your usage data here!
                            </div>
                        )}
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '15px',
                    padding: '20px 30px',
                    borderTop: '2px solid #f1f5f9',
                    background: '#f8fafc',
                    borderRadius: '0 0 20px 20px'
                }}>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '12px 25px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            background: '#f1f5f9',
                            color: '#374151'
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={async () => {
                            setSaving(true);
                            try {
                                const result = await saveSettings(settings);
                                if (result.success) {
                                    // Test the active provider after saving
                                    await testConnection(settings.preferred_provider);
                                    onClose();
                                } else {
                                    alert('Failed to save settings: ' + result.error);
                                }
                            } catch (error) {
                                alert('Error saving settings: ' + error.toString());
                            } finally {
                                setSaving(false);
                            }
                        }}
                        disabled={saving}
                        style={{
                            padding: '12px 25px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            opacity: saving ? 0.6 : 1
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
