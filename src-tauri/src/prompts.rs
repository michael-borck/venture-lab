use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolPrompt {
    pub id: String,
    pub name: String,
    pub description: String,
    pub template: String,
    pub variables: Vec<PromptVariable>,
    pub system_message: Option<String>,
    pub is_custom: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptVariable {
    pub name: String,
    pub description: String,
    pub example: String,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptCollection {
    pub version: String,
    pub prompts: HashMap<String, ToolPrompt>,
}

impl Default for PromptCollection {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            prompts: get_default_prompts(),
        }
    }
}

pub fn get_default_prompts() -> HashMap<String, ToolPrompt> {
    let mut prompts = HashMap::new();

    // Idea Forge Default Prompt
    prompts.insert("idea_forge".to_string(), ToolPrompt {
        id: "idea_forge".to_string(),
        name: "Idea Forge - Business Idea Generator".to_string(),
        description: "Generates innovative business ideas with creativity controls".to_string(),
        template: r#"Generate 3 {creativity_descriptor} business ideas based on: {keywords}

{context_section}

For each idea, provide:
1. A catchy business name
2. Brief description (2-3 sentences)
3. Target market
4. Key value proposition
5. One potential challenge

Creativity level: {creativity}/10 ({creativity_descriptor})

Format your response as a numbered list with clear sections for each idea."#.to_string(),
        variables: vec![
            PromptVariable {
                name: "keywords".to_string(),
                description: "Industry keywords or focus areas".to_string(),
                example: "sustainability, healthcare, fintech".to_string(),
                required: true,
            },
            PromptVariable {
                name: "creativity".to_string(),
                description: "Creativity level (1-10)".to_string(),
                example: "7".to_string(),
                required: true,
            },
            PromptVariable {
                name: "creativity_descriptor".to_string(),
                description: "Creativity level description".to_string(),
                example: "moderately innovative".to_string(),
                required: true,
            },
            PromptVariable {
                name: "context_section".to_string(),
                description: "Additional context if provided".to_string(),
                example: "Additional context: Target B2B market".to_string(),
                required: false,
            },
        ],
        system_message: Some("You are an expert business consultant helping entrepreneurs generate innovative business ideas. Provide practical, actionable suggestions.".to_string()),
        is_custom: false,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    });

    // Global Compass Default Prompt
    prompts.insert("global_compass".to_string(), ToolPrompt {
        id: "global_compass".to_string(),
        name: "Global Compass - Market Analysis".to_string(),
        description: "Analyzes market entry opportunities across different regions".to_string(),
        template: r#"Provide a {detail_level} market entry analysis for: {product} in {region}

{budget_section}
{timeline_section}
{context_section}

Please analyze:
1. Market Opportunity & Size
2. Cultural Considerations & Business Practices
3. Regulatory & Legal Requirements
4. Competitive Landscape
5. Entry Strategy Recommendations
6. Risk Assessment
7. Success Factors & KPIs

Detail Level: {detail}/10 ({detail_level} analysis)

Please provide specific, actionable insights with concrete data points where possible. Focus on practical implementation steps and realistic market entry strategies."#.to_string(),
        variables: vec![
            PromptVariable {
                name: "product".to_string(),
                description: "Product or service to analyze".to_string(),
                example: "SaaS platform for small businesses".to_string(),
                required: true,
            },
            PromptVariable {
                name: "region".to_string(),
                description: "Target market region".to_string(),
                example: "Germany".to_string(),
                required: true,
            },
            PromptVariable {
                name: "detail".to_string(),
                description: "Analysis detail level (1-10)".to_string(),
                example: "7".to_string(),
                required: true,
            },
            PromptVariable {
                name: "detail_level".to_string(),
                description: "Detail level description".to_string(),
                example: "in-depth analysis".to_string(),
                required: true,
            },
            PromptVariable {
                name: "budget_section".to_string(),
                description: "Budget information if provided".to_string(),
                example: "Budget: $250k - $1M".to_string(),
                required: false,
            },
            PromptVariable {
                name: "timeline_section".to_string(),
                description: "Timeline information if provided".to_string(),
                example: "Timeline: 6-12 months".to_string(),
                required: false,
            },
            PromptVariable {
                name: "context_section".to_string(),
                description: "Additional context if provided".to_string(),
                example: "Additional context: Focus on enterprise customers".to_string(),
                required: false,
            },
        ],
        system_message: Some("You are an expert international business consultant specializing in market entry strategies. Provide detailed, practical analysis with specific data points and actionable recommendations.".to_string()),
        is_custom: false,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    });

    // Pitch Perfect Default Prompt
    prompts.insert("pitch_perfect".to_string(), ToolPrompt {
        id: "pitch_perfect".to_string(),
        name: "Pitch Perfect - Presentation Coach".to_string(),
        description: "Provides AI coaching for pitch presentations with scoring and feedback".to_string(),
        template: r#"Analyze this {pitch_type} pitch for {audience}{duration_section}{industry_section} with {feedback_level} feedback:

"{pitch_content}"

Please provide a detailed analysis with:

1. **SCORES (1-10) for each category:**
   - Clarity & Structure: How well organized and easy to follow
   - Persuasiveness: How compelling and convincing the argument is
   - Audience Fit: How well tailored to the specific audience
   - Call to Action: How clear and actionable the ask is

2. **STRENGTHS:** What works well in the current pitch

3. **AREAS FOR IMPROVEMENT:** Specific issues that need attention

4. **CONCRETE SUGGESTIONS:** Actionable recommendations for enhancement

5. **REWRITE SUGGESTIONS:** Specific improvements for opening/closing

Feedback Style: {feedback_style}/10 ({feedback_level} analysis)

Provide specific, actionable advice that helps improve presentation effectiveness and audience engagement."#.to_string(),
        variables: vec![
            PromptVariable {
                name: "pitch_type".to_string(),
                description: "Type of pitch presentation".to_string(),
                example: "investor".to_string(),
                required: true,
            },
            PromptVariable {
                name: "audience".to_string(),
                description: "Target audience for the pitch".to_string(),
                example: "investors".to_string(),
                required: true,
            },
            PromptVariable {
                name: "pitch_content".to_string(),
                description: "The actual pitch content to analyze".to_string(),
                example: "Hi, I'm Sarah presenting EcoClean...".to_string(),
                required: true,
            },
            PromptVariable {
                name: "feedback_style".to_string(),
                description: "Feedback intensity level (1-10)".to_string(),
                example: "7".to_string(),
                required: true,
            },
            PromptVariable {
                name: "feedback_level".to_string(),
                description: "Feedback style description".to_string(),
                example: "detailed and thorough".to_string(),
                required: true,
            },
            PromptVariable {
                name: "duration_section".to_string(),
                description: "Duration information if provided".to_string(),
                example: " (5-10 minutes)".to_string(),
                required: false,
            },
            PromptVariable {
                name: "industry_section".to_string(),
                description: "Industry information if provided".to_string(),
                example: " in the fintech industry".to_string(),
                required: false,
            },
        ],
        system_message: Some("You are an expert presentation coach specializing in business pitches. Provide specific, actionable feedback with clear scores and concrete suggestions for improvement.".to_string()),
        is_custom: false,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    });

    // PRD Generator Default Prompt
    prompts.insert("prd_generator".to_string(), ToolPrompt {
        id: "prd_generator".to_string(),
        name: "PRD Generator - Product Requirements".to_string(),
        description: "Creates comprehensive Product Requirements Documents through guided workflow".to_string(),
        template: r#"Create a comprehensive Product Requirements Document (PRD) for the following feature:

**Feature Name:** {feature_name}

**Initial Description:** {initial_idea}

**Detailed Requirements:**
{formatted_answers}

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

Make the PRD comprehensive but practical, focusing on clarity and implementability."#.to_string(),
        variables: vec![
            PromptVariable {
                name: "feature_name".to_string(),
                description: "Name of the feature being documented".to_string(),
                example: "User Profile Management".to_string(),
                required: true,
            },
            PromptVariable {
                name: "initial_idea".to_string(),
                description: "Initial feature description".to_string(),
                example: "A system for users to manage their profile information".to_string(),
                required: true,
            },
            PromptVariable {
                name: "formatted_answers".to_string(),
                description: "Formatted answers from clarifying questions".to_string(),
                example: "**Problem & Goal:** Users need to update their information easily".to_string(),
                required: true,
            },
        ],
        system_message: Some("You are an expert product manager specializing in creating comprehensive Product Requirements Documents. Generate clear, actionable PRDs that development teams can follow to build features successfully.".to_string()),
        is_custom: false,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    });

    prompts
}

