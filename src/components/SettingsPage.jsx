import React, { useState, useEffect } from 'react';
import { 
    saveSettings, 
    loadSettings, 
    testProviderConnection,
    testCustomProviderConnection,
    listAvailableModels,
    DEFAULT_PROVIDERS 
} from '../lib/tauri_frontend_api';

export default function SettingsPage({ onClose }) {
    const [settings, setSettings] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState({});
    const [connectionStatus, setConnectionStatus] = useState({});
    const [availableModels, setAvailableModels] = useState({});
    
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
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
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
                                    {availableModels[settings.preferred_provider] ? (
                                        availableModels[settings.preferred_provider].map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))
                                    ) : (
                                        DEFAULT_PROVIDERS[settings.preferred_provider]?.models.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))
                                    )}
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
                                    {availableModels.ollama ? (
                                        availableModels.ollama.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))
                                    ) : (
                                        DEFAULT_PROVIDERS.ollama.models.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))
                                    )}
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
