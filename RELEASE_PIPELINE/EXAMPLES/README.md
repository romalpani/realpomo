# Example Files

This directory contains example implementations for the release pipeline components.

## Files

- `website-index.html` - Example website HTML
- `website-styles.css` - Example website CSS
- `website-app.js` - Example website JavaScript (with auto-update)
- `github-actions-release.yml` - GitHub Actions release workflow
- `github-actions-ci.yml` - GitHub Actions CI workflow
- `release-script.js` - Node.js release script

## Usage

### Website Files
1. Copy `website-index.html`, `website-styles.css`, and `website-app.js` to your `docs/` directory
2. Update `REPO_OWNER` in `website-app.js` with your GitHub username
3. Update all `YOUR_USERNAME` placeholders in `website-index.html`
4. Customize styles and content as needed
5. Enable GitHub Pages in repository settings

### GitHub Actions
1. Create `.github/workflows/` directory
2. Copy `github-actions-ci.yml` to `.github/workflows/ci.yml`
3. Copy `github-actions-release.yml` to `.github/workflows/release.yml`
4. Update any paths or configurations as needed
5. Add required secrets to GitHub repository settings

### Release Script
1. Create `scripts/` directory
2. Copy `release-script.js` to `scripts/release.js`
3. Make it executable: `chmod +x scripts/release.js`
4. Add to `package.json`:
   ```json
   {
     "scripts": {
       "release": "node scripts/release.js"
     }
   }
   ```
5. Run with: `npm run release`

## Customization

All files are examples and should be customized for your specific needs:
- Update repository names
- Adjust build configurations
- Modify styling
- Add/remove features
- Update error handling

## Notes

- These are starter templates - adjust as needed
- Test locally before deploying
- Review security implications of any changes
- Follow your project's coding standards

