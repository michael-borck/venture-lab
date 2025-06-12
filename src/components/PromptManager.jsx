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

    const specialTabs = [
        { id: 'templates', name: '📚 Templates', color: '#7c3aed' },
        { id: 'tips', name: '💡 Tips', color: '#059669' }
    ];

    const promptTemplates = {
        idea_forge: [
            {
                name: "Creative Innovation",
                description: "Generate highly creative and unconventional business ideas",
                template: `Generate a highly innovative business idea for the {industry} industry.

Requirements:
- Innovation level: {innovation_level}/10 (where 10 is completely revolutionary)
- Target market: {target_market}
- Focus on solving real problems with creative solutions
- Consider emerging technologies and trends
- Think beyond traditional business models

Please provide:
1. Business idea name and one-line description
2. Problem it solves
3. Unique value proposition
4. Target customers
5. Revenue model
6. Key differentiators
7. Implementation challenges and solutions

Be creative and think outside the box!`,
                variables: ["industry", "innovation_level", "target_market"]
            },
            {
                name: "Sustainable Business",
                description: "Focus on environmentally conscious business opportunities",
                template: `Create a sustainable business idea for the {industry} industry.

Focus Areas:
- Environmental sustainability
- Social impact
- Circular economy principles
- Innovation level: {innovation_level}/10

Requirements:
1. Address a significant environmental or social challenge
2. Demonstrate clear sustainability benefits
3. Ensure economic viability
4. Consider ESG (Environmental, Social, Governance) factors

Provide:
- Business concept and mission
- Environmental/social problem addressed
- Sustainable solution approach
- Impact measurement metrics
- Revenue model that supports sustainability
- Scalability potential
- Partnership opportunities with NGOs or government`,
                variables: ["industry", "innovation_level"]
            },
            {
                name: "Tech Disruption",
                description: "Leverage emerging technologies for business innovation",
                template: `Design a technology-driven business idea for {industry}.

Technology Focus:
- Leverage emerging tech (AI, blockchain, IoT, AR/VR, etc.)
- Innovation level: {innovation_level}/10
- Target market: {target_market}

Requirements:
1. Identify a technology gap or opportunity
2. Explain how technology solves existing problems
3. Consider user adoption challenges
4. Address data privacy and security concerns

Deliver:
- Tech-enabled business model
- Technology stack overview
- User experience design principles
- Competitive advantage through technology
- Development roadmap (MVP to full product)
- Market entry strategy
- Potential technical challenges and solutions`,
                variables: ["industry", "innovation_level", "target_market"]
            }
        ],
        global_compass: [
            {
                name: "Market Entry Strategy",
                description: "Comprehensive analysis for entering new international markets",
                template: `Analyze the market opportunity for {business_idea} in {target_country}.

Analysis Framework:
1. Market Size & Opportunity
   - Total addressable market (TAM)
   - Market growth trends
   - Competitive landscape

2. Regulatory Environment
   - Legal requirements
   - Business registration process
   - Industry-specific regulations
   - Tax implications

3. Cultural Considerations
   - Consumer behavior patterns
   - Cultural norms affecting business
   - Communication preferences
   - Local business practices

4. Entry Strategy Recommendations
   - Recommended entry mode (direct, partnership, acquisition)
   - Timeline and milestones
   - Investment requirements
   - Risk mitigation strategies

5. Success Factors
   - Key success indicators
   - Critical partnerships needed
   - Local hiring considerations
   - Marketing and distribution channels

Provide actionable insights with specific recommendations.`,
                variables: ["business_idea", "target_country"]
            },
            {
                name: "Competitive Analysis",
                description: "Deep dive into competitive landscape and positioning",
                template: `Conduct a comprehensive competitive analysis for {business_idea} in {target_country}.

Competition Analysis:
1. Direct Competitors
   - Identify top 3-5 direct competitors
   - Market share and positioning
   - Pricing strategies
   - Strengths and weaknesses

2. Indirect Competitors
   - Alternative solutions customers use
   - Substitute products/services
   - Emerging competitive threats

3. Market Positioning
   - Gaps in current market offerings
   - Differentiation opportunities
   - Value proposition positioning
   - Target customer segments underserved

4. Competitive Strategy
   - Recommended positioning strategy
   - Pricing approach vs. competitors
   - Marketing differentiation tactics
   - Innovation opportunities

5. SWOT Analysis
   - Internal strengths and weaknesses
   - External opportunities and threats
   - Strategic recommendations

Include specific company names, market data, and strategic recommendations.`,
                variables: ["business_idea", "target_country"]
            }
        ],
        pitch_perfect: [
            {
                name: "Investor Pitch Coach",
                description: "Comprehensive feedback for investor presentations",
                template: `Analyze this investor pitch for {business_idea} and provide detailed coaching feedback.

Pitch Content: {pitch_content}

Evaluation Criteria:
1. Problem & Solution Clarity (1-10)
   - Is the problem clearly defined and compelling?
   - Does the solution effectively address the problem?
   - Feedback and improvement suggestions

2. Market Opportunity (1-10)
   - Market size validation and credibility
   - Target customer definition
   - Go-to-market strategy clarity

3. Business Model Viability (1-10)
   - Revenue model clarity
   - Unit economics and scalability
   - Competitive advantages

4. Team & Execution (1-10)
   - Team experience and expertise
   - Execution capability demonstration
   - Track record and credibility

5. Financial Projections (1-10)
   - Realistic and well-supported numbers
   - Clear path to profitability
   - Funding requirements justification

6. Presentation Quality (1-10)
   - Story flow and narrative
   - Slide design and clarity
   - Call to action effectiveness

For each section:
- Provide a score (1-10)
- List specific strengths
- Identify areas for improvement
- Give actionable recommendations
- Suggest specific changes or additions

Overall recommendation: [READY/NEEDS WORK/MAJOR REVISION]`,
                variables: ["business_idea", "pitch_content"]
            },
            {
                name: "Demo Day Preparation",
                description: "Optimize pitch for startup competitions and demo days",
                template: `Prepare this pitch for a {event_type} demo day presentation.

Pitch: {pitch_content}
Time Limit: {time_limit} minutes

Demo Day Optimization:
1. Time Management
   - Content allocation per minute
   - Pacing recommendations
   - Key messages per time segment

2. Audience Adaptation
   - Judge/audience profile considerations
   - Messaging adjustments for {event_type}
   - Industry-specific language and examples

3. Visual Impact
   - Slide design for large screen presentation
   - Key visual elements to emphasize
   - Demo or video integration suggestions

4. Memorable Moments
   - Hook opening statement
   - Key quotable phrases
   - Strong closing call-to-action

5. Q&A Preparation
   - Anticipated questions from judges
   - Concise answer frameworks
   - Evidence and data to have ready

6. Delivery Coaching
   - Voice projection and pacing
   - Body language and stage presence
   - Handling technical difficulties

Provide a restructured pitch outline optimized for the demo day format with specific timing and delivery notes.`,
                variables: ["event_type", "pitch_content", "time_limit"]
            }
        ],
        prd_generator: [
            {
                name: "SaaS Product Requirements",
                description: "Comprehensive PRD for software-as-a-service products",
                template: `Create a detailed Product Requirements Document for {product_name}, a SaaS solution for {target_market}.

Product Vision: {product_vision}

## 1. Executive Summary
- Product overview and mission
- Target market and user personas
- Key value propositions
- Success metrics

## 2. Product Goals & Objectives
- Primary business objectives
- User experience goals
- Technical objectives
- Timeline and milestones

## 3. User Stories & Requirements
### Core User Stories:
- As a [user type], I want [functionality] so that [benefit]
- Include at least 10 detailed user stories
- Prioritize features (Must-have, Should-have, Could-have)

## 4. Functional Requirements
### Core Features:
- User authentication and authorization
- Dashboard and analytics
- Data management capabilities
- Integration requirements
- Mobile responsiveness

### Advanced Features:
- API capabilities
- Third-party integrations
- Automation features
- Customization options

## 5. Technical Requirements
- System architecture overview
- Database requirements
- Security and compliance needs
- Performance requirements
- Scalability considerations

## 6. User Experience Design
- Information architecture
- User flow diagrams
- Key interface requirements
- Accessibility standards

## 7. Success Metrics & KPIs
- User acquisition metrics
- Engagement metrics
- Business metrics
- Technical performance metrics

Make the PRD actionable with specific requirements and acceptance criteria.`,
                variables: ["product_name", "target_market", "product_vision"]
            },
            {
                name: "Mobile App PRD",
                description: "Comprehensive requirements for mobile applications",
                template: `Generate a Product Requirements Document for {product_name}, a mobile app targeting {target_market}.

App Concept: {product_vision}

## 1. Product Overview
- App purpose and core value proposition
- Target platforms (iOS, Android, cross-platform)
- Market positioning and differentiation

## 2. User Research & Personas
- Primary user personas (3-5 detailed personas)
- User journey mapping
- Pain points and needs analysis
- Behavioral patterns and preferences

## 3. Feature Specifications

### MVP Features (Phase 1):
- Core functionality requirements
- Essential user flows
- Basic UI/UX requirements
- Performance standards

### Future Features (Phase 2+):
- Advanced functionality
- Premium features
- Social and sharing capabilities
- Personalization features

## 4. Technical Specifications
- Platform-specific requirements
- Device compatibility
- Offline functionality needs
- Data synchronization requirements
- Third-party SDK integrations

## 5. Design Requirements
- UI/UX guidelines and principles
- Branding and visual identity
- Accessibility requirements
- Responsive design considerations
- Platform-specific design patterns

## 6. Performance & Quality
- Loading time requirements
- Battery usage optimization
- Memory usage constraints
- Crash rate targets
- User rating goals

## 7. Monetization Strategy
- Revenue model (freemium, subscription, ads, etc.)
- In-app purchase requirements
- Analytics and tracking needs
- A/B testing framework

## 8. Launch & Marketing
- App store optimization requirements
- Launch strategy and timeline
- User acquisition plans
- Retention and engagement tactics

Include specific, measurable requirements with clear acceptance criteria.`,
                variables: ["product_name", "target_market", "product_vision"]
            }
        ]
    };

    const promptEngineeringTips = [
        {
            category: "Structure & Clarity",
            tips: [
                {
                    title: "Use Clear Instructions",
                    content: "Start with action verbs like 'Generate', 'Analyze', 'Create', 'Explain'. Be specific about what you want the AI to do.",
                    example: "✅ Generate 5 innovative business ideas for sustainable packaging\n❌ Tell me about packaging"
                },
                {
                    title: "Provide Context",
                    content: "Give background information that helps the AI understand the scope and requirements.",
                    example: "✅ As a startup consultant working with early-stage companies...\n❌ Help me with business ideas"
                },
                {
                    title: "Specify Output Format",
                    content: "Tell the AI exactly how you want the response structured (bullet points, numbered lists, paragraphs, etc.).",
                    example: "✅ Provide your analysis in numbered sections with bullet points\n❌ Give me some analysis"
                }
            ]
        },
        {
            category: "Variables & Personalization", 
            tips: [
                {
                    title: "Use Descriptive Variables",
                    content: "Variable names should be clear and self-explanatory. Use {industry} instead of {x}.",
                    example: "✅ {target_market}, {innovation_level}, {budget_range}\n❌ {a}, {b}, {c}"
                },
                {
                    title: "Provide Variable Examples",
                    content: "Give sample values to help users understand what to input for each variable.",
                    example: "✅ Industry (e.g., 'fintech', 'healthcare', 'education')\n❌ {industry}"
                },
                {
                    title: "Limit Variable Count",
                    content: "Use 3-7 variables maximum to keep prompts user-friendly and focused.",
                    example: "✅ Key variables: industry, target_market, budget\n❌ 15+ different variables"
                }
            ]
        },
        {
            category: "Effective Prompting",
            tips: [
                {
                    title: "Include Examples",
                    content: "Show the AI what good output looks like by providing examples or templates.",
                    example: "✅ Format: '1. Business Name: [Name] - [One-line description]'\n❌ List some businesses"
                },
                {
                    title: "Set Constraints",
                    content: "Define boundaries like word count, number of ideas, or specific requirements.",
                    example: "✅ Generate exactly 3 ideas, each with 2-3 sentences\n❌ Give me some ideas"
                },
                {
                    title: "Ask for Reasoning",
                    content: "Request explanations and justifications to get more valuable insights.",
                    example: "✅ Explain why this approach would work in the current market\n❌ Is this a good idea?"
                }
            ]
        },
        {
            category: "Business-Specific Tips",
            tips: [
                {
                    title: "Industry Context Matters",
                    content: "Different industries have unique terminology, regulations, and challenges. Tailor your prompts accordingly.",
                    example: "✅ Consider healthcare compliance (HIPAA) and regulatory requirements\n❌ Generic business advice"
                },
                {
                    title: "Specify Target Audience",
                    content: "Be clear about who the end users or customers are for more relevant outputs.",
                    example: "✅ For B2B SaaS targeting mid-market companies (100-500 employees)\n❌ For businesses"
                },
                {
                    title: "Include Market Context",
                    content: "Mention geographic markets, economic conditions, or trending factors.",
                    example: "✅ Consider the post-pandemic remote work trend in North America\n❌ General market conditions"
                }
            ]
        }
    ];

    const applyTemplate = async (template, toolId) => {
        setEditingPrompts(prev => ({ ...prev, [toolId]: template.template }));
        
        // Update sample variables with template defaults
        const templateVars = {};
        template.variables.forEach(varName => {
            // Find matching variable in the current prompt definition
            const promptVar = prompts[toolId]?.variables.find(v => v.name === varName);
            templateVars[varName] = promptVar?.example || `[${varName}]`;
        });
        
        setSampleVariables(prev => ({ ...prev, [toolId]: templateVars }));
        setSaveStatus(prev => ({ ...prev, [toolId]: null }));
        
        // Show success message
        setSaveStatus(prev => ({ ...prev, [toolId]: 'template-applied' }));
        setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [toolId]: null }));
        }, 2000);
    };

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
                    <div style={{ width: '20px' }}></div>
                    {specialTabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                color: activeTab === tab.id ? tab.color : undefined,
                                background: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                border: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid #cbd5e1'
                            }}
                        >
                            {tab.name}
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
                    {activeTab === 'templates' ? (
                        <div>
                            <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.8em' }}>
                                📚 Prompt Templates Library
                            </h2>
                            <p style={{ margin: '0 0 30px 0', color: '#666', lineHeight: '1.6' }}>
                                Professional prompt templates to help you get better results from AI. Click "Apply Template" to use any template as a starting point for your custom prompts.
                            </p>
                            
                            {tools.map(tool => (
                                <div key={tool.id} style={{ marginBottom: '40px' }}>
                                    <h3 style={{ 
                                        margin: '0 0 15px 0', 
                                        color: tool.color, 
                                        fontSize: '1.3em',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        {tool.name}
                                    </h3>
                                    
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                        gap: '15px'
                                    }}>
                                        {promptTemplates[tool.id]?.map((template, index) => (
                                            <div key={index} style={{
                                                background: '#f8fafc',
                                                border: '1px solid #e1e5e9',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}>
                                                <h4 style={{ 
                                                    margin: '0 0 8px 0', 
                                                    color: '#333',
                                                    fontSize: '1.1em'
                                                }}>
                                                    {template.name}
                                                </h4>
                                                <p style={{ 
                                                    margin: '0 0 15px 0', 
                                                    color: '#666',
                                                    fontSize: '0.9em',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {template.description}
                                                </p>
                                                
                                                <div style={{ 
                                                    marginBottom: '15px',
                                                    fontSize: '0.8em',
                                                    color: '#999'
                                                }}>
                                                    Variables: {template.variables.map(v => `{${v}}`).join(', ')}
                                                </div>
                                                
                                                <button
                                                    onClick={() => applyTemplate(template, tool.id)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 16px',
                                                        background: tool.color,
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9em',
                                                        fontWeight: '600',
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.opacity = '0.8'}
                                                    onMouseOut={(e) => e.target.style.opacity = '1'}
                                                >
                                                    Apply Template to {tool.name}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'tips' ? (
                        <div>
                            <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.8em' }}>
                                💡 Prompt Engineering Tips
                            </h2>
                            <p style={{ margin: '0 0 30px 0', color: '#666', lineHeight: '1.6' }}>
                                Master the art of prompt engineering with these proven techniques and best practices for getting better results from AI models.
                            </p>
                            
                            {promptEngineeringTips.map((category, categoryIndex) => (
                                <div key={categoryIndex} style={{ marginBottom: '40px' }}>
                                    <h3 style={{ 
                                        margin: '0 0 20px 0', 
                                        color: '#059669', 
                                        fontSize: '1.4em',
                                        borderBottom: '2px solid #059669',
                                        paddingBottom: '8px'
                                    }}>
                                        {category.category}
                                    </h3>
                                    
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                                        gap: '20px'
                                    }}>
                                        {category.tips.map((tip, tipIndex) => (
                                            <div key={tipIndex} style={{
                                                background: '#f0fdf4',
                                                border: '1px solid #bbf7d0',
                                                borderRadius: '12px',
                                                padding: '20px'
                                            }}>
                                                <h4 style={{ 
                                                    margin: '0 0 10px 0', 
                                                    color: '#059669',
                                                    fontSize: '1.1em'
                                                }}>
                                                    💡 {tip.title}
                                                </h4>
                                                <p style={{ 
                                                    margin: '0 0 15px 0', 
                                                    color: '#374151',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {tip.content}
                                                </p>
                                                
                                                <div style={{
                                                    background: 'white',
                                                    border: '1px solid #d1fae5',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    fontSize: '0.9em',
                                                    fontFamily: 'Monaco, Consolas, monospace'
                                                }}>
                                                    <strong style={{ color: '#059669' }}>Example:</strong>
                                                    <pre style={{ 
                                                        margin: '8px 0 0 0', 
                                                        whiteSpace: 'pre-wrap',
                                                        color: '#374151'
                                                    }}>
                                                        {tip.example}
                                                    </pre>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : prompts[activeTab] && (
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
                                        {saveStatus[activeTab] === 'template-applied' && (
                                            <span style={{ color: '#7c3aed', fontSize: '0.9em' }}>✓ Template applied</span>
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