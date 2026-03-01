# VentureLab 🚀

<!-- BADGES:START -->
[![ai](https://img.shields.io/badge/-ai-ff6f00?style=flat-square)](https://github.com/topics/ai) [![business-innovation](https://img.shields.io/badge/-business--innovation-blue?style=flat-square)](https://github.com/topics/business-innovation) [![desktop-application](https://img.shields.io/badge/-desktop--application-blue?style=flat-square)](https://github.com/topics/desktop-application) [![education](https://img.shields.io/badge/-education-blue?style=flat-square)](https://github.com/topics/education) [![entrepreneurship](https://img.shields.io/badge/-entrepreneurship-blue?style=flat-square)](https://github.com/topics/entrepreneurship) [![html](https://img.shields.io/badge/-html-e34f26?style=flat-square)](https://github.com/topics/html) [![javascript](https://img.shields.io/badge/-javascript-f7df1e?style=flat-square)](https://github.com/topics/javascript) [![market-research](https://img.shields.io/badge/-market--research-blue?style=flat-square)](https://github.com/topics/market-research) [![rust](https://img.shields.io/badge/-rust-000000?style=flat-square)](https://github.com/topics/rust) [![pitch-presentation](https://img.shields.io/badge/-pitch--presentation-blue?style=flat-square)](https://github.com/topics/pitch-presentation)
<!-- BADGES:END -->

> **Where AI meets entrepreneurship** - Your comprehensive AI-powered business laboratory for learning, experimenting, and launching ventures.

VentureLab is an educational desktop application that combines artificial intelligence with entrepreneurship education, providing four powerful tools to guide aspiring entrepreneurs through the complete business development journey.

## 🎯 What is VentureLab?

VentureLab transforms the way people learn entrepreneurship by providing AI-powered tools that simulate real-world business scenarios. Whether you're a student, educator, or aspiring entrepreneur, VentureLab offers a safe environment to experiment, learn, and iterate on business ideas.

### The Four Laboratory Tools

| Tool | Purpose | What It Does |
|------|---------|--------------|
| **🔥 Idea Forge** | Hypothesis Generation | Generate and refine innovative business ideas using AI-powered brainstorming with creativity controls and industry targeting |
| **🌍 Global Compass** | Market Research | Analyze market opportunities across different regions with AI-driven competitive landscape analysis and entry strategies |
| **🎤 Pitch Perfect** | Presentation Lab | Perfect your pitch with AI coaching, scoring, and improvement suggestions for various audiences and scenarios |
| **📋 PRD Generator** | Documentation Lab | Create comprehensive Product Requirements Documents through AI-guided workflows and clarifying questions |

## ✨ Key Features

### 🔒 **Enterprise-Grade Security**
- **Secure API Key Storage**: OS keychain integration (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- **Multiple AI Provider Support**: OpenAI, Anthropic, Gemini, and Ollama (including self-hosted)
- **Environment Variable Fallbacks**: Flexible configuration for different deployment scenarios

### 🤖 **Multi-AI Provider Support**
- **OpenAI**: GPT-4 and latest models
- **Anthropic**: Claude 3 (Opus, Sonnet, Haiku)
- **Google Gemini**: Gemini Pro and Gemini Pro Vision
- **Ollama**: Local and self-hosted models with bearer token authentication

### 🎓 **Educational Focus**
- **Learning-Oriented**: Designed specifically for entrepreneurship education
- **Safe Experimentation**: Low-stakes environment for testing business concepts
- **Iterative Process**: Encourages multiple attempts and refinement
- **Real-World Applicable**: Tools mirror actual business development processes

### 🛠 **Technical Excellence**
- **Cross-Platform**: Built with Tauri for Windows, macOS, and Linux
- **Modern Stack**: React frontend with Rust backend
- **Offline Capable**: Works with local AI models via Ollama
- **Export Functionality**: Save and share your work

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or later)
- **Rust** (latest stable)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/venturelab.git
   cd venturelab
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your AI provider:**
   - Launch the application
   - Go to Settings
   - Choose your preferred AI provider
   - Securely store your API key (stored in OS keychain)

4. **Run the development version:**
   ```bash
   npm run tauri dev
   ```

### Building for Production

```bash
npm run tauri build
```

## 🔧 Configuration

### AI Provider Setup

VentureLab supports multiple AI providers. Choose based on your needs:

#### **OpenAI** (Recommended for beginners)
- **Cost**: Pay-per-use
- **Setup**: Requires OpenAI API key
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Best for**: Consistent, high-quality outputs

#### **Anthropic Claude**
- **Cost**: Pay-per-use
- **Setup**: Requires Anthropic API key
- **Models**: Claude 3 Opus, Sonnet, Haiku
- **Best for**: Complex reasoning and analysis

#### **Google Gemini**
- **Cost**: Free tier available
- **Setup**: Requires Google AI API key
- **Models**: Gemini Pro, Gemini Pro Vision
- **Best for**: Cost-conscious users

#### **Ollama** (Recommended for privacy)
- **Cost**: Free (requires local hardware)
- **Setup**: Install Ollama locally or use hosted instance
- **Models**: Llama 3.1, Mistral, CodeLlama, and more
- **Best for**: Privacy, offline use, cost control

### Security Best Practices

- **API Keys**: Never share your API keys or commit them to version control
- **Keychain Storage**: VentureLab automatically stores keys securely in your OS keychain
- **Environment Variables**: For deployment, use environment variables:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GEMINI_API_KEY`
  - `OLLAMA_API_KEY` (for bearer token authentication)

## 📚 Usage Guide

### 🔥 Idea Forge
1. Enter keywords related to your interests or industry
2. Provide context about your background or market
3. Adjust creativity level (1-10)
4. Generate multiple business ideas
5. Refine and iterate based on AI feedback

### 🌍 Global Compass
1. Describe your product or service
2. Select target region(s)
3. Set budget and timeline constraints
4. Generate comprehensive market analysis
5. Review competitive landscape and entry strategies

### 🎤 Pitch Perfect
1. Choose pitch type (investor, customer, partner)
2. Select target audience
3. Set presentation duration
4. Input your current pitch
5. Receive detailed scoring and improvement suggestions

### 📋 PRD Generator
1. Start with your feature or product idea
2. Answer AI-guided clarifying questions
3. Provide details on user stories and requirements
4. Generate comprehensive PRD
5. Export for development teams

## 🏗 Architecture

VentureLab is built using modern, secure technologies:

### Frontend
- **React 18**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **Modern CSS**: Responsive design

### Backend
- **Tauri**: Secure desktop application framework
- **Rust**: Memory-safe systems programming
- **Keyring**: Secure credential storage
- **Async/Await**: Efficient concurrent operations

### AI Integration
- **Multi-Provider Support**: Unified interface for different AI services
- **Secure Communication**: All API calls use HTTPS
- **Error Handling**: Graceful degradation and user feedback

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Areas for Contribution

- **New AI Providers**: Add support for additional AI services
- **Educational Content**: Create templates and examples
- **UI/UX Improvements**: Enhance user experience
- **Documentation**: Improve guides and tutorials
- **Testing**: Add test coverage
- **Localization**: Translate to other languages

## 📊 Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Multi-AI provider support
- [x] Secure API key management
- [x] Basic tool implementations
- [x] Cross-platform desktop app

### Phase 2: Enhanced UX (Current)
- [ ] Improved provider selection UI
- [ ] Cost estimation and warnings
- [ ] Better error handling and feedback
- [ ] Onboarding flow

### Phase 3: Advanced Features
- [ ] Collaborative features
- [ ] Template library
- [ ] Export improvements
- [ ] Analytics and insights

### Phase 4: Educational Integration
- [ ] Curriculum integration
- [ ] Progress tracking
- [ ] Instructor dashboard
- [ ] Student portfolios

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/) - The secure desktop app framework
- AI providers: [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), [Google](https://ai.google.dev/), [Ollama](https://ollama.ai/)
- Icons and design inspiration from the open source community

## 📞 Support

- **Documentation**: Check our [Wiki](../../wiki)
- **Issues**: Report bugs or request features in [Issues](../../issues)
- **Discussions**: Join the conversation in [Discussions](../../discussions)
- **Email**: support@venturelab.ai (coming soon)

---

**VentureLab** - Where great ventures begin! 🚀

*"The best time to plant a tree was 20 years ago. The second best time is now."* - Applied to entrepreneurship, the best time to start learning is now, and VentureLab is here to help.