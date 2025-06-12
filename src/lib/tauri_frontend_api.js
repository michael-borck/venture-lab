// src/lib/tauri_frontend_api.js
import { invoke } from '@tauri-apps/api/core';

// Settings Management
export async function saveSettings(settings) {
    try {
        await invoke('save_settings', { settings });
        return { success: true };
    } catch (error) {
        console.error('Failed to save settings:', error);
        return { success: false, error: error.toString() };
    }
}

export async function loadSettings() {
    try {
        const settings = await invoke('load_settings');
        return { success: true, data: settings };
    } catch (error) {
        console.error('Failed to load settings:', error);
        return { 
            success: false, 
            error: error.toString(),
            data: getDefaultSettings() 
        };
    }
}

export function getDefaultSettings() {
    return {
        preferred_provider: 'ollama',
        openai: {
            provider_type: 'openai',
            base_url: 'https://api.openai.com/v1',
            model: 'gpt-4',
            enabled: false
        },
        anthropic: {
            provider_type: 'anthropic',
            base_url: 'https://api.anthropic.com',
            model: 'claude-3-sonnet-20240229',
            enabled: false
        },
        gemini: {
            provider_type: 'gemini',
            base_url: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-pro',
            enabled: false
        },
        ollama: {
            provider_type: 'ollama',
            base_url: 'http://localhost:11434',
            model: 'llama3.1',
            enabled: true
        }
    };
}

// Secure API Key Management
export async function storeApiKey(provider, apiKey) {
    try {
        await invoke('store_api_key', { provider, apiKey });
        return { success: true };
    } catch (error) {
        console.error('Failed to store API key:', error);
        return { success: false, error: error.toString() };
    }
}

export async function retrieveApiKey(provider) {
    try {
        const apiKey = await invoke('retrieve_api_key', { provider });
        return { success: true, apiKey };
    } catch (error) {
        console.error('Failed to retrieve API key:', error);
        return { success: false, error: error.toString(), apiKey: null };
    }
}

export async function deleteApiKey(provider) {
    try {
        await invoke('delete_api_key', { provider });
        return { success: true };
    } catch (error) {
        console.error('Failed to delete API key:', error);
        return { success: false, error: error.toString() };
    }
}

export async function checkApiKeyExists(provider) {
    try {
        const exists = await invoke('check_api_key_exists', { provider });
        return { success: true, exists };
    } catch (error) {
        console.error('Failed to check API key:', error);
        return { success: false, exists: false, error: error.toString() };
    }
}

export async function getAllApiKeyStatus() {
    try {
        const status = await invoke('get_all_api_key_status');
        return { success: true, status };
    } catch (error) {
        console.error('Failed to get API key status:', error);
        return { success: false, status: {}, error: error.toString() };
    }
}

export async function testKeychainAccess() {
    try {
        await invoke('test_keychain_access');
        return { success: true };
    } catch (error) {
        console.error('Keychain test failed:', error);
        return { success: false, error: error.toString() };
    }
}

// Connection testing
export async function testProviderConnection(providerType) {
    try {
        const result = await invoke('test_provider_connection', { providerType });
        return result;
    } catch (error) {
        console.error('Connection test failed:', error);
        return {
            success: false,
            error: error.toString(),
            models: null
        };
    }
}

export async function testCustomProviderConnection(providerConfig) {
    try {
        const result = await invoke('test_custom_provider_connection', { providerConfig });
        return result;
    } catch (error) {
        console.error('Custom connection test failed:', error);
        return {
            success: false,
            error: error.toString(),
            models: null
        };
    }
}

// Model listing
export async function listAvailableModels(providerType) {
    try {
        const models = await invoke('list_available_models', { providerType });
        return { success: true, models };
    } catch (error) {
        console.error('Failed to list models:', error);
        return { success: false, models: [], error: error.toString() };
    }
}

// AI Generation (v1 - backward compatibility)
export async function generateAIResponse(prompt, temperature = 0.7, toolType = 'general') {
    try {
        const request = {
            prompt,
            temperature,
            tool_type: toolType
        };
        
        const response = await invoke('generate_ai_response', { request });
        return response;
    } catch (error) {
        console.error('Failed to generate AI response:', error);
        return {
            content: '',
            provider: 'error',
            success: false,
            error: error.toString()
        };
    }
}

// AI Generation (v2 - new API)
export async function generateAIResponseV2(request) {
    try {
        const response = await invoke('generate_ai_response_v2', { request });
        return response;
    } catch (error) {
        console.error('Failed to generate AI response v2:', error);
        return {
            content: '',
            provider: 'error',
            model: '',
            success: false,
            error: error.toString(),
            usage: null
        };
    }
}

// Helper to create AI request with defaults
export function createAIRequest(prompt, options = {}) {
    return {
        prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        system_message: options.systemMessage || null,
        context: options.context || null
    };
}

// Provider configuration helper
export function createProviderConfig(type, baseUrl, model) {
    return {
        provider_type: type,
        base_url: baseUrl,
        model: model,
        enabled: true
    };
}

