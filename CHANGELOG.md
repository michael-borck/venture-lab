# Changelog

All notable changes to VentureLab will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Cross-platform release builds for Windows, macOS, and Linux
- Automated GitHub Actions workflow for releases

## [1.0.0] - 2024-12-06

### Added
- 🔥 **Idea Forge Tool** - AI-powered business idea generation with industry targeting and innovation controls
- 🌍 **Global Compass Tool** - International market research and competitive analysis
- 🎤 **Pitch Perfect Tool** - AI coaching for investor presentations with scoring and feedback
- 📋 **PRD Generator Tool** - Multi-step Product Requirements Document creation workflow
- 🔐 **Secure API Key Management** - OS-native keychain integration for all AI providers
- 📊 **Usage Tracking System** - Monitor AI costs, token usage, and tool statistics
- 🧠 **Advanced Prompt Management** - Custom prompt engineering with templates and examples
- 📚 **Educational Resources** - Built-in documentation, tips, and best practices
- 🤖 **Multi-Provider AI Support** - Ollama, OpenAI, Anthropic, and Google Gemini integration
- ⚡ **Error Handling & Retry Logic** - Robust API error handling with exponential backoff
- 🔍 **API Key Validation** - Format validation and visual feedback for all providers
- 💰 **Cost Management** - Usage warnings, export functionality, and budget tracking
- 🛡️ **Security Best Practices** - Encrypted storage, secure transmission, and safety guidelines
- 📖 **Comprehensive Documentation** - In-app help system and GitHub Pages documentation
- 🎓 **Prompt Engineering Education** - Templates library and engineering tips for better AI results

### Security
- API keys stored in OS-native secure storage (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- No API keys stored in plain text or configuration files
- Secure HTTPS communication with all AI providers
- Input validation and sanitization for all user inputs

### Performance
- Optimized database queries for usage tracking
- Efficient state management for real-time UI updates
- Lazy loading for heavy components and documentation
- Caching for AI provider model lists and connection status

## Release Notes

### Installation Requirements
- **Windows**: Windows 10 or later (x64)
- **macOS**: macOS 10.15 Catalina or later (Intel or Apple Silicon)
- **Linux**: Modern distribution with GTK 3.24+ (Ubuntu 20.04+, similar for other distros)

### Getting Started
1. Download the appropriate installer for your platform
2. Install and launch VentureLab
3. Choose an AI provider (start with Ollama for free local AI)
4. Configure your provider and test the connection
5. Explore the tools: Idea Forge → Global Compass → Pitch Perfect → PRD Generator
6. Check out the Templates and Tips in the Prompts section for better results

### AI Provider Setup
- **Ollama**: Free, runs locally - perfect for getting started
- **OpenAI**: Requires API key from platform.openai.com
- **Anthropic**: Requires API key from console.anthropic.com  
- **Google Gemini**: Requires API key from makersuite.google.com

For detailed setup instructions, see the built-in Documentation or visit our [GitHub Pages](https://github.com/michael-borck/venture-lab/tree/main/docs).

---

**Note**: This is the initial release of VentureLab. We're excited to see what you build with it!