pub fn get_prompts_path(app_handle: &AppHandle) -> Result<std::path::PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join("prompts.json"))
}

pub async fn load_prompts(app_handle: &AppHandle) -> Result<PromptCollection, String> {
    let prompts_path = get_prompts_path(app_handle)?;
    
    if !prompts_path.exists() {
        // Create default prompts file if it doesn't exist
        let default_collection = PromptCollection::default();
        save_prompts(app_handle, &default_collection).await?;
        return Ok(default_collection);
    }
    
    let contents = tokio::fs::read_to_string(&prompts_path)
        .await
        .map_err(|e| format!("Failed to read prompts file: {}", e))?;
    
    let collection: PromptCollection = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse prompts file: {}", e))?;
    
    Ok(collection)
}

pub async fn save_prompts(app_handle: &AppHandle, collection: &PromptCollection) -> Result<(), String> {
    let prompts_path = get_prompts_path(app_handle)?;
    
    let contents = serde_json::to_string_pretty(collection)
        .map_err(|e| format!("Failed to serialize prompts: {}", e))?;
    
    tokio::fs::write(&prompts_path, contents)
        .await
        .map_err(|e| format!("Failed to write prompts file: {}", e))?;
    
    Ok(())
}

pub async fn save_prompt(app_handle: &AppHandle, tool_id: &str, prompt: ToolPrompt) -> Result<(), String> {
    let mut collection = load_prompts(app_handle).await?;
    
    let mut updated_prompt = prompt;
    updated_prompt.is_custom = true;
    updated_prompt.updated_at = chrono::Utc::now().to_rfc3339();
    
    collection.prompts.insert(tool_id.to_string(), updated_prompt);
    save_prompts(app_handle, &collection).await?;
    
    Ok(())
}

