// src/components/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useSettings, checkOllamaStatus } from '../lib/api';

export default function SettingsPage({ onClose }) {
    const { settings, setSettings, loading, error } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);
    const [saving, setSaving] = useState(false);
    const [ollamaStatus, setOllamaStatus] = useState({ checked: false, isRunning: false });
    const [testingConnection, setTestingConnection] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        const result = await setSettings(localSettings);
        setSaving(false);
        
        if (result.success) {
            alert('Settings saved successfully!');
        } else {
            alert(`Failed to save settings: ${result.error}`);
        }
    };

    const testOllamaConnection = async () => {
        setTestingConnection(true);
        const result = await checkOllamaStatus(localSettings);
        setOllamaStatus({ checked: true, isRunning: result.isRunning });
        setTestingConnection(false);
    };

    const handleInputChange = (field, value) => {
        setLocalSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <div className="settings-overlay">
                <div className="settings-modal">
                    <div className="loading">Loading settings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-overlay">
            <div className="settings-modal">
                <div className="settings-header">
                    <h2>⚙️ Settings</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="settings-content">
                    {/* Provider Selection */}
                    <div className="setting-section">
                        <h3>AI Provider</h3>
                        <div className="radio-group">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="provider"
                                    value="ollama"
                                    checked={localSettings.preferred_provider === 'ollama'}
                                    onChange={(e) => handleInputChange('preferred_provider', e.target.value)}
                                />
                                <span>Ollama (Local)</span>
                                <small>Free, runs on your computer</small>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="provider"
                                    value="openai"
                                    checked={localSettings.preferred_provider === 'openai'}
                                    onChange={(e) => handleInputChange('preferred_provider', e.target.value)}
                                />
                                <span>OpenAI</span>
                                <small>Requires API key and credits</small>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="provider"
                                    value="anthropic"
                                    checked={localSettings.preferred_provider === 'anthropic'}
                                    onChange={(e) => handleInputChange('preferred_provider', e.target.value)}
                                />
                                <span>Anthropic Claude</span>
                                <small>Requires API key and credits</small>
                            </label>
                        </div>
                    </div>

                    {/* Ollama Settings */}
                    {localSettings.preferred_provider === 'ollama' && (
                        <div className="setting-section">
                            <h3>Ollama Configuration</h3>
                            
                            <div className="input-group">
                                <label>Ollama URL:</label>
                                <input
                                    type="text"
                                    value={localSettings.ollama_url}
                                    onChange={(e) => handleInputChange('ollama_url', e.target.value)}
                                    placeholder="http://localhost:11434"
                                />
                            </div>

                            <div className="input-group">
                                <label>Model:</label>
                                <select
                                    value={localSettings.ollama_model}
                                    onChange={(e) => handleInputChange('ollama_model', e.target.value)}
                                >
                                    <option value="llama3.1">Llama 3.1</option>
                                    <option value="llama3.1:8b">Llama 3.1:8B</option>
                                    <option value="llama3.1:70b">Llama 3.1:70B</option>
                                    <option value="codellama">Code Llama</option>
                                    <option value="mistral">Mistral</option>
                                    <option value="gemma">Gemma</option>
                                </select>
                            </div>

                            <div className="test-connection">
                                <button 
                                    className="test-btn"
                                    onClick={testOllamaConnection}
                                    disabled={testingConnection}
                                >
                                    {testingConnection ? 'Testing...' : 'Test Connection'}
                                </button>
                                {ollamaStatus.checked && (
                                    <span className={`status ${ollamaStatus.isRunning ? 'success' : 'error'}`}>
                                        {ollamaStatus.isRunning ? '✅ Connected' : '❌ Not connected'}
                                    </span>
                                )}
                            </div>

                            {ollamaStatus.checked && !ollamaStatus.isRunning && (
                                <div className="ollama-help">
                                    <p>💡 <strong>Ollama not running?</strong></p>
                                    <ol>
                                        <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener">ollama.ai</a></li>
                                        <li>Run: <code>ollama pull {localSettings.ollama_model}</code></li>
                                        <li>Start: <code>ollama serve</code></li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    )}

                    {/* OpenAI Settings */}
                    {localSettings.preferred_provider === 'openai' && (
                        <div className="setting-section">
                            <h3>OpenAI Configuration</h3>
                            
                            <div className="input-group">
                                <label>API Key:</label>
                                <input
                                    type="password"
                                    value={localSettings.openai_api_key}
                                    onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                                    placeholder="sk-..."
                                />
                                <small>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI Platform</a></small>
                            </div>
                        </div>
                    )}

                    {/* Anthropic Settings */}
                    {localSettings.preferred_provider === 'anthropic' && (
                        <div className="setting-section">
                            <h3>Anthropic Configuration</h3>
                            
                            <div className="input-group">
                                <label>API Key:</label>
                                <input
                                    type="password"
                                    value={localSettings.anthropic_api_key}
                                    onChange={(e) => handleInputChange('anthropic_api_key', e.target.value)}
                                    placeholder="sk-ant-..."
                                />
                                <small>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Anthropic Console</a></small>
                            </div>
                        </div>
                    )}
                </div>

                <div className="settings-footer">
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className="save-btn" 
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        Error: {error}
                    </div>
                )}
            </div>

            <style jsx>{`
                .settings-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .settings-modal {
                    background: white;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }

                .settings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 30px;
                    border-bottom: 2px solid #f1f5f9;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border-radius: 20px 20px 0 0;
                }

                .settings-header h2 {
                    margin: 0;
                    font-size: 1.8em;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 2em;
                    cursor: pointer;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.3s ease;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .settings-content {
                    padding: 30px;
                }

                .setting-section {
                    margin-bottom: 30px;
                }

                .setting-section h3 {
                    color: #333;
                    margin-bottom: 15px;
                    font-size: 1.3em;
                    border-bottom: 2px solid #e1e5e9;
                    padding-bottom: 8px;
                }

                .radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .radio-option {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 15px;
                    border: 2px solid #e1e5e9;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .radio-option:hover {
                    border-color: #667eea;
                    background: #f8fafc;
                }

                .radio-option input[type="radio"] {
                    margin: 0;
                }

                .radio-option span {
                    font-weight: 600;
                    color: #333;
                }

                .radio-option small {
                    display: block;
                    color: #666;
                    font-size: 0.9em;
                    margin-top: 2px;
                }

                .input-group {
                    margin-bottom: 20px;
                }

                .input-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }

                .input-group input, .input-group select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                }

                .input-group input:focus, .input-group select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .input-group small {
                    display: block;
                    margin-top: 5px;
                    color: #666;
                    font-size: 0.9em;
                }

                .input-group small a {
                    color: #667eea;
                    text-decoration: none;
                }

                .input-group small a:hover {
                    text-decoration: underline;
                }

                .test-connection {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-top: 15px;
                }

                .test-btn {
                    padding: 10px 20px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s ease;
                }

                .test-btn:hover:not(:disabled) {
                    background: #5a6fd8;
                }

                .test-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .status.success {
                    color: #10b981;
                    font-weight: 600;
                }

                .status.error {
                    color: #ef4444;
                    font-weight: 600;
                }

                .ollama-help {
                    background: #f0f9ff;
                    border: 1px solid #0ea5e9;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 15px;
                }

                .ollama-help p {
                    margin: 0 0 10px 0;
                    color: #0ea5e9;
                }

                .ollama-help ol {
                    margin: 0;
                    padding-left: 20px;
                }

                .ollama-help li {
                    margin-bottom: 5px;
                    color: #374151;
                }

                .ollama-help code {
                    background: #e1e5e9;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: monospace;
                }

                .settings-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    padding: 20px 30px;
                    border-top: 2px solid #f1f5f9;
                    background: #f8fafc;
                    border-radius: 0 0 20px 20px;
                }

                .cancel-btn, .save-btn {
                    padding: 12px 25px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .cancel-btn {
                    background: #f1f5f9;
                    color: #374151;
                }

                .cancel-btn:hover {
                    background: #e1e5e9;
                }

                .save-btn {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }

                .save-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                }

                .save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .error-message {
                    background: #fef2f2;
                    border: 1px solid #ef4444;
                    color: #dc2626;
                    padding: 10px 30px;
                    margin: 0;
                    border-radius: 0 0 20px 20px;
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
            `}</style>
        </div>
    );
}