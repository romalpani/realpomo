# Repository Structure

This document explains the organization of the RealPomo repository.

## Directory Structure

```
realpomo/
├── README.md                 # Main project README (public-facing)
├── package.json              # Project configuration
├── src/                      # Source code
├── build/                    # Build assets (icons, scripts)
│   ├── icon.png             # Application icon
│   └── *.md                 # Icon-related documentation
├── scripts/                  # Build and release scripts
│   └── release.js           # Automated release script
├── docs/                     # Documentation (public, served by GitHub Pages)
│   ├── index.html           # Website
│   ├── *.css, *.js          # Website assets
│   └── *.png                # Website screenshots
├── .github/                  # GitHub configuration
│   ├── workflows/           # CI/CD workflows
│   └── docs/                # Private development documentation
│       └── development/     # Development docs (not public)
│           ├── README.md    # This directory overview
│           ├── release-pipeline/ # Release pipeline docs
│           ├── CODE_REVIEW.md   # Code review notes
│           └── *.md         # Other development docs
├── .github/                  # GitHub configuration
│   ├── workflows/           # CI/CD workflows
│   └── docs/                # GitHub-specific docs (if any)
└── tests/                   # Test files
```

## Key Directories

### `/docs` - Public Documentation (GitHub Pages)
- **Website files**: `index.html`, `styles.css`, `app.js` - Public-facing website
- **Screenshots**: `app-*.png` - Application screenshots for website

### `/.github/docs/development` - Private Development Documentation
- **release-pipeline/**: Complete guide for release setup and usage
- **CODE_REVIEW.md**: Code review and refactoring notes
- **NEXT_STEPS.md**: Development checklist
- Other planning and development docs

### `/build` - Build Assets
- **icon.png**: Application icon (1024x1024+)
- Icon design and setup documentation

### `/.github` - GitHub Configuration
- **workflows/**: CI/CD automation
  - `ci.yml`: Continuous integration
  - `release.yml`: Release automation

## File Organization Principles

1. **Public vs Internal**: 
   - Public: `/docs` (website, served by GitHub Pages)
   - Internal: `/.github/docs/development` (private, not served)
   - Root: Essential files only (README, SECURITY.md, LICENSE)
2. **Clean Root**: Only essential files (README, config files)
3. **Logical Grouping**: Related files grouped by purpose
4. **Discoverable**: Clear naming and README files

## Contributing

When adding documentation:
- **Public docs**: Add to `/docs` (website) or root (README, SECURITY.md, LICENSE)
- **Development docs**: Add to `/.github/docs/development` (private)
- **Build docs**: Add to `/build` (if build-related)

