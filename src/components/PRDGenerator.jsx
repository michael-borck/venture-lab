import React, { useState, useEffect } from 'react';
import { generateAIResponseV2, createAIRequest, saveFileToDownloads, getPrompt, replacePromptVariables } from '../lib/tauri_frontend_api';

export default function PRDGenerator({ onClose }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [initialIdea, setInitialIdea] = useState('');
    const [featureName, setFeatureName] = useState('');
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [generatedPRD, setGeneratedPRD] = useState('');
    const [error, setError] = useState(null);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [promptData, setPromptData] = useState(null);
    const [isCustomPrompt, setIsCustomPrompt] = useState(false);

    // Load prompt data on component mount
    useEffect(() => {
        const loadPromptData = async () => {
            try {
                const result = await getPrompt('prd_generator');
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

    const clarifyingQuestions = [
        {
            id: 'problem',
            title: 'Problem & Goal',
            subtitle: 'What problem does this feature solve?',
            question: 'What specific problem does this feature solve for the user? What is the main goal we want to achieve?'
        },
        {
            id: 'targetUser',
            title: 'Target User',
            subtitle: 'Who will use this feature?',
            question: 'Who is the primary user of this feature? Describe their role, technical expertise, and context.'
        },
        {
            id: 'coreActions',
            title: 'Core Functionality',
            subtitle: 'What actions should users be able to perform?',
            question: 'Describe the key actions a user should be able to perform with this feature. What are the main workflows?'
        },
        {
            id: 'userStories',
            title: 'User Stories',
            subtitle: 'Provide specific user stories',
            question: 'Could you provide 2-3 user stories? Format: "As a [type of user], I want to [perform an action] so that [benefit]."'
        },
        {
            id: 'acceptance',
            title: 'Success Criteria',
            subtitle: 'How will we know when it\'s done?',
            question: 'How will we know when this feature is successfully implemented? What are the key acceptance criteria?'
        },
        {
            id: 'nonGoals',
            title: 'Scope & Boundaries',
            subtitle: 'What should this feature NOT do?',
            question: 'Are there any specific things this feature should NOT include? What\'s explicitly out of scope?'
        },
        {
            id: 'dataRequirements',
            title: 'Data Requirements',
            subtitle: 'What data is needed?',
            question: 'What kind of data does this feature need to display, store, or manipulate? Any data sources or integrations?'
        },
        {
            id: 'designConsiderations',
            title: 'Design & UI',
            subtitle: 'Any design requirements?',
            question: 'Are there any specific UI/UX requirements, design guidelines, or existing components to follow?'
        },
        {
            id: 'edgeCases',
            title: 'Edge Cases',
            subtitle: 'What could go wrong?',
            question: 'Are there any potential edge cases, error conditions, or special scenarios we should consider?'
        }
    ];

    const generatePrompt = (initialIdea, featureName, answers) => {
        const formattedAnswers = Object.entries(answers)
            .map(([key, value]) => {
                const question = clarifyingQuestions.find(q => q.id === key);
                return `**${question?.title || key}:** ${value}`;
            })
            .join('\n\n');

        // Use stored prompt template if available
        if (promptData && promptData.template) {
            const variables = {
                feature_name: featureName,
                initial_idea: initialIdea,
                formatted_answers: formattedAnswers
            };
            
            return replacePromptVariables(promptData.template, variables);
        }

        // Fallback to hardcoded prompt if no template is loaded
        const prompt = `Create a comprehensive Product Requirements Document (PRD) for the following feature:

**Feature Name:** ${featureName}

**Initial Description:** ${initialIdea}

**Detailed Requirements:**
${formattedAnswers}

Please generate a well-structured PRD that includes:

1. **Executive Summary** - Brief overview and business rationale
2. **Problem Statement** - Clear definition of the problem being solved
3. **Goals & Success Metrics** - What we want to achieve and how we'll measure it
4. **User Stories & Use Cases** - Detailed user scenarios and workflows
5. **Functional Requirements** - Specific features and capabilities
6. **Non-Functional Requirements** - Performance, security, scalability considerations
7. **Technical Specifications** - Architecture, data models, and integration points
8. **Design Guidelines** - UI/UX requirements and design principles
9. **Implementation Plan** - Development phases and timeline considerations
10. **Risk Assessment** - Potential challenges and mitigation strategies
11. **Acceptance Criteria** - Definition of done and testing requirements

Format the PRD as a professional markdown document that would be suitable for a development team. Use clear headings, bullet points, and organize information logically. Include specific, actionable requirements that a junior developer could follow to implement the feature.

Make the PRD comprehensive but practical, focusing on clarity and implementability.`;

        return prompt;
    };

    const parsePRDResponse = (content) => {
        // Clean up the response and ensure proper markdown formatting
        return content
            .replace(/^\s+/gm, '') // Remove leading whitespace
            .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
            .trim();
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const startClarification = () => {
        if (!initialIdea.trim()) {
            setError('Please provide a feature description before proceeding.');
            return;
        }
        if (!featureName.trim()) {
            setError('Please provide a feature name for file naming.');
            return;
        }
        setError(null);
        setCurrentStep(2);
    };

    const reviewAnswers = () => {
        setCurrentStep(3);
    };

    const generatePRD = async () => {
        setLoading(true);
        setError(null);

        try {
            const prompt = generatePrompt(initialIdea, featureName, answers);
            setGeneratedPrompt(prompt);
            
            const aiRequest = createAIRequest(prompt, {
                temperature: 0.3, // Lower temperature for more structured, consistent output
                maxTokens: 4000,
                systemMessage: promptData?.system_message || "You are an expert product manager specializing in creating comprehensive Product Requirements Documents. Generate clear, actionable PRDs that development teams can follow to build features successfully."
            });

            const response = await generateAIResponseV2(aiRequest, 'prd_generator');
            
            if (response.success) {
                const parsedPRD = parsePRDResponse(response.content);
                setGeneratedPRD(parsedPRD);
                setCurrentStep(4);
            } else {
                setError(response.error || 'Failed to generate PRD. Please try again.');
            }
        } catch (error) {
            setError('Error generating PRD: ' + error.toString());
        } finally {
            setLoading(false);
        }
    };

    const handleSavePRD = async () => {
        if (!generatedPRD) return;

        try {
            const filename = `prd-${featureName.toLowerCase().replace(/\s+/g, '-')}.md`;
            const content = `${generatedPRD}

---

## Document Information

- **Generated:** ${new Date().toLocaleString()}
- **Tool:** VentureLab PRD Generator
- **Feature Name:** ${featureName}
- **Created by:** AI-guided workflow

## Generated Prompt

${generatedPrompt}

---

*PRD generated with VentureLab PRD Generator*`;

            const result = await saveFileToDownloads(filename, content);
            if (result.success) {
                alert(`PRD saved to: ${result.filePath}`);
            } else {
                alert('Failed to save PRD: ' + result.error);
            }
        } catch (error) {
            alert('Error saving PRD: ' + error.toString());
        }
    };

    const goToStep = (step) => {
        setCurrentStep(step);
        setError(null);
    };

    const startOver = () => {
        setCurrentStep(1);
        setInitialIdea('');
        setFeatureName('');
        setAnswers({});
        setGeneratedPRD('');
        setError(null);
        setGeneratedPrompt('');
    };

    const getProgress = () => (currentStep - 1) * 25;

    const StepIndicator = () => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '40px',
            padding: '0 20px'
        }}>
            {[
                { num: 1, label: 'Initial Idea' },
                { num: 2, label: 'Clarifying Questions' },
                { num: 3, label: 'Review & Refine' },
                { num: 4, label: 'Generate PRD' }
            ].map((step, index) => (
                <div key={step.num} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    flex: 1
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: step.num < currentStep ? '#10b981' : 
                                   step.num === currentStep ? 'linear-gradient(135deg, #a8edea, #fed6e3)' : '#e1e5e9',
                        color: step.num <= currentStep ? 'white' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease'
                    }}>
                        {step.num < currentStep ? '✓' : step.num}
                    </div>
                    <div style={{
                        fontSize: '0.9em',
                        color: step.num === currentStep ? '#a8edea' : '#666',
                        fontWeight: '600',
                        textAlign: 'center'
                    }}>
                        {step.label}
                    </div>
                    {index < 3 && (
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            left: '50%',
                            width: '100%',
                            height: '2px',
                            background: step.num < currentStep ? '#10b981' : '#e1e5e9',
                            zIndex: -1
                        }} />
                    )}
                </div>
            ))}
        </div>
    );

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
                    background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
                    color: 'white',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8em' }}>
                            📋 PRD Generator
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
                        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>AI-Guided Product Requirements Document Creator</p>
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

                <div style={{ padding: '40px' }}>
                    {/* Progress Bar */}
                    <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#e1e5e9',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #10b981, #059669)',
                            width: `${getProgress()}%`,
                            transition: 'width 0.5s ease'
                        }} />
                    </div>

                    {/* Step Indicator */}
                    <StepIndicator />

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

                    {/* Step 1: Initial Idea */}
                    {currentStep === 1 && (
                        <div>
                            <h2 style={{ color: '#333', marginBottom: '20px' }}>Step 1: Describe Your Feature Idea</h2>
                            <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
                                Provide a brief description of the feature or functionality you want to build. 
                                Don't worry about details yet - we'll gather those in the next step.
                            </p>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                    💡 Feature Description:
                                </label>
                                <textarea
                                    value={initialIdea}
                                    onChange={(e) => setInitialIdea(e.target.value)}
                                    placeholder="e.g., A user profile management system that allows users to update their personal information, upload profile pictures, and manage privacy settings..."
                                    rows="6"
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
                                    onFocus={(e) => e.target.style.borderColor = '#a8edea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                />
                            </div>
                            
                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                    🏷️ Feature Name (for file naming):
                                </label>
                                <input
                                    type="text"
                                    value={featureName}
                                    onChange={(e) => setFeatureName(e.target.value)}
                                    placeholder="e.g., user-profile-management"
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
                                    onFocus={(e) => e.target.style.borderColor = '#a8edea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                />
                            </div>
                            
                            <button
                                onClick={startClarification}
                                style={{
                                    padding: '15px 30px',
                                    background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(168, 237, 234, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                Next: Clarifying Questions →
                            </button>
                        </div>
                    )}

                    {/* Step 2: Clarifying Questions */}
                    {currentStep === 2 && (
                        <div>
                            <h2 style={{ color: '#333', marginBottom: '20px' }}>Step 2: Answer Clarifying Questions</h2>
                            <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
                                To create a comprehensive PRD, I need to understand the details of your feature. 
                                Please answer the following questions as thoroughly as possible.
                            </p>
                            
                            {clarifyingQuestions.map((q) => (
                                <div key={q.id} style={{
                                    background: '#f8fafc',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    borderLeft: '4px solid #a8edea'
                                }}>
                                    <div style={{
                                        fontWeight: '600',
                                        color: '#333',
                                        marginBottom: '5px',
                                        fontSize: '1.1em'
                                    }}>
                                        {q.title}
                                    </div>
                                    <div style={{
                                        color: '#666',
                                        fontSize: '0.9em',
                                        marginBottom: '15px',
                                        fontStyle: 'italic'
                                    }}>
                                        {q.subtitle}
                                    </div>
                                    <textarea
                                        value={answers[q.id] || ''}
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        placeholder="Your answer..."
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            padding: '15px',
                                            border: '2px solid #e1e5e9',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            outline: 'none',
                                            resize: 'vertical',
                                            transition: 'border-color 0.3s ease',
                                            boxSizing: 'border-box',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#a8edea'}
                                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                    />
                                </div>
                            ))}
                            
                            <div style={{ marginTop: '30px' }}>
                                <button
                                    onClick={() => goToStep(1)}
                                    style={{
                                        padding: '15px 30px',
                                        background: '#f1f5f9',
                                        color: '#374151',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginRight: '15px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#e1e5e9'}
                                    onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
                                >
                                    ← Back to Feature Description
                                </button>
                                <button
                                    onClick={reviewAnswers}
                                    style={{
                                        padding: '15px 30px',
                                        background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 25px rgba(168, 237, 234, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    Next: Review Answers →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review Answers */}
                    {currentStep === 3 && (
                        <div>
                            <h2 style={{ color: '#333', marginBottom: '20px' }}>Step 3: Review Your Answers</h2>
                            <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
                                Review your responses below. You can go back to make changes or proceed to generate your PRD.
                            </p>
                            
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '25px'
                            }}>
                                <div style={{
                                    marginBottom: '15px',
                                    paddingBottom: '15px',
                                    borderBottom: '1px solid #e1e5e9'
                                }}>
                                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                                        Feature Description:
                                    </div>
                                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                                        {initialIdea}
                                    </div>
                                </div>
                                
                                {clarifyingQuestions.map((q) => {
                                    if (!answers[q.id]) return null;
                                    return (
                                        <div key={q.id} style={{
                                            marginBottom: '15px',
                                            paddingBottom: '15px',
                                            borderBottom: '1px solid #e1e5e9'
                                        }}>
                                            <div style={{ fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                                                {q.title}:
                                            </div>
                                            <div style={{ color: '#666', fontStyle: 'italic' }}>
                                                {answers[q.id]}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => goToStep(2)}
                                    style={{
                                        padding: '15px 30px',
                                        background: '#f1f5f9',
                                        color: '#374151',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#e1e5e9'}
                                    onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
                                >
                                    ← Edit Answers
                                </button>
                                <button
                                    onClick={generatePRD}
                                    disabled={loading}
                                    style={{
                                        padding: '15px 30px',
                                        background: loading ? '#9ca3af' : 'linear-gradient(135deg, #a8edea, #fed6e3)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!loading) {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 8px 25px rgba(168, 237, 234, 0.3)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    {loading ? '📋 Generating PRD...' : 'Generate PRD →'}
                                </button>
                                {generatedPrompt && (
                                    <button
                                        onClick={() => {
                                            alert('Current Prompt:\n\n' + generatedPrompt);
                                        }}
                                        style={{
                                            padding: '15px 24px',
                                            background: '#f3f4f6',
                                            color: '#4b5563',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
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
                        </div>
                    )}

                    {/* Step 4: Generated PRD */}
                    {currentStep === 4 && (
                        <div>
                            <h2 style={{ color: '#333', marginBottom: '20px' }}>Step 4: Your Product Requirements Document</h2>
                            
                            <div style={{
                                background: '#f0f9ff',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                                border: '2px dashed #0ea5e9',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ color: '#0ea5e9', margin: '0 0 10px 0' }}>📄 PRD Generated Successfully!</h3>
                                <p style={{ margin: '0 0 15px 0' }}>Your Product Requirements Document is ready for download.</p>
                                <div style={{
                                    background: 'white',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace',
                                    color: '#374151',
                                    margin: '10px 0',
                                    border: '1px solid #e1e5e9'
                                }}>
                                    prd-{featureName.toLowerCase().replace(/\s+/g, '-')}.md
                                </div>
                                <button
                                    onClick={handleSavePRD}
                                    style={{
                                        padding: '15px 30px',
                                        background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 25px rgba(168, 237, 234, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    📥 Download PRD
                                </button>
                            </div>
                            
                            <h3 style={{ color: '#333', marginBottom: '15px' }}>Preview:</h3>
                            <div style={{
                                background: '#1e293b',
                                color: '#e2e8f0',
                                borderRadius: '12px',
                                padding: '25px',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                maxHeight: '500px',
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                                marginBottom: '20px'
                            }}>
                                {generatedPRD || 'Generating PRD...'}
                            </div>
                            
                            <div style={{ marginTop: '30px' }}>
                                <button
                                    onClick={() => goToStep(3)}
                                    style={{
                                        padding: '15px 30px',
                                        background: '#f1f5f9',
                                        color: '#374151',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginRight: '15px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#e1e5e9'}
                                    onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
                                >
                                    ← Back to Review
                                </button>
                                <button
                                    onClick={startOver}
                                    style={{
                                        padding: '15px 30px',
                                        background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 25px rgba(168, 237, 234, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    🔄 Create New PRD
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}