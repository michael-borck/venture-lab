# Frequently Asked Questions (FAQ)

## General Questions

### What is VentureLab?
VentureLab is an AI-powered entrepreneurship toolkit that helps you generate business ideas, analyze markets, perfect your pitches, and create product requirements documents using various AI providers.

### Is VentureLab free?
VentureLab itself is free to use. However, some AI providers (OpenAI, Anthropic, Google Gemini) require paid API keys. Ollama is completely free as it runs locally on your computer.

### Which operating systems are supported?
- ✅ Windows 10/11
- ✅ macOS 10.15 (Catalina) and later
- ✅ Linux (Ubuntu 20.04+, Fedora, Arch, etc.)

### Do I need an internet connection?
- **For Ollama**: No internet required (runs locally)
- **For other providers**: Yes, internet connection required

### Is my data private?
- **With Ollama**: 100% private - nothing leaves your computer
- **With cloud providers**: Data is sent to their servers - check their privacy policies
- **VentureLab**: We don't collect or store your data

## AI Provider Questions

### Which AI provider should I choose?
- **Beginners**: Start with Ollama (free, private)
- **Best quality**: OpenAI GPT-4 or Anthropic Claude
- **Best value**: Google Gemini (has free tier)
- **Privacy focused**: Ollama only

See our [Provider Comparison Guide](./provider-comparison.md) for details.

### Can I use multiple AI providers?
Yes! You can switch between providers at any time in the AI Providers settings. Each tool will use your currently selected provider.

### Do I need a credit card?
- **Ollama**: No credit card needed
- **OpenAI**: Yes, requires payment method
- **Anthropic**: Yes, requires payment method
- **Gemini**: No for free tier, yes for paid

### How much will it cost?
Costs vary by provider and usage:
- **Ollama**: Always free
- **OpenAI**: ~$0.002-$0.06 per request
- **Anthropic**: ~$0.003-$0.075 per request
- **Gemini**: Free tier available, then ~$0.0005 per request

See [Cost Management Guide](./cost-management.md) for details.

### What are tokens?
Tokens are how AI providers measure text:
- 1 token ≈ 4 characters ≈ 0.75 words
- Both input (your prompt) and output (AI response) count
- Providers charge per token used

## Security Questions

### Are my API keys safe?
Yes! VentureLab stores API keys in your operating system's secure credential storage:
- Windows: Credential Manager
- macOS: Keychain
- Linux: Secret Service (GNOME Keyring/KWallet)

### Can VentureLab see my API keys?
No. API keys are stored locally on your computer and are only used to communicate with your chosen AI provider.

### What if my API key is compromised?
1. Immediately revoke the key in your provider's dashboard
2. Generate a new key
3. Update it in VentureLab
4. Check for unauthorized usage

See [Security Best Practices](./security-best-practices.md).

## Tool Questions

### How accurate are the business ideas?
AI-generated ideas are starting points for your creativity. They should be validated with real market research. Quality depends on:
- Your input specificity
- Selected AI provider/model
- Prompt customization

### Can I save my results?
Yes! Each tool has export options:
- Copy to clipboard
- Export as HTML
- Export as PDF (some tools)
- Save to file

### Can I customize the AI prompts?
Yes! Click the "🧠 Prompts" button to:
- View current prompts
- Edit and customize
- Reset to defaults
- Import/export prompts

### Why are my results different each time?
AI models are probabilistic - they generate different responses even with the same input. This is actually beneficial for creative tasks like idea generation.

## Technical Questions

### How do I update VentureLab?
- Check for updates in the app
- Download new version from website
- Install over existing version (settings preserved)

### Where are my settings stored?
- Windows: `%APPDATA%\VentureLab`
- macOS: `~/Library/Application Support/VentureLab`
- Linux: `~/.config/VentureLab`

### Can I backup my data?
Yes! Regular backups recommended:
1. Export your custom prompts
2. Export usage statistics
3. Note your AI provider settings
4. API keys are in system keychain

### What's the context window limit?
Depends on the provider/model:
- OpenAI: 8K-128K tokens
- Anthropic: 100K+ tokens
- Gemini: 32K tokens
- Ollama: Varies by model

## Ollama Questions

### How do I install Ollama?
1. Visit [ollama.ai](https://ollama.ai)
2. Download for your OS
3. Run installer
4. Open terminal and run: `ollama serve`

### Which Ollama model should I use?
- **Best overall**: llama3.1
- **Fastest**: mistral
- **For coding**: codellama
- **Smallest**: gemma

### Why is Ollama slow?
Performance depends on:
- Your hardware (CPU/GPU/RAM)
- Model size
- Prompt complexity

Try smaller models or upgrade hardware.

### Can I use Ollama remotely?
Yes! Configure Ollama on a server and update the base URL in VentureLab to point to your server.

## Troubleshooting Questions

### Why won't VentureLab start?
Common causes:
- Missing dependencies
- Antivirus blocking
- Corrupted installation

See [Troubleshooting Guide](./troubleshooting.md).

### Why does it say "Connection Failed"?
Check:
1. Internet connection (for cloud providers)
2. API key is valid
3. Provider service status
4. Firewall settings

### Why are my settings not saving?
Possible issues:
- Permissions problem
- Disk space
- Corrupted settings file

Try running as administrator.

### The AI isn't responding
1. Check provider connection
2. Verify API key
3. Try different provider
4. Check rate limits

## Usage Questions

### Can I use VentureLab commercially?
Yes! VentureLab is free for commercial use. Check individual AI provider terms for their commercial use policies.

### Can I share my prompts?
Yes! Use the Prompt Manager to:
- Export your prompts
- Share with others
- Import prompt collections

### Is there a mobile version?
Currently, VentureLab is desktop-only. Mobile version may be considered in the future.

### Can I use VentureLab offline?
Only with Ollama provider. Other providers require internet connection.

## Support Questions

### How do I report a bug?
1. Check if it's a known issue
2. Gather debug information
3. Create GitHub issue
4. Include reproduction steps

### Can I request features?
Yes! Open a GitHub issue with:
- Feature description
- Use case
- Why it's valuable

### Is there a community?
- GitHub Discussions
- Discord server (if available)
- User forum (if available)

### How can I contribute?
- Report bugs
- Suggest features
- Improve documentation
- Submit code PRs
- Share your experience

---

Don't see your question? Check the [Troubleshooting Guide](./troubleshooting.md) or open a GitHub issue.