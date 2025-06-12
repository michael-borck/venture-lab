# AI Provider Setup Guide

This guide walks you through setting up each AI provider in VentureLab.

## 🔧 Ollama (Recommended for Getting Started)

Ollama runs AI models locally on your computer - completely free and private.

### Installation

#### Windows
1. Download Ollama from [ollama.ai](https://ollama.ai)
2. Run the installer
3. Open Command Prompt and verify: `ollama --version`

#### macOS
```bash
# Using Homebrew
brew install ollama

# Or download from ollama.ai
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Setting Up Models

1. **Start Ollama Service**
   ```bash
   ollama serve
   ```

2. **Download a Model**
   ```bash
   # Recommended starter model
   ollama pull llama3.1
   
   # Other popular models
   ollama pull mistral
   ollama pull codellama
   ollama pull gemma
   ```

3. **Configure in VentureLab**
   - Open AI Providers settings
   - Select Ollama as preferred provider
   - Server URL: `http://localhost:11434` (default)
   - Click "Test Connection"
   - Select your downloaded model

### Ollama Tips
- Keep the Ollama service running while using VentureLab
- Download models based on your RAM (8GB minimum recommended)
- Use smaller models for faster responses

## 🧠 OpenAI Setup

### Getting Your API Key

1. **Create OpenAI Account**
   - Visit [platform.openai.com](https://platform.openai.com)
   - Sign up or log in
   - Verify email and phone

2. **Generate API Key**
   - Go to API Keys section
   - Click "Create new secret key"
   - Name it (e.g., "VentureLab")
   - Copy the key immediately (shown only once!)

3. **Set Up Billing**
   - Go to Billing → Payment methods
   - Add a credit card
   - Set usage limits (recommended)

### Configure in VentureLab

1. Open AI Providers settings
2. Select OpenAI
3. Paste your API key
4. Choose model:
   - `gpt-4`: Most capable, more expensive
   - `gpt-3.5-turbo`: Good balance of cost/performance
5. Click "Test & Save"

### OpenAI Best Practices
- Start with GPT-3.5 for testing
- Set monthly spending limits
- Monitor usage regularly
- Use different keys for different projects

## 🎭 Anthropic (Claude) Setup

### Getting Your API Key

1. **Create Anthropic Account**
   - Visit [console.anthropic.com](https://console.anthropic.com)
   - Sign up for access
   - Wait for approval (may take time)

2. **Generate API Key**
   - Go to API Keys
   - Create new key
   - Save it securely

3. **Understand Pricing**
   - Check current rates
   - No free tier
   - Billed monthly

### Configure in VentureLab

1. Select Anthropic in AI Providers
2. Enter your API key (starts with `sk-ant-`)
3. Choose model:
   - `claude-3-opus`: Most capable
   - `claude-3-sonnet`: Balanced
   - `claude-3-haiku`: Fastest, cheapest
4. Test connection

### Anthropic Tips
- Great for long-form content
- Excellent at analysis tasks
- Consider for complex reasoning
- Higher context window than GPT

## 💎 Google Gemini Setup

### Getting Your API Key

1. **Set Up Google Cloud**
   - Visit [makersuite.google.com](https://makersuite.google.com)
   - Sign in with Google account
   - Accept terms

2. **Get API Key**
   - Click "Get API key"
   - Create new or use existing project
   - Copy the generated key

3. **Understand Free Tier**
   - Limited free requests per minute
   - Upgrade for higher limits
   - Check quotas regularly

### Configure in VentureLab

1. Select Gemini in AI Providers
2. Paste API key
3. Choose model:
   - `gemini-pro`: Text generation
   - `gemini-pro-vision`: Multimodal (future)
4. Test and save

### Gemini Tips
- Good free tier for testing
- Fast response times
- Google ecosystem integration
- Watch rate limits

## 🔄 Switching Providers

### When to Switch

- **Development → Production**: Ollama → OpenAI/Anthropic
- **Cost Concerns**: Paid → Ollama
- **Quality Needs**: GPT-3.5 → GPT-4
- **Speed Priority**: Claude → Gemini

### How to Switch

1. Open AI Providers settings
2. Select new provider from dropdown
3. Ensure API key is configured
4. Test connection
5. Save settings

Changes take effect immediately for all tools.

## 🔧 Advanced Configuration

### Custom Base URLs

Use for:
- Corporate proxies
- Self-hosted endpoints
- Alternative API providers

Example:
```
https://your-company.com/openai-proxy/v1
```

### Environment Variables

For CI/CD or shared systems:
```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# Gemini
export GEMINI_API_KEY="AIza..."
```

VentureLab will use these if no key is stored.

### Remote Ollama Servers

1. **Server Setup**
   ```bash
   # On server
   OLLAMA_HOST=0.0.0.0 ollama serve
   ```

2. **Client Configuration**
   - Base URL: `http://server-ip:11434`
   - Optional: Configure authentication
   - Test connection

## 🚨 Troubleshooting

### Common Issues

**"API key invalid"**
- Check for extra spaces
- Verify key hasn't been revoked
- Ensure correct provider selected

**"Connection failed"**
- Check internet connection
- Verify base URL
- Try default settings
- Check firewall

**"Model not found"**
- Update available models list
- Check model name spelling
- Verify model access

**"Rate limit exceeded"**
- Wait and retry
- Check provider dashboard
- Consider upgrading plan
- Use different provider

### Provider-Specific Issues

**Ollama**
- Ensure service is running
- Check model is downloaded
- Verify port 11434 is open

**OpenAI**
- Verify billing is active
- Check spending limits
- Confirm API access tier

**Anthropic**
- Check account approval status
- Verify Claude model access
- Monitor usage limits

**Gemini**
- Check project quotas
- Verify API enablement
- Monitor free tier usage

## 📋 Setup Checklist

- [ ] Choose primary provider
- [ ] Create provider account
- [ ] Generate API key
- [ ] Configure billing/limits
- [ ] Add key to VentureLab
- [ ] Test connection
- [ ] Select preferred model
- [ ] Save settings
- [ ] Test with a tool
- [ ] Monitor initial usage

---

Need help? Check the [Troubleshooting Guide](./troubleshooting.md) or [FAQ](./faq.md).