pub async fn reset_prompt(app_handle: &AppHandle, tool_id: &str) -> Result<(), String> {
    let mut collection = load_prompts(app_handle).await?;
    let default_prompts = get_default_prompts();
    
    if let Some(default_prompt) = default_prompts.get(tool_id) {
        collection.prompts.insert(tool_id.to_string(), default_prompt.clone());
        save_prompts(app_handle, &collection).await?;
    } else {
        return Err(format!("No default prompt found for tool: {}", tool_id));
    }
    
    Ok(())
}

pub async fn export_prompts(app_handle: &AppHandle) -> Result<String, String> {
    let collection = load_prompts(app_handle).await?;
    
    let export_data = serde_json::to_string_pretty(&collection)
        .map_err(|e| format!("Failed to serialize prompts for export: {}", e))?;
    
    Ok(export_data)
}

pub async fn import_prompts(app_handle: &AppHandle, import_data: &str) -> Result<(), String> {
    let imported_collection: PromptCollection = serde_json::from_str(import_data)
        .map_err(|e| format!("Failed to parse imported prompts: {}", e))?;
    
    // Mark all imported prompts as custom
    let mut collection = imported_collection;
    for (_, prompt) in collection.prompts.iter_mut() {
        prompt.is_custom = true;
        prompt.updated_at = chrono::Utc::now().to_rfc3339();
    }
    
    save_prompts(app_handle, &collection).await?;
    Ok(())
}