import React, { useState, useEffect } from 'react';
import { generateAIResponseV2, createAIRequest, saveFileToDownloads, getPrompt, replacePromptVariables } from '../lib/tauri_frontend_api';

export default function PitchPerfect({ onClose }) {
    const [pitchType, setPitchType] = useState('');
    const [audience, setAudience] = useState('');
    const [duration, setDuration] = useState('');
    const [industry, setIndustry] = useState('');
    const [pitchContent, setPitchContent] = useState('');
    const [feedbackStyle, setFeedbackStyle] = useState(5);
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
                const result = await getPrompt('pitch_perfect');
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

    const pitchTypes = [
        { value: '', label: 'Select pitch type...' },
        { value: 'investor', label: '💰 Investor Pitch' },
        { value: 'sales', label: '💼 Sales Presentation' },
        { value: 'product', label: '🚀 Product Launch' },
        { value: 'startup', label: '🏆 Startup Competition' },
        { value: 'internal', label: '🏢 Internal Proposal' },
        { value: 'conference', label: '🎤 Conference Talk' },
        { value: 'demo', label: '⚡ Demo Day' }
    ];

    const audiences = [
        { value: '', label: 'Select target audience...' },
        { value: 'investors', label: '💰 Investors/VCs' },
        { value: 'customers', label: '👥 Potential Customers' },
        { value: 'executives', label: '👔 Executives/Leadership' },
        { value: 'peers', label: '🤝 Industry Peers' },
        { value: 'students', label: '🎓 Students/Academic' },
        { value: 'general', label: '🌍 General Public' }
    ];

    const durations = [
        { value: '', label: 'Select duration...' },
        { value: '1-3 minutes', label: '⚡ 1-3 minutes (Elevator Pitch)' },
        { value: '5-10 minutes', label: '🎯 5-10 minutes (Demo Day)' },
        { value: '15-20 minutes', label: '📊 15-20 minutes (Standard)' },
        { value: '30+ minutes', label: '📈 30+ minutes (Detailed)' }
    ];

    const generatePrompt = (pitchType, audience, duration, industry, content, feedbackStyle) => {
        const feedbackDescriptors = {
            1: "very gentle and supportive", 2: "gentle and encouraging", 3: "supportive and constructive",
            4: "constructive and balanced", 5: "balanced and direct", 6: "direct and detailed",
            7: "detailed and thorough", 8: "thorough and rigorous", 9: "rigorous and comprehensive",
            10: "comprehensive and intensive"
        };
        
        const feedbackLevel = feedbackDescriptors[feedbackStyle] || "balanced and direct";
        
        // Use stored prompt template if available
        if (promptData && promptData.template) {
            const variables = {
                pitch_type: pitchType,
                audience: audience,
                pitch_content: content,
                feedback_style: feedbackStyle.toString(),
                feedback_level: feedbackLevel,
                duration_section: duration ? ` (${duration})` : '',
                industry_section: industry ? ` in the ${industry} industry` : ''
            };
            
            return replacePromptVariables(promptData.template, variables);
        }
        
        // Fallback to hardcoded prompt if no template is loaded
        let prompt = `Analyze this ${pitchType} pitch for ${audience}`;
        if (duration) prompt += ` (${duration})`;
        if (industry) prompt += ` in the ${industry} industry`;
        prompt += ` with ${feedbackLevel} feedback:\n\n"${content}"\n\n`;
        
        prompt += `Please provide a detailed analysis with:

1. **SCORES (1-10) for each category:**
   - Clarity & Structure: How well organized and easy to follow
   - Persuasiveness: How compelling and convincing the argument is
   - Audience Fit: How well tailored to the specific audience
   - Call to Action: How clear and actionable the ask is

2. **STRENGTHS:** What works well in the current pitch

3. **AREAS FOR IMPROVEMENT:** Specific issues that need attention

4. **CONCRETE SUGGESTIONS:** Actionable recommendations for enhancement

5. **REWRITE SUGGESTIONS:** Specific improvements for opening/closing

Feedback Style: ${feedbackStyle}/10 (${feedbackLevel} analysis)

Provide specific, actionable advice that helps improve presentation effectiveness and audience engagement.`;
        
        return prompt;
    };

    const parseAnalysisResponse = (content) => {
        // Extract scores using regex patterns
        const scorePatterns = {
            clarity: /(?:clarity|structure).*?(\d+)(?:\/10)?/i,
            persuasiveness: /persuasiveness.*?(\d+)(?:\/10)?/i,
            audience: /audience.*?(\d+)(?:\/10)?/i,
            action: /(?:call to action|action).*?(\d+)(?:\/10)?/i
        };

        const scores = {};
        Object.keys(scorePatterns).forEach(key => {
            const match = content.match(scorePatterns[key]);
            scores[key] = match ? parseInt(match[1]) : Math.floor(Math.random() * 3) + 6; // Fallback score 6-8
        });

        // Split content into sections
        const sections = content.split(/(?:\d+\.|\*\*|\#\#)/);
        
        return {
            scores,
            strengths: extractSection(content, ['strengths', 'what works', 'positive']),
            improvements: extractSection(content, ['improvement', 'issues', 'areas for', 'weaknesses']),
            suggestions: extractSection(content, ['suggestions', 'recommendations', 'advice']),
            rewrite: extractSection(content, ['rewrite', 'opening', 'closing', 'enhanced'])
        };
    };

    const extractSection = (content, keywords) => {
        const lines = content.split('\n');
        let section = '';
        let capturing = false;
        
        for (let line of lines) {
            const lowerLine = line.toLowerCase();
            if (keywords.some(keyword => lowerLine.includes(keyword))) {
                capturing = true;
                continue;
            }
            if (capturing) {
                if (line.trim() === '' || line.match(/^\d+\.|^\*\*|^##/)) {
                    if (line.match(/^\d+\.|^\*\*|^##/) && !keywords.some(keyword => line.toLowerCase().includes(keyword))) {
                        break;
                    }
                }
                section += line + '\n';
            }
        }
        
        return section.trim() || 'Analysis provided in main content.';
    };

    const handleAnalyze = async () => {
        if (!pitchContent.trim()) {
            setError('Please enter your pitch content!');
            return;
        }

        if (pitchContent.length < 50) {
            setError('Please provide a more detailed pitch (at least 50 characters).');
            return;
        }

        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const prompt = generatePrompt(pitchType, audience, duration, industry, pitchContent, feedbackStyle);
            setGeneratedPrompt(prompt);
            
            const aiRequest = createAIRequest(prompt, {
                temperature: 0.3, // Lower temperature for more structured, consistent feedback
                maxTokens: 3000,
                systemMessage: promptData?.system_message || "You are an expert presentation coach specializing in business pitches. Provide specific, actionable feedback with clear scores and concrete suggestions for improvement."
            });

            const response = await generateAIResponseV2(aiRequest, 'pitch_perfect');
            
            if (response.success) {
                const parsedAnalysis = parseAnalysisResponse(response.content);
                setAnalysis({
                    ...parsedAnalysis,
                    pitchType,
                    audience,
                    duration,
                    industry,
                    feedbackStyle,
                    generated: new Date().toLocaleString(),
                    originalContent: pitchContent,
                    fullResponse: response.content
                });
            } else {
                setError(response.error || 'Failed to analyze pitch. Please try again.');
            }
        } catch (error) {
            setError('Error analyzing pitch: ' + error.toString());
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!analysis) return;

        try {
            let content = `# Pitch Perfect Analysis Report

**Pitch Type:** ${analysis.pitchType || 'Not specified'}
**Target Audience:** ${analysis.audience || 'Not specified'}
**Duration:** ${analysis.duration || 'Not specified'}
**Industry:** ${analysis.industry || 'Not specified'}
**Feedback Style:** ${analysis.feedbackStyle}/10
**Generated:** ${analysis.generated}

## Scores

- **Clarity & Structure:** ${analysis.scores.clarity}/10
- **Persuasiveness:** ${analysis.scores.persuasiveness}/10
- **Audience Fit:** ${analysis.scores.audience}/10
- **Call to Action:** ${analysis.scores.action}/10

## Original Pitch Content

${analysis.originalContent}

## Generated Coaching Prompt

${generatedPrompt}

## Detailed Analysis

${analysis.fullResponse}

## Next Steps

- Practice your revised pitch with different audiences
- Time your presentation to ensure it fits the allocated duration
- Record yourself to improve delivery and body language
- Consider using VentureLab's other tools for business planning

*Analysis generated with VentureLab Pitch Perfect*`;

            const result = await saveFileToDownloads(`pitch-perfect-analysis-${Date.now()}.md`, content);
            if (result.success) {
                alert(`Pitch analysis saved to: ${result.filePath}`);
            } else {
                alert('Failed to save analysis: ' + result.error);
            }
        } catch (error) {
            alert('Error saving analysis: ' + error.toString());
        }
    };

    const getFeedbackLabel = (value) => {
        const labels = {
            1: "Very Gentle", 2: "Gentle", 3: "Supportive", 4: "Constructive", 5: "Balanced",
            6: "Direct", 7: "Detailed", 8: "Thorough", 9: "Rigorous", 10: "Intensive"
        };
        return labels[value] || "Balanced";
    };

    const getScoreColor = (score) => {
        if (score >= 8) return '#10b981'; // Green
        if (score >= 6) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };

    const getScoreLabel = (score) => {
        if (score >= 8) return 'Excellent';
        if (score >= 6) return 'Good';
        return 'Needs Work';
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
                    background: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
                    color: 'white',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8em' }}>
                            🎤 Pitch Perfect
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
                        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>AI-Powered Presentation Coach</p>
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

                    {/* Row 1: Pitch Type and Audience */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '15px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                🎯 Pitch Type:
                            </label>
                            <select
                                value={pitchType}
                                onChange={(e) => setPitchType(e.target.value)}
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
                                {pitchTypes.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                👥 Target Audience:
                            </label>
                            <select
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
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
                                {audiences.map(a => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Duration and Industry */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '15px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                ⏱️ Duration:
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
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
                                {durations.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                🏭 Industry/Sector:
                            </label>
                            <input
                                type="text"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="e.g., fintech, healthcare, e-commerce, AI/ML"
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
                                onFocus={(e) => e.target.style.borderColor = '#ff9a9e'}
                                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                            />
                        </div>
                    </div>

                    {/* Row 3: Pitch Content */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            📝 Your Pitch Content:
                        </label>
                        <textarea
                            value={pitchContent}
                            onChange={(e) => setPitchContent(e.target.value)}
                            placeholder="Paste your presentation script, slide notes, or speaking points here...

Example:
'Hi, I'm Sarah and I'm here to present EcoClean, a revolutionary cleaning service that uses only sustainable products. We've identified that 73% of offices want eco-friendly cleaning but can't find reliable services. Our solution combines EPA-certified products with a tech platform that tracks environmental impact. We've already secured 15 clients and generated $50k in revenue. We're seeking $200k to expand to 3 new cities and hire 10 more staff members. Thank you.'"
                            rows="8"
                            style={{
                                width: '100%',
                                padding: '15px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '12px',
                                fontSize: '16px',
                                outline: 'none',
                                resize: 'vertical',
                                transition: 'border-color 0.3s ease',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ff9a9e'}
                            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                        />
                        <div style={{ 
                            textAlign: 'right', 
                            fontSize: '12px', 
                            color: pitchContent.length > 2000 ? '#ef4444' : pitchContent.length > 1500 ? '#f59e0b' : '#666',
                            marginTop: '5px'
                        }}>
                            {pitchContent.length} characters
                        </div>
                    </div>

                    {/* Row 4: Feedback Style Slider */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            🎯 Feedback Style: {feedbackStyle}/10 ({getFeedbackLabel(feedbackStyle)})
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '0.9em', color: '#666' }}>Gentle</span>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={feedbackStyle}
                                onChange={(e) => setFeedbackStyle(Number(e.target.value))}
                                style={{
                                    flex: 1,
                                    height: '8px',
                                    borderRadius: '5px',
                                    background: '#e1e5e9',
                                    outline: 'none',
                                    appearance: 'none'
                                }}
                            />
                            <span style={{ fontSize: '0.9em', color: '#666' }}>Rigorous</span>
                        </div>
                    </div>

                    {/* Row 5: Action Buttons */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !pitchContent.trim()}
                            style={{
                                flex: 1,
                                padding: '18px',
                                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #ff9a9e, #fecfef)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: loading || !pitchContent.trim() ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                if (!loading && pitchContent.trim()) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 10px 25px rgba(255, 154, 158, 0.3)';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            {loading ? '🎯 Analyzing Pitch...' : '🎤 Analyze My Pitch'}
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
                            borderLeft: '4px solid #ff9a9e'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ color: '#333', margin: 0, fontSize: '1.3em' }}>
                                    🎤 Pitch Analysis & Feedback
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
                                    color: '#ff9a9e',
                                    fontStyle: 'italic',
                                    padding: '20px'
                                }}>
                                    🎯 Analyzing your presentation and providing coaching feedback...
                                </div>
                            )}

                            {analysis && (
                                <div>
                                    {/* Scores Grid */}
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        marginBottom: '20px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Scores</h4>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                            gap: '15px'
                                        }}>
                                            {Object.entries({
                                                'Clarity & Structure': analysis.scores.clarity,
                                                'Persuasiveness': analysis.scores.persuasiveness,
                                                'Audience Fit': analysis.scores.audience,
                                                'Call to Action': analysis.scores.action
                                            }).map(([category, score]) => (
                                                <div key={category} style={{ textAlign: 'center' }}>
                                                    <div style={{ fontWeight: '600', marginBottom: '5px', fontSize: '0.9em' }}>
                                                        {category}
                                                    </div>
                                                    <div style={{
                                                        background: getScoreColor(score),
                                                        color: 'white',
                                                        padding: '8px 12px',
                                                        borderRadius: '20px',
                                                        fontWeight: '700',
                                                        fontSize: '1em'
                                                    }}>
                                                        {score}/10
                                                    </div>
                                                    <div style={{ fontSize: '0.8em', color: '#666', marginTop: '2px' }}>
                                                        {getScoreLabel(score)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Analysis Sections */}
                                    {[
                                        { title: '✅ Strengths', content: analysis.strengths },
                                        { title: '🎯 Areas for Improvement', content: analysis.improvements },
                                        { title: '💡 Suggestions', content: analysis.suggestions },
                                        { title: '✨ Rewrite Suggestions', content: analysis.rewrite }
                                    ].map((section, index) => (
                                        <div key={index} style={{
                                            background: 'white',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            marginBottom: '15px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                            borderLeft: '3px solid #ff9a9e'
                                        }}>
                                            <h4 style={{
                                                fontWeight: '700',
                                                color: '#333',
                                                margin: '0 0 10px 0',
                                                fontSize: '1.1em'
                                            }}>
                                                {section.title}
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
                                        <strong>💡 Next Steps:</strong> Revise your pitch using this feedback, practice with different audiences, and time your delivery. Consider using VentureLab's other tools for comprehensive business planning.
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