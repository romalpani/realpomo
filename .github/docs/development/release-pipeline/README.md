# RealPomo Release Pipeline

This directory contains the implementation plan for productizing RealPomo and setting up a professional release pipeline.

## Overview

The plan is broken down into 7 phases, each with specific tasks and deliverables:

1. **GitHub Repository Setup** - Configure repository settings and structure
2. **Electron Builder Configuration** - Set up DMG builds and code signing
3. **GitHub Actions Pipeline** - Automated CI/CD workflows
4. **Release Script** - Secure, accurate release automation
5. **Website Setup** - Single-page site with auto-updating download links
6. **README Updates** - Download section and documentation
7. **Additional Recommendations** - Best practices and missing pieces

## Quick Start

1. Read through all phase documents in order
2. Start with Phase 1 and work sequentially
3. Each phase builds on the previous one
4. Refer to Phase 7 for additional recommendations

## Architecture

```
┌─────────────────┐
│  Developer      │
│  runs release   │
│  script         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Git Tag        │─────▶│  GitHub Actions  │
│  (v1.0.0)       │     │  Release Workflow│
└─────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Build & Sign           │
                    │  - macOS DMG            │
                    │  - Windows Installer    │
                    └────────┬────────────────┘
                             │
                             ▼
                    ┌─────────────────────────┐
                    │  GitHub Release         │
                    │  - Upload artifacts     │
                    │  - Release notes        │
                    └────────┬────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │  Website & README                  │
        │  Auto-fetch latest release         │
        │  Update download links             │
        └────────────────────────────────────┘
```

## Key Features

- ✅ **Single Release Channel** - GitHub Releases only
- ✅ **Automated Builds** - GitHub Actions handles everything
- ✅ **Auto-Updating Website** - Fetches latest release via GitHub API
- ✅ **Secure Releases** - Code signing and notarization
- ✅ **Free Tier** - Uses GitHub Actions free tier (no subscription needed)

## Files

- `01-github-repo-setup.md` - Repository configuration
- `02-electron-builder-config.md` - Build configuration
- `03-github-actions-pipeline.md` - CI/CD setup
- `04-release-script.md` - Release automation
- `05-website-setup.md` - Website implementation
- `06-readme-updates.md` - Documentation updates
- `07-additional-recommendations.md` - Best practices

## Prerequisites

- GitHub account
- Apple Developer account ($99/year) for macOS code signing
- Node.js and npm installed
- Git configured

## Estimated Time

- Phase 1: 30 minutes
- Phase 2: 2-4 hours (mostly waiting for Apple Developer setup)
- Phase 3: 2-3 hours
- Phase 4: 1-2 hours
- Phase 5: 2-3 hours
- Phase 6: 30 minutes
- Phase 7: Ongoing

**Total**: ~8-13 hours for initial setup, then automated

## Support

For questions or issues with the release pipeline, refer to:
- [Electron Builder Documentation](https://www.electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Releases API](https://docs.github.com/en/rest/releases/releases)

