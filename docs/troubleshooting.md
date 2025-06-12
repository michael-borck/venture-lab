# Troubleshooting Guide

Solutions to common issues with VentureLab.

## 🔧 General Issues

### Application Won't Start

**Symptoms:**
- Double-clicking icon does nothing
- App crashes immediately
- Error message on startup

**Solutions:**
1. **Check System Requirements**
   - Windows 10/11, macOS 10.15+, or Linux
   - 4GB RAM minimum (8GB recommended)
   - 500MB free disk space

2. **Run as Administrator** (Windows)
   - Right-click VentureLab icon
   - Select "Run as administrator"

3. **Check Antivirus**
   - Add VentureLab to exceptions
   - Temporarily disable to test

4. **Reinstall Application**
   - Uninstall completely
   - Download fresh copy
   - Install again

### Settings Not Saving

**Symptoms:**
- Settings reset on restart
- Model selection not persisting
- API keys disappearing

**Solutions:**
1. **Check Permissions**
   - Ensure write access to app directory
   - Check user permissions

2. **Configuration File**
   - Location: `~/.venturelab/settings.json`
   - Delete corrupted file
   - Let app recreate

3. **Keychain Access**
   - May need system password
   - Check keychain permissions
   - Try storing key again

## 🤖 AI Provider Issues

### "API Key Invalid" Error

**For All Providers:**
1. **Check for Spaces**
   - Remove leading/trailing spaces
   - Copy key again carefully

2. **Verify Key Format**
   - OpenAI: Starts with `sk-`
   - Anthropic: Starts with `sk-ant-`
   - Gemini: Alphanumeric string

3. **Test in Provider Dashboard**
   - Verify key works on provider's site
   - Check if key was revoked
   - Generate new key if needed

### "Connection Failed" Error

**General Solutions:**
1. **Internet Connection**
   - Check network connectivity
   - Try accessing provider website
   - Check firewall settings

2. **Proxy Settings**
   - Configure if behind corporate proxy
   - Use custom base URL if needed

3. **Provider Outage**
   - Check provider status page
   - Try different provider
   - Wait and retry

### Ollama Specific Issues

**"Cannot connect to Ollama"**
1. **Start Ollama Service**
   ```bash
   ollama serve
   ```

2. **Check Port**
   - Default: `http://localhost:11434`
   - Ensure port not blocked
   - Try: `curl http://localhost:11434`

3. **Model Not Found**
   ```bash
   # List models
   ollama list
   
   # Pull model
   ollama pull llama3.1
   ```

**Slow Performance**
- Check RAM usage
- Try smaller model
- Close other applications
- Consider GPU acceleration

### OpenAI Specific Issues

**"Rate Limit Exceeded"**
- Wait 1 minute and retry
- Check usage on OpenAI dashboard
- Upgrade to higher tier
- Implement request throttling

**"Insufficient Quota"**
- Add payment method
- Check billing status
- Set up usage alerts
- Monitor spending

### Anthropic Specific Issues

**"Model Access Denied"**
- Verify Claude model access
- Check account approval
- Try different model version
- Contact Anthropic support

### Gemini Specific Issues

**"Quota Exceeded"**
- Free tier: 60 requests/minute
- Wait before retrying
- Upgrade to paid tier
- Check Google Cloud quotas

## 💾 Data Issues

### Usage Statistics Not Showing

**Solutions:**
1. **Database Check**
   - Location: `~/.venturelab/usage.db`
   - Delete to reset
   - Restart application

2. **Permissions**
   - Check write permissions
   - Ensure disk space available

3. **Time Filter**
   - Change time period
   - Select "All time"
   - Refresh statistics

### Can't Export Data

**Solutions:**
1. **File Permissions**
   - Check downloads folder access
   - Try different location
   - Run as administrator

2. **Data Format**
   - Ensure valid JSON
   - Check for special characters
   - Try smaller date range

## 🖥️ Platform-Specific Issues

### Windows

**"VCRUNTIME140.dll missing"**
- Install Visual C++ Redistributable
- Download from Microsoft
- Restart after installation

**Keychain Access Issues**
- Run as administrator
- Check Windows Credential Manager
- Clear old credentials

### macOS

**"App is damaged"**
```bash
xattr -cr /Applications/VentureLab.app
```

**Keychain Permission**
- Grant access when prompted
- Check Keychain Access app
- Reset keychain if needed

### Linux

**Dependencies Missing**
```bash
# Debian/Ubuntu
sudo apt install libwebkit2gtk-4.0-37 libsecret-1-0

# Fedora
sudo dnf install webkit2gtk3 libsecret

# Arch
sudo pacman -S webkit2gtk libsecret
```

**Keyring Issues**
- Install gnome-keyring or KWallet
- Start keyring service
- Check D-Bus running

## 🛠️ Tool-Specific Issues

### Ideas Not Generating

1. **Check Provider Connection**
   - Test in AI Providers
   - Verify model selected
   - Check API key valid

2. **Prompt Issues**
   - Try default prompts
   - Simplify input
   - Remove special characters

3. **Timeout Errors**
   - Reduce complexity
   - Try different provider
   - Check internet speed

### Export Not Working

1. **PDF Generation**
   - Check disk space
   - Try HTML export first
   - Update application

2. **Copy to Clipboard**
   - Grant clipboard access
   - Try manual selection
   - Check browser permissions

## 🔍 Debug Information

### Collecting Logs

**Windows:**
```
%APPDATA%\VentureLab\logs
```

**macOS:**
```
~/Library/Application Support/VentureLab/logs
```

**Linux:**
```
~/.config/VentureLab/logs
```

### Information to Include

When reporting issues:
1. VentureLab version
2. Operating system
3. AI provider being used
4. Error message (exact)
5. Steps to reproduce
6. Log files (if available)

## 🆘 Still Need Help?

### Before Contacting Support

- [ ] Tried all relevant solutions above
- [ ] Checked FAQ section
- [ ] Updated to latest version
- [ ] Collected debug information

### Getting Support

1. **GitHub Issues**
   - Search existing issues
   - Create detailed report
   - Include system info

2. **Community Forum**
   - Ask in discussions
   - Share solutions
   - Help others

3. **Emergency Fixes**
   - Use Ollama as backup
   - Try web versions
   - Export important data

## 🔄 Reset Options

### Soft Reset
1. Clear settings
2. Keep API keys
3. Restart app

### Hard Reset
1. Uninstall application
2. Delete all app data:
   - Windows: `%APPDATA%\VentureLab`
   - macOS: `~/Library/Application Support/VentureLab`
   - Linux: `~/.config/VentureLab`
3. Reinstall fresh

### Keep Backups
- Export prompts regularly
- Save usage statistics
- Document API keys securely

---

Remember: Most issues have simple solutions. Stay calm, follow the steps, and you'll be back to creating amazing ideas!