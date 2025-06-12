import React, { useState, useEffect } from 'react';
import { generateAIResponseV2, createAIRequest, saveFileToDownloads, getPrompt, replacePromptVariables } from '../lib/tauri_frontend_api';

export default function IdeaForge({ onClose }) {
    const [keywords, setKeywords] = useState('');
    const [context, setContext] = useState('');
    const [creativity, setCreativity] = useState(5);
    const [showContext, setShowContext] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ideas, setIdeas] = useState([]);
    const [error, setError] = useState(null);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [promptData, setPromptData] = useState(null);
    const [isCustomPrompt, setIsCustomPrompt] = useState(false);

    // Load prompt data on component mount
    useEffect(() => {
        const loadPromptData = async () => {
            try {
                const result = await getPrompt('idea_forge');
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

    const generatePrompt = (keywords, context, creativity) => {
        let creativityDescriptor = creativity <= 3 ? "conservative and practical" : 
                                creativity <= 7 ? "moderately innovative" : 
                                "highly creative and unconventional";
        
        // Use stored prompt template if available
        if (promptData && promptData.template) {
            const variables = {
                keywords: keywords,
                creativity: creativity.toString(),
                creativity_descriptor: creativityDescriptor,
                context_section: context.trim() ? `\n\nAdditional context: ${context}` : ''
            };
            
            return replacePromptVariables(promptData.template, variables);
        }
        
        // Fallback to hardcoded prompt if no template is loaded
        let prompt = `Generate 3 ${creativityDescriptor} business ideas based on: ${keywords}`;
        
        if (context.trim()) {
            prompt += `\n\nAdditional context: ${context}`;
        }
        
        prompt += `\n\nFor each idea, provide:
1. A catchy business name
2. Brief description (2-3 sentences)
3. Target market
4. Key value proposition
5. One potential challenge

Creativity level: ${creativity}/10 (${creativityDescriptor})

Format your response as a numbered list with clear sections for each idea.`;
        
        return prompt;
    };

    const parseAIResponse = (content) => {
        // Simple parsing - in a real implementation you might want more sophisticated parsing
        const sections = content.split(/\d+\.\s+/).filter(section => section.trim());
        
        return sections.map((section, index) => {
            const lines = section.split('\n').filter(line => line.trim());
            const title = lines[0] || `Business Idea ${index + 1}`;
            const description = lines.slice(1).join(' ') || 'Description not available';
            
            return {
                id: Date.now() + index,
                title: title.replace(/[*#]/g, '').trim(),
                description: description.replace(/[*#]/g, '').trim(),
                generated: new Date().toLocaleString()
            };
        });
    };

    const handleGenerate = async () => {
        if (!keywords.trim()) {
            setError('Please enter some keywords or industry focus!');
            return;
        }

        setLoading(true);
        setError(null);
        setIdeas([]);

        try {
            const prompt = generatePrompt(keywords, context, creativity);
            setGeneratedPrompt(prompt);
            
            const aiRequest = createAIRequest(prompt, {
                temperature: creativity / 10,
                maxTokens: 2000,
                systemMessage: promptData?.system_message || "You are an expert business consultant helping entrepreneurs generate innovative business ideas. Provide practical, actionable suggestions."
            });

            const response = await generateAIResponseV2(aiRequest);
            
            if (response.success) {
                const parsedIdeas = parseAIResponse(response.content);
                setIdeas(parsedIdeas);
            } else {
                setError(response.error || 'Failed to generate ideas. Please try again.');
            }
        } catch (error) {
            setError('Error generating ideas: ' + error.toString());
        } finally {
            setLoading(false);
        }
    };

    const handleSaveIdea = async (idea) => {
        try {
            const content = `# ${idea.title}

${idea.description}

Generated: ${idea.generated}
Keywords: ${keywords}
Creativity Level: ${creativity}/10`;

            const result = await saveFileToDownloads(`idea-${Date.now()}.md`, content);
            if (result.success) {
                alert(`Idea saved to: ${result.filePath}`);
            } else {
                alert('Failed to save idea: ' + result.error);
            }
        } catch (error) {
            alert('Error saving idea: ' + error.toString());
        }
    };

    const handleSaveAll = async () => {
        if (ideas.length === 0) return;

        try {
            let content = `# Generated Business Ideas

**Keywords:** ${keywords}
**Context:** ${context || 'None provided'}
**Creativity Level:** ${creativity}/10
**Generated:** ${new Date().toLocaleString()}

## Generated Prompt
${generatedPrompt}

## Business Ideas

`;

            ideas.forEach((idea, index) => {
                content += `### ${index + 1}. ${idea.title}

${idea.description}

---

`;
            });

            const result = await saveFileToDownloads(`venture-lab-ideas-${Date.now()}.md`, content);
            if (result.success) {
                alert(`All ideas saved to: ${result.filePath}`);
            } else {
                alert('Failed to save ideas: ' + result.error);
            }
        } catch (error) {
            alert('Error saving ideas: ' + error.toString());
        }
    };

    const getCreativityLabel = (value) => {
        if (value <= 3) return 'Conservative';
        if (value <= 7) return 'Innovative';
        return 'Wild & Creative';
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
                maxWidth: '900px',
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
                    background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
                    color: 'white',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8em' }}>
                            🔥 Idea Forge
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
                        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>AI-Powered Business Idea Generator</p>
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

                    {/* Keywords Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            🎯 Keywords or Industry Focus:
                        </label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="e.g., sustainability, healthcare, fintech, education, AI"
                            style={{
                                width: '100%',
                                padding: '15px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '12px',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'border-color 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                        />
                    </div>

                    {/* Context Section - Collapsible */}
                    <div style={{ marginBottom: '20px' }}>
                        <button
                            onClick={() => setShowContext(!showContext)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#667eea',
                                fontSize: '0.9em',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                marginBottom: '8px'
                            }}
                        >
                            {showContext ? '▼' : '▶'} Additional Context (Optional)
                        </button>
                        
                        {showContext && (
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="Any specific problems you want to solve, target markets, constraints, or additional details..."
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
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                            />
                        )}
                    </div>

                    {/* Creativity Slider */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            ⚡ Creativity Level: {creativity}/10 ({getCreativityLabel(creativity)})
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '0.9em', color: '#666' }}>Conservative</span>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={creativity}
                                onChange={(e) => setCreativity(Number(e.target.value))}
                                style={{
                                    flex: 1,
                                    height: '8px',
                                    borderRadius: '5px',
                                    background: '#e1e5e9',
                                    outline: 'none',
                                    appearance: 'none'
                                }}
                            />
                            <span style={{ fontSize: '0.9em', color: '#666' }}>Wild & Creative</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !keywords.trim()}
                            style={{
                                flex: 1,
                                padding: '18px',
                                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: loading || !keywords.trim() ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                if (!loading && keywords.trim()) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            {loading ? '⚡ Generating Ideas...' : '🚀 Generate Business Ideas'}
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
                    {(loading || ideas.length > 0) && (
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '25px',
                            borderLeft: '4px solid #667eea'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ color: '#333', margin: 0, fontSize: '1.3em' }}>
                                    💡 Generated Business Ideas
                                </h3>
                                {ideas.length > 0 && (
                                    <button
                                        onClick={handleSaveAll}
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
                                        💾 Save All Ideas
                                    </button>
                                )}
                            </div>

                            {loading && (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#667eea',
                                    fontStyle: 'italic',
                                    padding: '20px'
                                }}>
                                    ✨ Generating innovative ideas...
                                </div>
                            )}

                            {ideas.map((idea, index) => (
                                <div key={idea.id} style={{
                                    background: 'white',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    marginBottom: '15px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    borderLeft: '3px solid #ff6b6b'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '10px'
                                    }}>
                                        <h4 style={{
                                            fontWeight: '700',
                                            color: '#333',
                                            margin: 0,
                                            fontSize: '1.1em',
                                            flex: 1
                                        }}>
                                            {index + 1}. {idea.title}
                                        </h4>
                                        <button
                                            onClick={() => handleSaveIdea(idea)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.8em',
                                                cursor: 'pointer',
                                                marginLeft: '10px'
                                            }}
                                        >
                                            💾 Save
                                        </button>
                                    </div>
                                    <div style={{
                                        color: '#666',
                                        lineHeight: '1.6'
                                    }}>
                                        {idea.description}
                                    </div>
                                </div>
                            ))}

                            {ideas.length > 0 && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#e0f2fe',
                                    borderRadius: '8px',
                                    fontSize: '0.9em',
                                    color: '#0c4a6e'
                                }}>
                                    <strong>💡 Next Step:</strong> Choose your favorite idea and use the PRD Generator to create a detailed product requirements document!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}