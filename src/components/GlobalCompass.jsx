import React, { useState, useEffect } from 'react';
import { generateAIResponseV2, createAIRequest, saveFileToDownloads, getPrompt, replacePromptVariables } from '../lib/tauri_frontend_api';

export default function GlobalCompass({ onClose }) {
    const [product, setProduct] = useState('');
    const [region, setRegion] = useState('');
    const [budget, setBudget] = useState('');
    const [timeline, setTimeline] = useState('');
    const [context, setContext] = useState('');
    const [detailLevel, setDetailLevel] = useState(5);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [promptData, setPromptData] = useState(null);
    const [isCustomPrompt, setIsCustomPrompt] = useState(false);

    // Load prompt data on component mount
    useEffect(() => {
        const loadPromptData = async () => {
            try {
                const result = await getPrompt('global_compass');
                if (result.success && result.data) {
                    setPromptData(result.data);
                    setIsCustomPrompt(result.data.is_custom || false);
                }
            } catch (error) {
                console.error('Failed to load prompt:', error);
            }
        };
        loadPromptData();
    }, []);

    const regions = [
        { value: '', label: 'Select a region...' },
        { value: 'North America', label: '🌎 North America' },
        { value: 'Europe', label: '🇪🇺 Europe' },
        { value: 'Asia-Pacific', label: '🌏 Asia-Pacific' },
        { value: 'Latin America', label: '🌎 Latin America' },
        { value: 'Middle East', label: '🕌 Middle East' },
        { value: 'Africa', label: '🌍 Africa' },
        { value: 'United States', label: '🇺🇸 United States' },
        { value: 'Canada', label: '🇨🇦 Canada' },
        { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
        { value: 'Germany', label: '🇩🇪 Germany' },
        { value: 'France', label: '🇫🇷 France' },
        { value: 'Japan', label: '🇯🇵 Japan' },
        { value: 'China', label: '🇨🇳 China' },
        { value: 'India', label: '🇮🇳 India' },
        { value: 'Australia', label: '🇦🇺 Australia' },
        { value: 'Brazil', label: '🇧🇷 Brazil' },
        { value: 'Mexico', label: '🇲🇽 Mexico' },
        { value: 'Singapore', label: '🇸🇬 Singapore' }
    ];

    const budgetRanges = [
        { value: '', label: 'Select budget range...' },
        { value: 'Under $50k', label: '💰 Under $50k' },
        { value: '$50k - $250k', label: '💰 $50k - $250k' },
        { value: '$250k - $1M', label: '💰 $250k - $1M' },
        { value: '$1M - $5M', label: '💰 $1M - $5M' },
        { value: 'Over $5M', label: '💰 Over $5M' }
    ];

    const timelines = [
        { value: '', label: 'Select timeline...' },
        { value: '3-6 months', label: '⚡ 3-6 months' },
        { value: '6-12 months', label: '📅 6-12 months' },
        { value: '1-2 years', label: '📆 1-2 years' },
        { value: '2+ years', label: '🗓️ 2+ years' }
    ];

    const generatePrompt = (product, region, budget, timeline, context, detail) => {
        const detailDescriptors = {
            1: "quick overview", 2: "basic analysis", 3: "standard report",
            4: "detailed review", 5: "balanced analysis", 6: "comprehensive study",
            7: "in-depth analysis", 8: "expert assessment", 9: "strategic deep dive",
            10: "exhaustive analysis"
        };
        
        const detailLevel = detailDescriptors[detail] || "balanced analysis";
        
        // Use stored prompt template if available
        if (promptData && promptData.template) {
            const variables = {
                product: product,
                region: region,
                detail: detail.toString(),
                detail_level: detailLevel,
                budget_section: budget ? `\nBudget: ${budget}` : '',
                timeline_section: timeline ? `\nTimeline: ${timeline}` : '',
                context_section: context ? `\nAdditional context: ${context}` : ''
            };
            
            return replacePromptVariables(promptData.template, variables);
        }
        
        // Fallback to hardcoded prompt if no template is loaded
        let prompt = `Provide a ${detailLevel} market entry analysis for: ${product} in ${region}`;
        
        if (budget) prompt += `\nBudget: ${budget}`;
        if (timeline) prompt += `\nTimeline: ${timeline}`;
        if (context) prompt += `\nAdditional context: ${context}`;
        
        prompt += `\n\nPlease analyze:
1. Market Opportunity & Size
2. Cultural Considerations & Business Practices
3. Regulatory & Legal Requirements
4. Competitive Landscape
5. Entry Strategy Recommendations
6. Risk Assessment
7. Success Factors & KPIs

Detail Level: ${detail}/10 (${detailLevel} analysis)

Please provide specific, actionable insights with concrete data points where possible. Focus on practical implementation steps and realistic market entry strategies.`;
        
        return prompt;
    };

    const parseAnalysisResponse = (content) => {
        // Split the content into sections based on numbered points or headers
        const sections = content.split(/\d+\.\s+/).filter(section => section.trim());
        
        if (sections.length === 0) {
            return {
                summary: content.substring(0, 200) + '...',
                sections: [{
                    title: 'Market Analysis',
                    content: content
                }]
            };
        }

        return {
            summary: sections[0] || 'Market analysis completed successfully.',
            sections: sections.slice(1).map((section, index) => {
                const lines = section.split('\n').filter(line => line.trim());
                const title = lines[0] || `Analysis Section ${index + 1}`;
                const content = lines.slice(1).join('\n') || section;
                
                const sectionTitles = [
                    'Market Opportunity & Size',
                    'Cultural Considerations & Business Practices', 
                    'Regulatory & Legal Requirements',
                    'Competitive Landscape',
                    'Entry Strategy Recommendations',
                    'Risk Assessment',
                    'Success Factors & KPIs'
                ];
                
                return {
                    title: sectionTitles[index] || title.replace(/[^\w\s&]/g, '').trim(),
                    content: content.trim()
                };
            })
        };
    };

    const handleAnalyze = async () => {
        if (!product.trim() || !region) {
            setError('Please enter a product/service and select a target region!');
            return;
        }

        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const prompt = generatePrompt(product, region, budget, timeline, context, detailLevel);
            setGeneratedPrompt(prompt);
            
            const aiRequest = createAIRequest(prompt, {
                temperature: 0.3, // Lower temperature for more factual, structured analysis
                maxTokens: 3000,
                systemMessage: promptData?.system_message || "You are an expert international business consultant specializing in market entry strategies. Provide detailed, practical analysis with specific data points and actionable recommendations."
            });

            const response = await generateAIResponseV2(aiRequest);
            
            if (response.success) {
                const parsedAnalysis = parseAnalysisResponse(response.content);
                setAnalysis({
                    ...parsedAnalysis,
                    product,
                    region,
                    budget,
                    timeline,
                    detailLevel,
                    generated: new Date().toLocaleString()
                });
            } else {
                setError(response.error || 'Failed to generate market analysis. Please try again.');
            }
        } catch (error) {
            setError('Error generating analysis: ' + error.toString());
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!analysis) return;

        try {
            let content = `# Global Market Entry Analysis

**Product/Service:** ${analysis.product}
**Target Region:** ${analysis.region}
**Budget:** ${analysis.budget || 'Not specified'}
**Timeline:** ${analysis.timeline || 'Not specified'}
**Detail Level:** ${analysis.detailLevel}/10
**Generated:** ${analysis.generated}

## Executive Summary
${analysis.summary}

## Generated Prompt
${generatedPrompt}

## Detailed Analysis

`;

            analysis.sections.forEach((section, index) => {
                content += `### ${index + 1}. ${section.title}

${section.content}

---

`;
            });

            content += `\n## Next Steps
- Conduct primary market research to validate insights
- Develop detailed go-to-market strategy
- Create financial projections and risk mitigation plans
- Consider using VentureLab's PRD Generator for product planning

*Analysis generated with VentureLab Global Compass*`;

            const result = await saveFileToDownloads(`global-compass-${Date.now()}.md`, content);
            if (result.success) {
                alert(`Market analysis saved to: ${result.filePath}`);
            } else {
                alert('Failed to save analysis: ' + result.error);
            }
        } catch (error) {
            alert('Error saving analysis: ' + error.toString());
        }
    };

    const getDetailLabel = (value) => {
        const labels = {
            1: "Quick Overview", 2: "Basic Analysis", 3: "Standard Report",
            4: "Detailed Review", 5: "Balanced Analysis", 6: "Comprehensive Study",
            7: "In-depth Analysis", 8: "Expert Assessment", 9: "Strategic Deep Dive",
            10: "Exhaustive Analysis"
        };
        return labels[value] || "Balanced Analysis";
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
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '1000px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '30px',
                    borderBottom: '2px solid #f1f5f9',
                    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                    color: 'white',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8em' }}>
                            🌍 Global Compass
                            {isCustomPrompt && (
                                <span style={{
                                    marginLeft: '10px',
                                    padding: '4px 8px',
                                    background: 'rgba(255, 255, 255, 0.3)',
                                    borderRadius: '6px',
                                    fontSize: '0.6em',
                                    verticalAlign: 'middle'
                                }}>
                                    CUSTOM PROMPT
                                </span>
                            )}
                        </h2>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>AI-Powered Market Entry Explorer</p>
                    </div>
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
                    {/* Error Display */}
                    {error && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#991b1b'
                        }}>
                            <strong>⚠️ Error:</strong> {error}
                        </div>
                    )}

                    {/* Row 1: Product/Service - Full width */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            🎯 Product/Service:
                        </label>
                        <input
                            type="text"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            placeholder="e.g., SaaS platform, eco-friendly packaging, fitness app"
                            style={{
                                width: '100%',
                                padding: '15px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '12px',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'border-color 0.3s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4facfe'}
                            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                        />
                    </div>

                    {/* Row 2: Target Region, Budget, Timeline - Three columns */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginBottom: '20px'
                    }}>
                        {/* Target Region */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                🌍 Target Region:
                            </label>
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    border: '2px solid #e1e5e9',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    background: 'white',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {regions.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Budget */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                💰 Budget Range:
                            </label>
                            <select
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    border: '2px solid #e1e5e9',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    background: 'white',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {budgetRanges.map(b => (
                                    <option key={b.value} value={b.value}>{b.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Timeline */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                📅 Entry Timeline:
                            </label>
                            <select
                                value={timeline}
                                onChange={(e) => setTimeline(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    border: '2px solid #e1e5e9',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    background: 'white',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {timelines.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Additional Context */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            📝 Additional Context (Optional):
                        </label>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Specific concerns, target demographics, competitive advantages, regulatory considerations..."
                            rows="3"
                            style={{
                                width: '100%',
                                padding: '15px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '12px',
                                fontSize: '16px',
                                outline: 'none',
                                resize: 'vertical',
                                transition: 'border-color 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4facfe'}
                            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                        />
                    </div>

                    {/* Detail Level Slider */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            📊 Analysis Detail Level: {detailLevel}/10 ({getDetailLabel(detailLevel)})
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '0.9em', color: '#666' }}>Overview</span>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={detailLevel}
                                onChange={(e) => setDetailLevel(Number(e.target.value))}
                                style={{
                                    flex: 1,
                                    height: '8px',
                                    borderRadius: '5px',
                                    background: '#e1e5e9',
                                    outline: 'none',
                                    appearance: 'none'
                                }}
                            />
                            <span style={{ fontSize: '0.9em', color: '#666' }}>Deep Dive</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !product.trim() || !region}
                            style={{
                                flex: 1,
                                padding: '18px',
                                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #4facfe, #00f2fe)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: loading || !product.trim() || !region ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                if (!loading && product.trim() && region) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 10px 25px rgba(79, 172, 254, 0.3)';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            {loading ? '🔍 Analyzing Market...' : '🎯 Analyze Market Entry'}
                        </button>
                        {generatedPrompt && (
                            <button
                                onClick={() => {
                                    alert('Current Prompt:\n\n' + generatedPrompt);
                                }}
                                style={{
                                    padding: '18px 24px',
                                    background: '#f3f4f6',
                                    color: '#4b5563',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = '#e5e7eb';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = '#f3f4f6';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                👁️ View Prompt
                            </button>
                        )}
                    </div>

                    {/* Results Section */}
                    {(loading || analysis) && (
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '25px',
                            borderLeft: '4px solid #4facfe'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ color: '#333', margin: 0, fontSize: '1.3em' }}>
                                    🌍 Market Entry Analysis
                                </h3>
                                {analysis && (
                                    <button
                                        onClick={handleSaveAnalysis}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.9em',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        💾 Save Analysis
                                    </button>
                                )}
                            </div>

                            {loading && (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#4facfe',
                                    fontStyle: 'italic',
                                    padding: '20px'
                                }}>
                                    🔍 Analyzing market opportunities and entry strategies...
                                </div>
                            )}

                            {analysis && (
                                <div>
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        marginBottom: '20px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                                            📋 {analysis.product} → {analysis.region}
                                        </h4>
                                        <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
                                            {analysis.summary}
                                        </p>
                                    </div>

                                    {analysis.sections.map((section, index) => (
                                        <div key={index} style={{
                                            background: 'white',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            marginBottom: '15px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                            borderLeft: '3px solid #4facfe'
                                        }}>
                                            <h4 style={{
                                                fontWeight: '700',
                                                color: '#333',
                                                margin: '0 0 10px 0',
                                                fontSize: '1.1em'
                                            }}>
                                                {index + 1}. {section.title}
                                            </h4>
                                            <div style={{
                                                color: '#666',
                                                lineHeight: '1.6',
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {section.content}
                                            </div>
                                        </div>
                                    ))}

                                    <div style={{
                                        marginTop: '20px',
                                        padding: '15px',
                                        backgroundColor: '#e0f2fe',
                                        borderRadius: '8px',
                                        fontSize: '0.9em',
                                        color: '#0c4a6e'
                                    }}>
                                        <strong>💡 Next Steps:</strong> Use this analysis to create a detailed business plan, conduct primary market research, or develop a comprehensive go-to-market strategy with VentureLab's other tools.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}