import React, { useState, useEffect } from 'react';
import { usePrompts, replacePromptVariables, exportPrompts, importPrompts, saveFileToDownloads } from '../lib/tauri_frontend_api';

export default function PromptManager({ onClose }) {
    const { prompts, savePrompt, resetPrompt, loading, error } = usePrompts();
    const [activeTab, setActiveTab] = useState('idea_forge');
    const [editingPrompts, setEditingPrompts] = useState({});
    const [showPreview, setShowPreview] = useState({});
    const [sampleVariables, setSampleVariables] = useState({});
    const [saveStatus, setSaveStatus] = useState({});
    const [importExportMessage, setImportExportMessage] = useState('');

    const tools = [
        { id: 'idea_forge', name: '🔥 Idea Forge', color: '#ff6b6b' },
        { id: 'global_compass', name: '🌍 Global Compass', color: '#4facfe' },
        { id: 'pitch_perfect', name: '🎤 Pitch Perfect', color: '#ff9a9e' },
        { id: 'prd_generator', name: '📋 PRD Generator', color: '#a8edea' }
    ];

    useEffect(() => {
        // Initialize editing prompts and sample variables when prompts load
        if (prompts && Object.keys(prompts).length > 0) {
            const initialEditingPrompts = {};
            const initialSampleVars = {};
            
            Object.entries(prompts).forEach(([toolId, prompt]) => {
                initialEditingPrompts[toolId] = prompt.template;
                
                // Generate sample values for variables
                const vars = {};
                prompt.variables.forEach(v => {
                    vars[v.name] = v.example;
                });
                initialSampleVars[toolId] = vars;
            });
            
            setEditingPrompts(initialEditingPrompts);
            setSampleVariables(initialSampleVars);
        }
    }, [prompts]);

    const handlePromptChange = (toolId, value) => {
        setEditingPrompts(prev => ({ ...prev, [toolId]: value }));
        setSaveStatus(prev => ({ ...prev, [toolId]: null }));
    };

    const handleVariableChange = (toolId, varName, value) => {
        setSampleVariables(prev => ({
            ...prev,
            [toolId]: { ...prev[toolId], [varName]: value }
        }));
    };

    const handleSavePrompt = async (toolId) => {
        const currentPrompt = prompts[toolId];
        if (!currentPrompt) return;

        const updatedPrompt = {
            ...currentPrompt,
            template: editingPrompts[toolId],
            is_custom: true,
            updated_at: new Date().toISOString()
        };

        const result = await savePrompt(toolId, updatedPrompt);
        if (result.success) {
            setSaveStatus(prev => ({ ...prev, [toolId]: 'saved' }));
            setTimeout(() => {
                setSaveStatus(prev => ({ ...prev, [toolId]: null }));
            }, 2000);
        } else {
            setSaveStatus(prev => ({ ...prev, [toolId]: 'error' }));
        }
    };

    const handleResetPrompt = async (toolId) => {
        if (window.confirm(`Are you sure you want to reset the ${prompts[toolId]?.name} prompt to default?`)) {
            const result = await resetPrompt(toolId);
            if (result.success) {
                // Reset the editing prompt to the default
                setEditingPrompts(prev => ({ ...prev, [toolId]: prompts[toolId].template }));
                setSaveStatus(prev => ({ ...prev, [toolId]: 'reset' }));
                setTimeout(() => {
                    setSaveStatus(prev => ({ ...prev, [toolId]: null }));
                }, 2000);
            }
        }
    };

    const handleExportPrompts = async () => {
        const result = await exportPrompts();
        if (result.success && result.data) {
            const filename = `venturelab-prompts-${Date.now()}.json`;
            const saveResult = await saveFileToDownloads(filename, result.data);
            if (saveResult.success) {
                setImportExportMessage(`Prompts exported to: ${saveResult.filePath}`);
                setTimeout(() => setImportExportMessage(''), 3000);
            }
        }
    };

    const handleImportPrompts = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const result = await importPrompts(event.target.result);
                        if (result.success) {
                            setImportExportMessage('Prompts imported successfully!');
                            setTimeout(() => setImportExportMessage(''), 3000);
                            // Reload window to refresh prompts
                            window.location.reload();
                        }
                    } catch (error) {
                        setImportExportMessage('Failed to import prompts: Invalid format');
                        setTimeout(() => setImportExportMessage(''), 3000);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const highlightVariables = (text) => {
        // Simple syntax highlighting for variables
        return text.replace(/\{([^}]+)\}/g, '<span class="variable-highlight">{$1}</span>');
    };

    const renderPreview = (toolId) => {
        const prompt = prompts[toolId];
        if (!prompt || !showPreview[toolId]) return null;

        const vars = sampleVariables[toolId] || {};
        const previewText = replacePromptVariables(editingPrompts[toolId] || '', vars);

        return (
            <div style={{
                marginTop: '20px',
                padding: '20px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e1e5e9'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>📝 Preview with Sample Values:</h4>
                <div style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    color: '#1e293b',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {previewText}
                </div>
            </div>
        );
    };

    if (loading) {
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
                <div style={{ color: 'white', fontSize: '1.2em' }}>Loading prompts...</div>
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
            zIndex: 1000,
            padding: '20px'
        }}>
            <style>
                {`
                    .variable-highlight {
                        color: #667eea;
                        background: rgba(102, 126, 234, 0.1);
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-weight: 600;
                    }
                    
                    .prompt-textarea {
                        width: 100%;
                        min-height: 250px;
                        padding: 15px;
                        border: 2px solid #e1e5e9;
                        border-radius: 12px;
                        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
                        font-size: 13px;
                        line-height: 1.5;
                        resize: vertical;
                        transition: border-color 0.3s ease;
                        box-sizing: border-box;
                    }
                    
                    .prompt-textarea:focus {
                        outline: none;
                        border-color: #667eea;
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    }
                    
                    .tab-button {
                        padding: 12px 24px;
                        background: #e2e8f0;
                        border: 2px solid #cbd5e1;
                        border-radius: 12px 12px 0 0;
                        color: #475569;
                        cursor: pointer;
                        font-size: 1em;
                        font-weight: 600;
                        position: relative;
                        transition: all 0.3s ease;
                        white-space: nowrap;
                        margin-right: 4px;
                        margin-bottom: 0;
                        box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
                    }
                    
                    .tab-button:hover {
                        background: #f1f5f9;
                        color: #1e293b;
                        box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
                    }
                    
                    .tab-button.active {
                        background: white;
                        color: #667eea;
                        border-color: #667eea;
                        border-width: 2px;
                        box-shadow: 0 -4px 12px rgba(102, 126, 234, 0.2);
                        z-index: 10;
                    }
                `}
            </style>

            <div style={{
                background: 'white',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '1000px',
                maxHeight: '85vh',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 30px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8em' }}>🧠 Prompt Manager</h2>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Customize AI prompts for each tool</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button 
                            onClick={handleExportPrompts}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '0.9em',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                        >
                            📤 Export
                        </button>
                        <button 
                            onClick={handleImportPrompts}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '0.9em',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                        >
                            📥 Import
                        </button>
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
                </div>

                {/* Import/Export Message */}
                {importExportMessage && (
                    <div style={{
                        padding: '10px 20px',
                        background: '#10b981',
                        color: 'white',
                        textAlign: 'center',
                        fontSize: '0.9em'
                    }}>
                        {importExportMessage}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div style={{
                        margin: '20px',
                        padding: '15px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#991b1b'
                    }}>
                        <strong>⚠️ Error:</strong> {error}
                    </div>
                )}

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    padding: '15px 30px 0',
                    paddingBottom: '10px',
                    minHeight: '60px',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)',
                    position: 'relative',
                    alignItems: 'flex-end'
                }}>
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            className={`tab-button ${activeTab === tool.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tool.id)}
                            style={{
                                color: activeTab === tool.id ? tool.color : undefined
                            }}
                        >
                            {tool.name}
                            {prompts[tool.id]?.is_custom && (
                                <span style={{
                                    marginLeft: '6px',
                                    padding: '2px 6px',
                                    background: tool.color,
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '0.7em',
                                    verticalAlign: 'super'
                                }}>
                                    CUSTOM
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    padding: '20px',
                    background: 'white',
                    borderTop: '2px solid #cbd5e1',
                    borderRadius: '0 0 20px 20px'
                }}>
                    {prompts[activeTab] && (
                        <div>
                            {/* Prompt Info */}
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px',
                                borderLeft: `4px solid ${tools.find(t => t.id === activeTab)?.color}`
                            }}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                                    {prompts[activeTab].name}
                                </h3>
                                <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                                    {prompts[activeTab].description}
                                </p>
                                {prompts[activeTab].system_message && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: 'rgba(102, 126, 234, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: '0.9em',
                                        color: '#667eea'
                                    }}>
                                        <strong>System Message:</strong> {prompts[activeTab].system_message}
                                    </div>
                                )}
                            </div>

                            {/* Prompt Template Editor */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <h4 style={{ margin: 0, color: '#333' }}>Prompt Template:</h4>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {saveStatus[activeTab] === 'saved' && (
                                            <span style={{ color: '#10b981', fontSize: '0.9em' }}>✓ Saved</span>
                                        )}
                                        {saveStatus[activeTab] === 'reset' && (
                                            <span style={{ color: '#3b82f6', fontSize: '0.9em' }}>✓ Reset to default</span>
                                        )}
                                        {saveStatus[activeTab] === 'error' && (
                                            <span style={{ color: '#ef4444', fontSize: '0.9em' }}>✗ Error saving</span>
                                        )}
                                        <button
                                            onClick={() => handleSavePrompt(activeTab)}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.9em',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                        >
                                            💾 Save
                                        </button>
                                        <button
                                            onClick={() => handleResetPrompt(activeTab)}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.9em',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                        >
                                            🔄 Reset to Default
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    className="prompt-textarea"
                                    value={editingPrompts[activeTab] || ''}
                                    onChange={(e) => handlePromptChange(activeTab, e.target.value)}
                                    placeholder="Enter your prompt template..."
                                />
                            </div>

                            {/* Variables Section */}
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px'
                            }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📌 Template Variables:</h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                    gap: '15px'
                                }}>
                                    {prompts[activeTab].variables.map(variable => (
                                        <div key={variable.name} style={{
                                            background: 'white',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            border: '1px solid #e1e5e9'
                                        }}>
                                            <div style={{
                                                fontFamily: 'monospace',
                                                color: '#667eea',
                                                fontWeight: '600',
                                                marginBottom: '5px'
                                            }}>
                                                {`{${variable.name}}`}
                                                {variable.required && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        color: '#ef4444',
                                                        fontSize: '0.8em'
                                                    }}>
                                                        *required
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: '0.9em',
                                                color: '#666',
                                                marginBottom: '8px'
                                            }}>
                                                {variable.description}
                                            </div>
                                            <input
                                                type="text"
                                                value={sampleVariables[activeTab]?.[variable.name] || ''}
                                                onChange={(e) => handleVariableChange(activeTab, variable.name, e.target.value)}
                                                placeholder={`Example: ${variable.example}`}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #e1e5e9',
                                                    borderRadius: '6px',
                                                    fontSize: '0.9em'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Toggle */}
                            <div style={{ marginBottom: '20px' }}>
                                <button
                                    onClick={() => setShowPreview(prev => ({ ...prev, [activeTab]: !prev[activeTab] }))}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '1em',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    {showPreview[activeTab] ? '👁️ Hide Preview' : '👁️ Show Preview'}
                                </button>
                            </div>

                            {/* Preview */}
                            {renderPreview(activeTab)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}