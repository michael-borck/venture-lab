# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VentureLab is an AI-powered desktop application for entrepreneurship education, built with Tauri (Rust backend) and React (frontend). It provides four main AI tools: Idea Forge (business idea generation), Global Compass (market research), Pitch Perfect (pitch coaching), and PRD Generator (product requirements documentation).

## Development Commands

### Core Development
- `npm run dev` - Start Vite development server for frontend
- `npm run tauri:dev` - Start Tauri development app with hot reload
- `npm run build` - Build frontend for production
- `npm run tauri:build` - Build complete desktop application

### Prerequisites
- Node.js (v16+)
- Rust (latest stable)
- Platform-specific tools for Tauri bundling

## Architecture

### Frontend (React)
- **Entry Point**: `src/main.jsx` → `src/App.jsx`
- **Components**: Located in `src/components/`
  - `AIProvidersPage.jsx` - AI provider configuration
  - `PromptManager.jsx` - Prompt template management
  - `UsageStatsPage.jsx` - Usage analytics
  - Tool components: `IdeaForge.jsx`, `GlobalCompass.jsx`, `PitchPerfect.jsx`, `PRDGenerator.jsx`
- **API Layer**: `src/lib/tauri_frontend_api.js` - Tauri backend communication
- **Styling**: Inline styles with gradient backgrounds and glassmorphism effects

### Backend (Rust - Tauri)
- **Entry Point**: `src-tauri/src/main.rs` - Tauri command handlers
- **Core Modules**:
  - `settings.rs` - Application configuration management
  - `ai_providers.rs` - AI service integrations (OpenAI, Anthropic, Gemini, Ollama)
  - `secure_storage.rs` - OS keychain API key management
  - `prompts.rs` - Prompt template system with variable substitution
  - `usage_tracking.rs` - SQLite-based usage analytics
  - `error_handling.rs` - Structured error handling with retry logic
  - `key_validation.rs` - API key format validation

### AI Provider Architecture
- **Unified Interface**: `AIProvider` trait provides consistent API across providers
- **Request/Response**: Standardized `AIRequest` and `AIResponse` structures
- **Error Handling**: Provider-specific error parsing with retry logic
- **Security**: API keys stored in OS keychain, not in configuration files

### Database
- SQLite database for usage tracking (`usage_tracking.rs`)
- Application settings stored as JSON in Tauri app data directory
- Prompt templates stored as JSON with version control

## Configuration

### AI Providers
- Default configuration includes OpenAI, Anthropic, Gemini, and Ollama
- Ollama is the default provider (for local/offline use)
- API keys stored securely in OS keychain via `secure_storage.rs`
- Provider settings in `settings.rs` (base URLs, model names, enabled status)

### Environment Variables (Deployment)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `OLLAMA_API_KEY` (for bearer token authentication)

## Key Development Patterns

### Adding New AI Providers
1. Implement `AIProvider` trait in `ai_providers.rs`
2. Add provider configuration to `settings.rs`
3. Update provider validation in `key_validation.rs`
4. Add error handling patterns in `error_handling.rs`

### Adding New Tools
1. Create React component in `src/components/`
2. Add tool button and routing in `App.jsx`
3. Add prompt template in `prompts.rs`
4. Ensure usage tracking includes new tool type

### Prompt Template System
- Templates use `{{variable}}` syntax for substitution
- Each tool has customizable prompts with default fallbacks
- Variables have descriptions and examples for user guidance
- Templates support both required and optional variables

## Security Considerations

- API keys are never stored in configuration files or version control
- All API communication uses HTTPS
- Secure storage uses OS-native keychain services
- Input validation on all API key formats before storage
- Error messages are sanitized to prevent information leakage

## Testing AI Providers

Use the connection test functionality in `ai_providers.rs`:
- Tests API connectivity and authentication
- Validates API key formats before use
- Returns available models for each provider
- Handles timeout and network error scenarios

## Troubleshooting

- Check Tauri logs for backend errors
- Verify API key storage with `get_all_api_key_status()` command
- Test provider connections individually
- Monitor usage tracking database for API call patterns
- Use provider-specific error messages for debugging

## File Structure Notes

- `src-tauri/icons/` - Application icons for different platforms
- `docs/` - Comprehensive documentation and user guides
- `tasks/` - Development task tracking
- `src/compoments/` - Typo in directory name (should be `components`)