// Default provider configurations
export const DEFAULT_PROVIDERS = {
    openai: {
        base_url: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'],
        default_model: 'gpt-4'
    },
    anthropic: {
        base_url: 'https://api.anthropic.com',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        default_model: 'claude-3-sonnet-20240229'
    },
    gemini: {
        base_url: 'https://generativelanguage.googleapis.com/v1beta',
        models: ['gemini-pro', 'gemini-pro-vision'],
        default_model: 'gemini-pro'
    },
    ollama: {
        base_url: 'http://localhost:11434',
        models: ['llama3.1', 'llama3.1:8b', 'llama3.1:70b', 'llama3.2', 'codellama', 'mistral', 'gemma', 'qwen', 'phi'],
        default_model: 'llama3.1'
    }
};

// File Operations
export async function saveFileToDownloads(filename, content) {
    try {
        const filePath = await invoke('save_file_to_downloads', { filename, content });
        return { success: true, filePath };
    } catch (error) {
        console.error('Failed to save file:', error);
        return { success: false, error: error.toString() };
    }
}

// Utility Functions for Different Tools
export function generateIdeaForgePrompt(keywords, context, creativity) {
    let creativityDescriptor = creativity <= 3 ? "conservative and practical" : 
                            creativity <= 7 ? "moderately innovative" : 
                            "highly creative and unconventional";
    
    let prompt = `Generate 3 ${creativityDescriptor} business ideas based on: ${keywords}`;
    
    if (context) {
        prompt += `\n\nAdditional context: ${context}`;
    }
    
    prompt += `\n\nFor each idea, provide:
1. A catchy business name
2. Brief description (2-3 sentences)
3. Target market
4. Key value proposition
5. One potential challenge

Creativity level: ${creativity}/10 (${creativityDescriptor})`;
    
    return prompt;
}

export function generateGlobalCompassPrompt(product, region, budget, timeline, context, detail) {
    let detailLevel = detail <= 3 ? "concise" : detail <= 7 ? "detailed" : "comprehensive";
    
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

Detail Level: ${detail}/10 (${detailLevel} analysis)`;
    
    return prompt;
}

export function generatePitchPerfectPrompt(pitchType, audience, duration, industry, content, feedback) {
    let feedbackStyle = feedback <= 3 ? "gentle and supportive" : 
                      feedback <= 7 ? "balanced and constructive" : 
                      "detailed and rigorous";
    
    let prompt = `Analyze this ${pitchType} pitch for ${audience} (${duration})`;
    if (industry) prompt += ` in the ${industry} industry`;
    prompt += ` with ${feedbackStyle} feedback:\n\n"${content}"\n\n`;
    
    prompt += `Please provide:
1. Overall Score (1-10) for:
   - Clarity & Structure
   - Persuasiveness
   - Audience Fit
   - Call to Action

2. Strengths: What works well
3. Areas for Improvement: Specific issues to address
4. Suggestions: Concrete recommendations for enhancement
5. Rewrite Suggestion: How to improve the opening/closing

Feedback Style: ${feedback}/10 (${feedbackStyle})`;
    
    return prompt;
}

export function generatePRDPrompt(answers) {
    const clarifyingQuestions = [
        { id: 'problem', title: 'Problem & Goal' },
        { id: 'targetUser', title: 'Target User' },
        { id: 'coreActions', title: 'Core Functionality' },
        { id: 'userStories', title: 'User Stories' },
        { id: 'acceptance', title: 'Success Criteria' },
        { id: 'nonGoals', title: 'Scope & Boundaries' },
        { id: 'dataRequirements', title: 'Data Requirements' },
        { id: 'designConsiderations', title: 'Design & UI' },
        { id: 'edgeCases', title: 'Edge Cases' }
    ];

    let prompt = `Create a comprehensive Product Requirements Document (PRD) based on the following information:

**Feature Description:** ${answers.initialIdea}
**Feature Name:** ${answers.featureName}

**Detailed Requirements:**
`;

    clarifyingQuestions.forEach(q => {
        if (answers[q.id]) {
            prompt += `\n**${q.title}:** ${answers[q.id]}`;
        }
    });

    prompt += `

Please generate a complete PRD with the following structure:
1. Introduction/Overview
2. Goals
3. User Stories
4. Functional Requirements (numbered)
5. Non-Goals (Out of Scope)
6. Design Considerations (if applicable)
7. Technical Considerations (if applicable)
8. Success Metrics
9. Open Questions

The PRD should be clear, actionable, and suitable for a junior developer to understand and implement. Use markdown formatting for headers and lists.`;

    return prompt;
}

// React Hook for Settings
import { useState, useEffect } from 'react';

export function useSettings() {
    const [settings, setSettings] = useState(getDefaultSettings());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSettings().then(result => {
            if (result.success) {
                setSettings(result.data);
            } else {
                setError(result.error);
                setSettings(result.data); // Use default settings
            }
            setLoading(false);
        });
    }, []);

    const saveSettingsAndUpdate = async (newSettings) => {
        const result = await saveSettings(newSettings);
        if (result.success) {
            setSettings(newSettings);
            setError(null);
        } else {
            setError(result.error);
        }
        return result;
    };

    return {
        settings,
        setSettings: saveSettingsAndUpdate,
        loading,
        error
    };
}