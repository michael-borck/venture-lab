import React, { useState, useEffect } from 'react';
import { 
    getUsageStats,
    getUsageHistory,
    clearUsageHistory,
    exportUsageData
} from '../lib/tauri_frontend_api';

export default function UsageStatsPage({ onClose }) {
    const [usageStats, setUsageStats] = useState(null);
    const [usageTimeFilter, setUsageTimeFilter] = useState(30);
    const [loadingUsage, setLoadingUsage] = useState(false);
    
    useEffect(() => {
        loadUsageStats();
    }, []);
    
    const loadUsageStats = async (days = usageTimeFilter) => {
        setLoadingUsage(true);
        try {
            const result = await getUsageStats(days === 0 ? null : days);
            if (result.success && result.data) {
                setUsageStats(result.data);
            } else {
                console.log('No usage stats available or failed to load');
                setUsageStats(null);
            }
        } catch (error) {
            console.error('Failed to load usage stats:', error);
            setUsageStats(null);
        } finally {
            setLoadingUsage(false);
        }
    };
    
    const handleExportUsage = async () => {
        try {
            const result = await exportUsageData();
            if (result.success) {
                // Create a blob and download
                const blob = new Blob([result.data], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `usage-data-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Failed to export usage data:', error);
            alert('Failed to export usage data: ' + error.toString());
        }
    };
    
    const handleClearUsage = async () => {
        if (window.confirm('Are you sure you want to clear all usage history? This action cannot be undone.')) {
            try {
                const result = await clearUsageHistory();
                if (result.success) {
                    setUsageStats(null);
                    loadUsageStats();
                }
            } catch (error) {
                console.error('Failed to clear usage history:', error);
                alert('Failed to clear usage history: ' + error.toString());
            }
        }
    };
    
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
                    <h2 style={{ margin: 0, fontSize: '1.8em' }}>📊 Usage Statistics</h2>
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
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ color: '#333', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                📊 Usage Statistics
                                <button
                                    onClick={() => loadUsageStats(usageTimeFilter)}
                                    disabled={loadingUsage}
                                    style={{
                                        padding: '4px 8px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#4b5563',
                                        fontSize: '0.8em',
                                        cursor: loadingUsage ? 'not-allowed' : 'pointer',
                                        opacity: loadingUsage ? 0.6 : 1
                                    }}
                                    title="Refresh statistics"
                                >
                                    {loadingUsage ? '🔄' : '🔄'}
                                </button>
                            </h3>
                        </div>
                        
                        {/* Time Filter */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                📅 Time Period:
                            </label>
                            <select
                                value={usageTimeFilter}
                                onChange={(e) => {
                                    const newFilter = parseInt(e.target.value);
                                    setUsageTimeFilter(newFilter);
                                    loadUsageStats(newFilter);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    border: '2px solid #e1e5e9',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    background: 'white'
                                }}
                            >
                                <option value={7}>Last 7 days</option>
                                <option value={30}>Last 30 days</option>
                                <option value={90}>Last 90 days</option>
                                <option value={0}>All time</option>
                            </select>
                        </div>

                        {/* Usage Statistics Display */}
                        {loadingUsage ? (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666',
                                fontStyle: 'italic'
                            }}>
                                Loading usage statistics...
                            </div>
                        ) : usageStats ? (
                            <div>
                                {/* Overview Cards */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '15px',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{
                                        padding: '15px',
                                        backgroundColor: '#f0f9ff',
                                        border: '2px solid #0ea5e9',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#0ea5e9' }}>
                                            {usageStats.total_requests || 0}
                                        </div>
                                        <div style={{ fontSize: '0.9em', color: '#0c4a6e' }}>Total API Calls</div>
                                    </div>
                                    
                                    <div style={{
                                        padding: '15px',
                                        backgroundColor: '#f0fdf4',
                                        border: '2px solid #10b981',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#10b981' }}>
                                            {(usageStats.total_tokens || 0).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.9em', color: '#166534' }}>Total Tokens</div>
                                    </div>
                                    
                                    <div style={{
                                        padding: '15px',
                                        backgroundColor: '#fefce8',
                                        border: '2px solid #f59e0b',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#f59e0b' }}>
                                            {(usageStats.input_tokens || 0).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.9em', color: '#92400e' }}>Input Tokens</div>
                                    </div>
                                    
                                    <div style={{
                                        padding: '15px',
                                        backgroundColor: '#fdf2f8',
                                        border: '2px solid #ec4899',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#ec4899' }}>
                                            {(usageStats.output_tokens || 0).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.9em', color: '#9f1239' }}>Output Tokens</div>
                                    </div>
                                </div>

                                {/* Provider Breakdown */}
                                {usageStats.by_provider && Object.keys(usageStats.by_provider).length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ color: '#333', marginBottom: '10px' }}>🤖 Usage by Provider</h4>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                            gap: '10px'
                                        }}>
                                            {Object.entries(usageStats.by_provider).map(([provider, stats]) => (
                                                <div key={provider} style={{
                                                    padding: '10px',
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e1e5e9',
                                                    borderRadius: '6px'
                                                }}>
                                                    <div style={{ fontWeight: '600', color: '#333', textTransform: 'capitalize' }}>
                                                        {provider}
                                                    </div>
                                                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                                                        {(stats?.requests || 0)} calls, {((stats?.tokens || 0)).toLocaleString()} tokens
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tool Breakdown */}
                                {usageStats.by_tool && Object.keys(usageStats.by_tool).length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ color: '#333', marginBottom: '10px' }}>🛠️ Usage by Tool</h4>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                            gap: '10px'
                                        }}>
                                            {Object.entries(usageStats.by_tool).map(([tool, stats]) => (
                                                <div key={tool} style={{
                                                    padding: '10px',
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e1e5e9',
                                                    borderRadius: '6px'
                                                }}>
                                                    <div style={{ fontWeight: '600', color: '#333' }}>
                                                        {tool.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </div>
                                                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                                                        {(stats?.requests || 0)} calls, {((stats?.tokens || 0)).toLocaleString()} tokens
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={handleExportUsage}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            fontSize: '0.9em',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📥 Export Data
                                    </button>
                                    <button
                                        onClick={handleClearUsage}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            fontSize: '0.9em',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🗑️ Clear History
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e1e5e9'
                            }}>
                                📊 No usage data available yet. Start using the AI tools to see statistics here!
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
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}