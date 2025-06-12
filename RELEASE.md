# Release Instructions

This document outlines how to create releases for VentureLab.

## Automated Release Process

VentureLab uses GitHub Actions to automatically build and publish releases for Windows, macOS, and Linux when you create a version tag.

### Creating a Release

1. **Update Version Numbers**
   - Update `version` in `src-tauri/tauri.conf.json`
   - Update `version` in `package.json`
   - Update `CHANGELOG.md` with new version details

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "Prepare release v1.0.0"
   git push origin main
   ```

3. **Create and Push Tag**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **GitHub Actions automatically:**
   - Builds for all platforms (Windows x64, macOS Intel, macOS Apple Silicon, Linux x64)
   - Creates installers and packages
   - Creates a GitHub release with all artifacts
   - Generates release notes from the tag

### Manual Release (if needed)

If you need to build releases manually:

```bash
# Install dependencies
npm ci

# Build for current platform
npm run tauri:build

# Cross-compile (requires additional setup)
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows
npm run tauri build -- --target x86_64-apple-darwin     # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin    # macOS Apple Silicon
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

## Release Artifacts

The automated workflow generates the following files:

### Windows
- `VentureLab_v1.0.0_x64_en-US.msi` - Windows Installer (Recommended)
- `VentureLab_v1.0.0_x64-setup.exe` - Windows Setup Executable

### macOS
- `VentureLab_v1.0.0_aarch64.dmg` - Apple Silicon (M1/M2/M3)
- `VentureLab_v1.0.0_x64.dmg` - Intel Macs

### Linux
- `VentureLab_v1.0.0_amd64.deb` - Debian/Ubuntu package
- `VentureLab_v1.0.0_amd64.AppImage` - Universal Linux AppImage

## Version Numbering

VentureLab follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.x.x) - Breaking changes or major new features
- **MINOR** version (x.1.x) - New features, backward compatible
- **PATCH** version (x.x.1) - Bug fixes, backward compatible

### Examples:
- `v1.0.0` - Initial stable release
- `v1.1.0` - New AI provider or tool added
- `v1.0.1` - Bug fixes and improvements
- `v2.0.0` - Major UI overhaul or breaking changes

## Pre-release Testing

Before creating a release tag:

1. **Test Local Build**
   ```bash
   npm run tauri:build
   ```

2. **Test Installation**
   - Install the generated package on your platform
   - Verify all features work correctly
   - Test with different AI providers

3. **Update Documentation**
   - Ensure README.md is current
   - Update CHANGELOG.md with new features/fixes
   - Verify docs/ folder is up to date

## Release Checklist

- [ ] Version numbers updated in all files
- [ ] CHANGELOG.md updated with new version
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Local build tested
- [ ] Committed and pushed to main
- [ ] Tag created and pushed
- [ ] GitHub Actions build completed successfully
- [ ] Release artifacts tested on multiple platforms

## Troubleshooting

### Failed Builds
- Check GitHub Actions logs for specific errors
- Verify all dependencies are correctly specified
- Ensure Tauri configuration is valid

### Missing Artifacts
- Check that the tag follows the pattern `v*` (e.g., `v1.0.0`)
- Verify the workflow permissions are correct
- Check if the build matrix completed for all platforms

### Code Signing (Future)
For distribution outside development:
- Windows: Requires code signing certificate
- macOS: Requires Apple Developer account and notarization
- Linux: GPG signing recommended for official packages

---

For questions about releases, see the [GitHub repository](https://github.com/michael-borck/venture-lab) or create an issue.