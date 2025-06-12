import React, { useState, useEffect } from 'react';
import { 
    saveSettings, 
    loadSettings, 
    testProviderConnection,
    testCustomProviderConnection,
    listAvailableModels,
    DEFAULT_PROVIDERS,
    storeApiKey,
    retrieveApiKey,
    deleteApiKey,
    checkApiKeyExists,
    getAllApiKeyStatus,
    testKeychainAccess
} from '../lib/tauri_frontend_api';

export default function EnhancedSettingsPage({ onClose }) {
    const [settings, setSettings] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState({});
    const [connectionStatus, setConnectionStatus] = useState({});
    const [availableModels, setAvailableModels] = useState({});
    const [apiKeyStatus, setApiKeyStatus] = useState({});
    const [tempApiKeys, setTempApiKeys] = useState({});
    const [showApiKey, setShowApiKey] = useState({});
    const [keychainTestResult, setKeychainTestResult] = useState(null);
    
    useEffect(() => {
        const initializeSettings = async () => {
            try {
                // Load settings
                const settingsResult = await loadSettings();
                if (settingsResult.success) {
                    setSettings(settingsResult.data);
                }
                
                // Load API key status
                const statusResult = await getAllApiKeyStatus();
                if (statusResult.success) {
                    setApiKeyStatus(statusResult.status);
                }
                
                // Test keychain access
                const keychainResult = await testKeychainAccess();
                setKeychainTestResult(keychainResult);
                
            } catch (error) {
                console.error('Failed to initialize settings:', error);
            } finally {
                setLoading(false);
            }
        };
        
        initializeSettings();
    }, []);
    
    const testConnection = async (providerType) => {
        setTesting(prev => ({ ...prev, [providerType]: true }));
        
        try {
            // Store temporary API key if one was entered
            if (tempApiKeys[providerType]) {
                await storeApiKey(providerType, tempApiKeys[providerType]);
                setTempApiKeys(prev => ({ ...prev, [providerType]: '' }));
                // Update API key status
                const statusResult = await getAllApiKeyStatus();
                if (statusResult.success) {
                    setApiKeyStatus(statusResult.status);
                }
            }
            
            // Create a test config with current form values
            const currentConfig = {
                provider_type: providerType,
                base_url: settings[providerType]?.base_url || DEFAULT_PROVIDERS[providerType]?.base_url,
                model: settings[providerType]?.model || DEFAULT_PROVIDERS[providerType]?.default_model,
                enabled: true
            };
            
            // Use testCustomProviderConnection
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
    
    const handleApiKeyDelete = async (providerType) => {
        try {
            await deleteApiKey(providerType);
            // Update API key status
            const statusResult = await getAllApiKeyStatus();
            if (statusResult.success) {
                setApiKeyStatus(statusResult.status);
            }
            setTempApiKeys(prev => ({ ...prev, [providerType]: '' }));
        } catch (error) {
            console.error('Failed to delete API key:', error);
        }
    };
    
    const getCostWarning = (providerType) => {
        const warnings = {
            openai: { icon: '💰', text: 'Pay-per-use pricing. Costs vary by model and usage.', level: 'warning' },
            anthropic: { icon: '💰', text: 'Pay-per-use pricing. Check Claude pricing for current rates.', level: 'warning' },
            gemini: { icon: '💡', text: 'Free tier available. Pay-per-use after limits.', level: 'info' },
            ollama: { icon: '🆓', text: 'Completely free. Runs locally on your hardware.', level: 'success' }
        };
        return warnings[providerType] || null;
    };
    
    const toggleApiKeyVisibility = (providerType) => {
        setShowApiKey(prev => ({ ...prev, [providerType]: !prev[providerType] }));
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
                maxWidth: '700px',
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
                    <h2 style={{ margin: 0, fontSize: '1.8em' }}>🛠️ VentureLab Settings</h2>
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
                    {!keychainTestResult?.success && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#991b1b'
                        }}>
                            <strong>⚠️ Keychain Access Issue:</strong> Unable to access secure storage. API keys may not be saved securely.
                            <br />
                            <small>Error: {keychainTestResult?.error}</small>
                        </div>
                    )}
                    
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            🤖 AI Provider:
                        </label>
                        <select
                            value={settings?.preferred_provider || 'ollama'}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                preferred_provider: e.target.value
                            }))}
                            style={{
                                width: '100%',
                                padding: '15px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '600',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="ollama">🔧 Ollama (Local) - Free, runs on your computer</option>
                            <option value="openai">🧠 OpenAI - ChatGPT/GPT-4 (Requires API key)</option>
                            <option value="anthropic">🎭 Anthropic - Claude (Requires API key)</option>
                            <option value="gemini">💎 Google Gemini - Gemini Pro (Requires API key)</option>
                        </select>
                        
                        {/* Cost Warning */}
                        {(() => {
                            const warning = getCostWarning(settings?.preferred_provider);
                            if (!warning) return null;
                            
                            const bgColor = {
                                warning: '#fef3c7',
                                info: '#dbeafe', 
                                success: '#d1fae5'
                            }[warning.level];
                            
                            const textColor = {
                                warning: '#92400e',
                                info: '#1e40af',
                                success: '#065f46'
                            }[warning.level];
                            
                            return (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '12px',
                                    backgroundColor: bgColor,
                                    borderRadius: '8px',
                                    border: `1px solid ${textColor}33`,
                                    fontSize: '0.9em'
                                }}>
                                    <span style={{ color: textColor }}>
                                        {warning.icon} <strong>Cost Info:</strong> {warning.text}
                                    </span>
                                </div>
                            );
                        })()}
                        
                        {/* Connection Status */}
                        {connectionStatus[settings?.preferred_provider] && (
                            <div style={{
                                marginTop: '10px',
                                padding: '12px',
                                borderRadius: '8px',
                                backgroundColor: connectionStatus[settings.preferred_provider].success ? '#dcfce7' : '#fecaca',
                                border: `1px solid ${connectionStatus[settings.preferred_provider].success ? '#16a34a' : '#dc2626'}`,
                                color: connectionStatus[settings.preferred_provider].success ? '#15803d' : '#dc2626'
                            }}>
                                <strong>
                                    {connectionStatus[settings.preferred_provider].success ? '✅ Connected' : '❌ Connection Failed'}
                                </strong>
                                {connectionStatus[settings.preferred_provider].error && (
                                    <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                                        {connectionStatus[settings.preferred_provider].error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {settings.preferred_provider !== 'ollama' && (
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#333', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                🔐 API Key Management
                                {apiKeyStatus[settings.preferred_provider]?.exists && (
                                    <span style={{
                                        fontSize: '0.7em',
                                        padding: '4px 8px',
                                        backgroundColor: '#dcfce7',
                                        color: '#166534',
                                        borderRadius: '12px',
                                        fontWeight: '600'
                                    }}>
                                        ✓ STORED SECURELY
                                    </span>
                                )}
                            </h3>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginBottom: '10px'
                                }}>
                                    <label style={{ fontWeight: '600', color: '#333', minWidth: '80px' }}>
                                        API Key:
                                    </label>
                                    {apiKeyStatus[settings.preferred_provider]?.exists ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                flex: 1,
                                                padding: '12px',
                                                backgroundColor: '#f0fdf4',
                                                border: '2px solid #bbf7d0',
                                                borderRadius: '8px',
                                                color: '#166534',
                                                fontWeight: '600'
                                            }}>
                                                🔒 API key stored securely in OS keychain
                                            </div>
                                            <button
                                                onClick={() => handleApiKeyDelete(settings.preferred_provider)}
                                                style={{
                                                    padding: '8px 12px',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#fca5a5',
                                                    color: '#991b1b',
                                                    fontSize: '0.8em',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                                title="Delete stored API key"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <input
                                                    type={showApiKey[settings.preferred_provider] ? 'text' : 'password'}
                                                    value={tempApiKeys[settings.preferred_provider] || ''}
                                                    onChange={(e) => setTempApiKeys(prev => ({
                                                        ...prev,
                                                        [settings.preferred_provider]: e.target.value
                                                    }))}
                                                    placeholder={settings.preferred_provider === 'openai' ? 'sk-...' : 'Enter API key'}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 45px 12px 12px',
                                                        border: '2px solid #e1e5e9',
                                                        borderRadius: '8px',
                                                        fontSize: '16px'
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleApiKeyVisibility(settings.preferred_provider)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1.2em',
                                                        color: '#666'
                                                    }}
                                                    title={showApiKey[settings.preferred_provider] ? 'Hide API key' : 'Show API key'}
                                                >
                                                    {showApiKey[settings.preferred_provider] ? '🙈' : '👁️'}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => testConnection(settings.preferred_provider)}
                                                disabled={testing[settings.preferred_provider] || !tempApiKeys[settings.preferred_provider]}
                                                style={{
                                                    padding: '12px 20px',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    backgroundColor: tempApiKeys[settings.preferred_provider] ? '#4facfe' : '#9ca3af',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    cursor: (testing[settings.preferred_provider] || !tempApiKeys[settings.preferred_provider]) ? 'not-allowed' : 'pointer',
                                                    opacity: testing[settings.preferred_provider] ? 0.6 : 1,
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {testing[settings.preferred_provider] ? 'Testing...' : 'Test & Save'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{
                                    padding: '10px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '6px',
                                    fontSize: '0.85em',
                                    color: '#475569'
                                }}>
                                    <div style={{ marginBottom: '5px' }}>
                                        <strong>🔒 Security:</strong> API keys are stored securely in your OS keychain
                                        (Windows Credential Manager, macOS Keychain, Linux Secret Service)
                                    </div>
                                    <div>
                                        <strong>🔗 Get API key:</strong>{' '}
                                        {settings.preferred_provider === 'openai' && (
                                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI Platform</a>
                                        )}
                                        {settings.preferred_provider === 'anthropic' && (
                                            <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Anthropic Console</a>
                                        )}
                                        {settings.preferred_provider === 'gemini' && (
                                            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>
                                        )}
                                    </div>
                                </div>
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
                            <h3 style={{ color: '#333', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                🔧 Ollama Configuration
                            </h3>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                    Server URL:
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
                                
                                {/* Bearer Token for Authenticated Ollama Servers */}
                                <div style={{ marginTop: '15px' }}>
                                    <details style={{ marginBottom: '10px' }}>
                                        <summary style={{ cursor: 'pointer', color: '#666', fontSize: '0.9em' }}>
                                            🔒 Authentication (for secure Ollama servers)
                                        </summary>
                                        <div style={{ marginTop: '10px', paddingLeft: '15px' }}>
                                            {apiKeyStatus.ollama?.exists ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        backgroundColor: '#f0fdf4',
                                                        border: '1px solid #bbf7d0',
                                                        borderRadius: '6px',
                                                        color: '#166534',
                                                        fontSize: '0.9em'
                                                    }}>
                                                        🔒 Bearer token stored securely
                                                    </div>
                                                    <button
                                                        onClick={() => handleApiKeyDelete('ollama')}
                                                        style={{
                                                            padding: '6px 10px',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#fca5a5',
                                                            color: '#991b1b',
                                                            fontSize: '0.8em',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="password"
                                                        value={tempApiKeys.ollama || ''}
                                                        onChange={(e) => setTempApiKeys(prev => ({ ...prev, ollama: e.target.value }))}
                                                        placeholder="Bearer token for authenticated server"
                                                        style={{
                                                            flex: 1,
                                                            padding: '8px',
                                                            border: '1px solid #d1d5db',
                                                            borderRadius: '4px',
                                                            fontSize: '14px'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            if (tempApiKeys.ollama) {
                                                                await storeApiKey('ollama', tempApiKeys.ollama);
                                                                setTempApiKeys(prev => ({ ...prev, ollama: '' }));
                                                                const statusResult = await getAllApiKeyStatus();
                                                                if (statusResult.success) {
                                                                    setApiKeyStatus(statusResult.status);
                                                                }
                                                            }
                                                        }}
                                                        disabled={!tempApiKeys.ollama}
                                                        style={{
                                                            padding: '8px 12px',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            backgroundColor: tempApiKeys.ollama ? '#4facfe' : '#9ca3af',
                                                            color: 'white',
                                                            fontSize: '0.8em',
                                                            cursor: tempApiKeys.ollama ? 'pointer' : 'not-allowed'
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            )}
                                            <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.8em' }}>
                                                Only needed for Ollama servers that require authentication
                                            </small>
                                        </div>
                                    </details>
                                </div>
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
                                // Save any pending API keys first
                                for (const [provider, key] of Object.entries(tempApiKeys)) {
                                    if (key) {
                                        await storeApiKey(provider, key);
                                    }
                                }
                                
                                const result = await saveSettings(settings);
                                if (result.success) {
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
                        title="Save all settings and API keys"
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
                        {saving ? '💾 Saving...' : '💾 Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}