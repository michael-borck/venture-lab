import React, { useState } from 'react';

const DocumentationPage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('quick-start');

  const documentation = {
    'quick-start': {
      title: 'Quick Start Guide',
      icon: '🏃',
      content: `
# Quick Start Guide

Welcome to VentureLab! This guide will help you get started in 5 minutes.

## Step 1: Choose Your AI Provider

1. Click the **AI Providers** button
2. Select your preferred AI provider:
   - **Ollama** (Free, runs locally) - Recommended for beginners
   - **OpenAI** (GPT-4, paid) - Most powerful
   - **Anthropic** (Claude, paid) - Best for creative tasks
   - **Google Gemini** (Gemini Pro, paid) - Good balance

## Step 2: Connect Your Provider

### For Ollama (Recommended):
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Run: \`ollama pull llama2\` in your terminal
3. Click "Test Connection" in VentureLab
4. Select your model from the dropdown

### For Paid Providers:
1. Get your API key from the provider's website
2. Enter the key in VentureLab
3. Click "Test Connection"
4. Select a model

## Step 3: Start Creating!

### Try Idea Forge First:
1. Click **Idea Forge**
2. Select an industry or enter your own
3. Choose innovation level (1-10)
4. Click "Generate Ideas"
5. Save ideas you like

### Next Steps:
- **Global Compass**: Research international markets
- **Pitch Perfect**: Practice and improve your pitch
- **PRD Generator**: Create detailed product documents

## Tips for Success:

- Start with Ollama if you're unsure - it's free!
- Higher innovation levels = more creative ideas
- Save all your work - you can export later
- Check Usage stats to monitor costs
      `
    },
    'providers': {
      title: 'AI Provider Setup',
      icon: '🤖',
      content: `
# AI Provider Setup Guide

## Ollama (Free, Local)

### Installation:
1. Visit [ollama.ai](https://ollama.ai)
2. Download for your OS
3. Install and run Ollama

### Download Models:
\`\`\`bash
# Recommended models
ollama pull llama2       # 7B, good balance
ollama pull mistral      # 7B, fast & capable
ollama pull llama2:13b   # 13B, more powerful
\`\`\`

### Configure in VentureLab:
1. URL: http://localhost:11434
2. No API key needed
3. Test connection
4. Select downloaded model

## OpenAI (Paid)

### Get API Key:
1. Visit [platform.openai.com](https://platform.openai.com)
2. Create account
3. Go to API Keys
4. Create new secret key
5. Copy immediately (shown once!)

### Configure:
1. Paste key in VentureLab
2. Test connection
3. Select model (GPT-4 recommended)

### Pricing:
- GPT-3.5: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens
- GPT-4 Turbo: ~$0.01 per 1K tokens

## Anthropic Claude (Paid)

### Get API Key:
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create account
3. Go to API Keys
4. Generate key

### Configure:
1. Enter key in VentureLab
2. Test connection
3. Select Claude model

### Pricing:
- Claude Instant: ~$0.0008 per 1K tokens
- Claude 2: ~$0.008 per 1K tokens

## Google Gemini (Paid)

### Get API Key:
1. Visit [makersuite.google.com](https://makersuite.google.com)
2. Click "Get API Key"
3. Create or select project
4. Generate key

### Configure:
1. Enter key in VentureLab
2. Test connection
3. Select Gemini model

### Pricing:
- Gemini Pro: Free tier available
- Beyond free tier: ~$0.0005 per 1K tokens
      `
    },
    'security': {
      title: 'Security Best Practices',
      icon: '🔐',
      content: `
# Security Best Practices

## API Key Security

### How VentureLab Protects Your Keys:

1. **OS-Native Secure Storage**:
   - Windows: Credential Manager
   - macOS: Keychain
   - Linux: Secret Service

2. **Never Stored in Files**:
   - Keys are encrypted
   - Not in config files
   - Not in browser storage

3. **Memory Protection**:
   - Keys cleared after use
   - No logging of keys
   - Secure transmission only

## Best Practices:

### DO:
- ✅ Use unique API keys for VentureLab
- ✅ Set spending limits with providers
- ✅ Monitor usage regularly
- ✅ Rotate keys periodically
- ✅ Use Ollama for sensitive work

### DON'T:
- ❌ Share API keys with others
- ❌ Commit keys to version control
- ❌ Use production keys for testing
- ❌ Ignore usage warnings
- ❌ Store keys in text files

## Setting Spending Limits:

### OpenAI:
1. Go to Usage Limits in dashboard
2. Set monthly budget
3. Set email alerts

### Anthropic:
1. Visit Billing settings
2. Configure spending limits
3. Enable notifications

### Google:
1. Use Google Cloud quotas
2. Set daily/monthly limits
3. Configure alerts

## If a Key is Compromised:

1. **Immediately**:
   - Revoke the key at provider
   - Generate new key
   - Update in VentureLab

2. **Check**:
   - Usage logs for unusual activity
   - Billing for unexpected charges

3. **Prevent**:
   - Use separate keys per app
   - Enable 2FA on provider accounts
   - Regular key rotation
      `
    },
    'costs': {
      title: 'Cost Management',
      icon: '💰',
      content: `
# Cost Management Guide

## Understanding AI Costs

### What are Tokens?
- 1 token ≈ 4 characters
- 1,000 tokens ≈ 750 words
- Both input AND output count

### Typical Usage:
- Idea generation: ~500-1,000 tokens
- Market analysis: ~1,000-2,000 tokens
- Pitch analysis: ~2,000-3,000 tokens
- PRD creation: ~3,000-5,000 tokens

## Provider Pricing (Approximate)

### Free Option:
**Ollama** - $0/month
- Runs on your computer
- No token limits
- Slightly less capable
- Perfect for learning

### Paid Options:

**OpenAI GPT-3.5 Turbo**
- ~$0.002 per 1K tokens
- Fast, capable
- $5-10/month typical use

**OpenAI GPT-4**
- ~$0.03 per 1K tokens
- Most capable
- $20-50/month typical use

**Anthropic Claude**
- ~$0.008 per 1K tokens
- Great for creative tasks
- $10-25/month typical use

**Google Gemini Pro**
- Free tier available
- ~$0.0005 per 1K tokens after
- $5-15/month typical use

## Cost Optimization Tips

### 1. Start with Ollama
- Test ideas for free
- Learn without cost pressure
- Switch to paid for final work

### 2. Use Appropriate Models
- Simple tasks: Use cheaper models
- Complex tasks: Use advanced models
- Testing: Always use Ollama

### 3. Optimize Prompts
- Be concise but clear
- Avoid repetition
- Use prompt templates

### 4. Monitor Usage
- Check Usage stats daily
- Set provider spending limits
- Export usage data monthly

### 5. Batch Operations
- Generate multiple ideas at once
- Combine related analyses
- Plan before generating

## Budget Recommendations

### Student/Learner:
- Primary: Ollama (Free)
- Backup: GPT-3.5 ($5/month limit)
- Total: $0-5/month

### Entrepreneur:
- Primary: GPT-3.5 or Gemini
- Premium: GPT-4 for important work
- Total: $10-25/month

### Business/Team:
- Primary: GPT-4 or Claude
- Consider volume discounts
- Total: $50-100/month

## Warning Signs:
- Daily usage over 50K tokens
- Costs exceeding budget
- Repetitive similar requests
- Not using free options for testing
      `
    },
    'troubleshooting': {
      title: 'Troubleshooting',
      icon: '🔧',
      content: `
# Troubleshooting Guide

## Common Issues

### Ollama Connection Failed

**Symptoms**: "Failed to connect" error

**Solutions**:
1. Check Ollama is running:
   \`\`\`bash
   ollama list  # Should show models
   \`\`\`

2. Verify URL is correct:
   - Should be: http://localhost:11434
   - Not https!

3. Check firewall:
   - Allow localhost connections
   - Port 11434 must be open

4. Restart Ollama:
   \`\`\`bash
   # Windows: Restart from system tray
   # Mac/Linux:
   killall ollama
   ollama serve
   \`\`\`

### API Key Not Saving

**Symptoms**: Key disappears after restart

**Solutions**:
1. Check system keychain access:
   - Run keychain test in settings
   - May need admin permissions

2. Windows specific:
   - Run as Administrator once
   - Check Windows Defender

3. Linux specific:
   - Install gnome-keyring or kde-wallet
   - Ensure secret service is running

### Model Not Loading

**Symptoms**: Dropdown empty or model not selected

**Solutions**:
1. Test connection first
2. For Ollama, pull model:
   \`\`\`bash
   ollama pull llama2
   \`\`\`
3. Refresh model list
4. Check API key permissions

### High Costs / Rapid Token Usage

**Symptoms**: Unexpected bills

**Solutions**:
1. Check Usage statistics
2. Review prompts for loops
3. Set provider spending limits
4. Use Ollama for testing
5. Optimize prompt length

### Slow Response Times

**For Ollama**:
- Check CPU/RAM usage
- Use smaller model (7B vs 13B)
- Close other applications

**For API Providers**:
- Check internet connection
- Try different model
- May be rate limited

### "Rate Limit" Errors

**Solutions**:
1. Wait time shown in error
2. Reduce request frequency
3. Upgrade API plan
4. Use different provider

### Application Won't Start

**Solutions**:
1. Check installation directory
2. Run as administrator (once)
3. Check antivirus logs
4. Reinstall if needed

## Getting Help

### Before Asking for Help:
1. Check this guide
2. Test with Ollama first
3. Note exact error message
4. Check Usage statistics

### Information to Provide:
- Operating System
- AI Provider being used
- Exact error message
- What you were trying to do
- Screenshot if possible

### Still Stuck?
- Create GitHub issue
- Include all above info
- Be patient - we'll help!
      `
    },
    'faq': {
      title: 'Frequently Asked Questions',
      icon: '❓',
      content: `
# Frequently Asked Questions

## General Questions

### What is VentureLab?
VentureLab is an AI-powered toolkit for entrepreneurs and students. It helps you:
- Generate business ideas
- Research global markets
- Practice pitches
- Create product documents

### Is it really free?
Yes! Using Ollama (local AI) is completely free. Paid providers like OpenAI charge for usage, but you control the costs.

### Which AI provider should I use?
- **Learning/Testing**: Ollama (free)
- **Best Quality**: OpenAI GPT-4
- **Best Value**: OpenAI GPT-3.5 or Gemini
- **Creative Tasks**: Anthropic Claude

### Is my data private?
- With Ollama: 100% private, runs locally
- With APIs: Check provider privacy policies
- Your ideas are never stored by VentureLab

## Technical Questions

### Can I use multiple AI providers?
Yes! Switch between providers anytime. Great for:
- Testing with Ollama (free)
- Production with GPT-4
- Comparing outputs

### Why can't I see my API key?
For security! Keys are stored encrypted in your OS keychain. VentureLab can't display them after saving.

### What are tokens?
Tokens are how AI models measure text:
- 1 token ≈ 4 characters
- 1,000 tokens ≈ 750 words
- You pay per token with APIs

### How do I reduce costs?
1. Use Ollama for testing
2. Optimize prompts
3. Use cheaper models when possible
4. Set spending limits
5. Monitor usage regularly

## Feature Questions

### Can I customize prompts?
Yes! Click the Prompts button to:
- View current prompts
- Edit prompts
- Reset to defaults
- Import/export prompts

### Can I export my work?
Yes! Each tool has export options:
- Ideas: Export as JSON/TXT
- Analyses: Export as reports
- PRDs: Export as documents
- Usage: Export statistics

### Can teams use VentureLab?
Yes, but each person needs their own:
- Installation
- API keys
- Usage is per-person

### Is there a mobile version?
Not yet. VentureLab is desktop-only currently.

## Troubleshooting Questions

### Why is Ollama not connecting?
1. Ensure Ollama is running
2. Check the URL (http://localhost:11434)
3. Verify model is downloaded
4. Check firewall settings

### Why are responses slow?
**Ollama**: Need more RAM/CPU
**APIs**: Network speed or rate limits

### Can I use VentureLab offline?
Only with Ollama. API providers require internet.

### What if I hit rate limits?
Wait the specified time or:
- Use different provider
- Upgrade your plan
- Reduce request frequency

## Business Questions

### Can I use generated content commercially?
Yes! But check:
- Your AI provider's terms
- Give appropriate attribution
- Verify accuracy of information

### Is VentureLab suitable for:

**Students?** Yes! Perfect for learning
**Startups?** Yes! Great for ideation
**Enterprises?** Yes! But may need higher API limits
**Educators?** Yes! Excellent teaching tool

### How accurate is the AI?
AI provides suggestions, not facts:
- Verify market data
- Validate business assumptions  
- Use multiple sources
- Apply critical thinking
      `
    }
  };


  const currentDoc = documentation[activeTab];

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
        maxWidth: '1200px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '30px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '8px',
                margin: 0
              }}>📚 VentureLab Documentation</h2>
              <p style={{
                opacity: 0.9,
                margin: 0
              }}>Everything you need to know about using VentureLab</p>
            </div>
            <button
              onClick={onClose}
              style={{
                color: 'white',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Sidebar */}
          <div style={{
            width: '280px',
            background: '#f8fafc',
            borderRight: '1px solid #e1e5e9',
            overflowY: 'auto'
          }}>
            <nav style={{ padding: '20px' }}>
              {Object.entries(documentation).map(([key, doc]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    transition: 'all 0.2s',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    background: activeTab === key ? '#e5e7eb' : 'transparent',
                    color: activeTab === key ? '#6366f1' : '#374151',
                    fontWeight: activeTab === key ? '600' : '400'
                  }}
                  onMouseOver={(e) => {
                    if (activeTab !== key) {
                      e.target.style.background = '#f3f4f6';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeTab !== key) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.2rem', marginRight: '12px' }}>{doc.icon}</span>
                  <span>{doc.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Documentation Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '40px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <div style={{
                lineHeight: '1.6',
                color: '#374151'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '32px'
                }}>
                  <span style={{ fontSize: '2.5rem' }}>{currentDoc.icon}</span>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: 0
                  }}>{currentDoc.title}</h1>
                </div>
                <div 
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.7'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: currentDoc.content
                      .replace(/^#\s+(.+)$/gm, '<h1 style="font-size: 1.5rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; color: #111827;">$1</h1>')
                      .replace(/^##\s+(.+)$/gm, '<h2 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #374151;">$1</h2>')
                      .replace(/^###\s+(.+)$/gm, '<h3 style="font-size: 1.125rem; font-weight: 500; margin-top: 1rem; margin-bottom: 0.5rem; color: #4b5563;">$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: #111827;">$1</strong>')
                      .replace(/^-\s+(.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
                      .replace(/^\d+\.\s+(.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
                      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; font-family: monospace;"><code>$2</code></pre>')
                      .replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace;">$1</code>')
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #7c3aed; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>')
                      .replace(/✅/g, '<span style="color: #10b981;">✓</span>')
                      .replace(/❌/g, '<span style="color: #ef4444;">✗</span>')
                      .replace(/\n\n/g, '</p><p style="margin-bottom: 1rem;">')
                      .replace(/^(.+)$/gm, (match) => {
                        if (match.trim() && !match.match(/^[#\-\d<]/)) {
                          return `<p style="margin-bottom: 1rem;">${match}</p>`;
                        }
                        return match;
                      })
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e1e5e9',
          padding: '20px 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{
              fontSize: '0.9rem',
              color: '#6b7280',
              margin: 0
            }}>
              💡 Tip: Use Ollama for free, unlimited AI access while learning!
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const tabs = Object.keys(documentation);
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={Object.keys(documentation).indexOf(activeTab) === 0}
                style={{
                  padding: '8px 16px',
                  color: '#6b7280',
                  background: 'transparent',
                  border: 'none',
                  cursor: Object.keys(documentation).indexOf(activeTab) === 0 ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(documentation).indexOf(activeTab) === 0 ? 0.5 : 1,
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.color = '#374151';
                  }
                }}
                onMouseOut={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.color = '#6b7280';
                  }
                }}
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  const tabs = Object.keys(documentation);
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={Object.keys(documentation).indexOf(activeTab) === Object.keys(documentation).length - 1}
                style={{
                  padding: '8px 16px',
                  color: '#6b7280',
                  background: 'transparent',
                  border: 'none',
                  cursor: Object.keys(documentation).indexOf(activeTab) === Object.keys(documentation).length - 1 ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(documentation).indexOf(activeTab) === Object.keys(documentation).length - 1 ? 0.5 : 1,
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.color = '#374151';
                  }
                }}
                onMouseOut={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.color = '#6b7280';
                  }
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;