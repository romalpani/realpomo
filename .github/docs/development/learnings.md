# Release Pipeline Learnings

This document captures key learnings from setting up and troubleshooting the Electron app release pipeline. These insights can help developers and architects avoid common pitfalls and build more robust CI/CD systems.

## Table of Contents

1. [Environment Variables & Secrets](#environment-variables--secrets)
2. [Artifact Management](#artifact-management)
3. [Cross-Platform Builds](#cross-platform-builds)
4. [CI/CD Best Practices](#cicd-best-practices)
5. [Error Handling & Debugging](#error-handling--debugging)
6. [Architecture Decisions](#architecture-decisions)

---

## Environment Variables & Secrets

### Problem: Empty Secrets Causing Path Misinterpretation

**Issue**: When GitHub Actions secrets are not set, they resolve to empty strings. electron-builder was misinterpreting an empty `CSC_LINK` environment variable as a file path, causing errors like:
```
⨯ /Users/runner/work/realpomo/realpomo not a file
```

**Root Cause**: 
- Empty strings in environment variables can be misinterpreted by tools expecting file paths
- electron-builder tried to use the workspace root as a certificate file path

**Solution**:
```yaml
# Only set environment variables when secrets are actually provided
if [ -n "${{ secrets.CSC_LINK }}" ]; then
  export CSC_LINK="${{ secrets.CSC_LINK }}"
  export CSC_KEY_PASSWORD="${{ secrets.CSC_KEY_PASSWORD }}"
fi
```

**Key Learning**: 
- **Never pass empty secrets directly to tools that expect file paths**
- Always conditionally set environment variables based on secret existence
- Use shell conditionals (`-n` test) to check if secrets are non-empty before exporting

**Architectural Principle**: 
- Fail gracefully when optional configuration is missing
- Validate inputs before passing them to external tools
- Use explicit conditionals rather than relying on default behavior

---

## Artifact Management

### Problem: Artifact Path Mismatch Between Build and Release Jobs

**Issue**: electron-builder outputs files directly to `release/` (e.g., `release/RealPomo-1.0.0-arm64.dmg`), but the release job was downloading artifacts to subdirectories (`release/mac/`, `release/win/`) and then looking for files with glob patterns that didn't match the actual locations.

**Root Cause**:
- Mismatch between where files are uploaded and where they're downloaded
- Incorrect glob patterns that don't account for the actual file structure
- Multiple architectures (arm64, x64) producing multiple files that need to be captured

**Solution**:
```yaml
# Download artifacts to the same location where electron-builder outputs them
- name: Download macOS artifacts
  uses: actions/download-artifact@v4
  with:
    name: mac-build
    path: release/  # Not release/mac/

# Use specific file patterns instead of directory globs
files: |
  release/*.dmg
  release/*.exe
  release/*.zip
  release/*.blockmap
```

**Key Learning**:
- **Maintain consistency between build output paths and artifact download paths**
- Use specific file patterns (`*.dmg`) rather than directory globs (`release/mac/**`)
- When building multiple architectures, ensure all outputs are captured
- Validate artifacts exist before attempting to use them

**Architectural Principle**:
- Keep artifact paths consistent across build and release stages
- Use explicit file patterns for clarity and reliability
- Add validation steps to catch missing artifacts early

---

## Cross-Platform Builds

### Problem: Shell Script Incompatibility Between Platforms

**Issue**: GitHub Actions Windows runners use PowerShell by default, but the workflow used bash syntax (`if [ ! -f ...]`), causing syntax errors:
```
ParserError: Missing '(' after 'if' in if statement.
```

**Root Cause**:
- Different default shells on different platforms
- Assumption that bash syntax works everywhere

**Solution**:
```yaml
- name: Build distributable
  shell: bash  # Explicitly specify bash for cross-platform compatibility
  run: |
    # bash script here
```

**Key Learning**:
- **Always explicitly specify the shell in GitHub Actions workflows**
- Don't assume the default shell is consistent across platforms
- Use `shell: bash` for cross-platform shell scripts
- Consider using platform-specific steps if needed

**Architectural Principle**:
- Make platform differences explicit in configuration
- Prefer explicit over implicit behavior
- Test workflows on all target platforms

---

## CI/CD Best Practices

### Problem: electron-builder Auto-Publishing Conflicts with Separate Release Job

**Issue**: electron-builder detected CI environment and tried to auto-publish, requiring `GH_TOKEN`, but we wanted to handle publishing in a separate job.

**Root Cause**:
- electron-builder has built-in CI detection that triggers auto-publishing
- Default behavior conflicts with custom release workflow design

**Solution**:
```json
// package.json
{
  "build": {
    "publish": null  // Explicitly disable auto-publishing
  }
}
```

```yaml
# workflow.yml
npx electron-builder --publish never  # Explicit flag as backup
```

**Key Learning**:
- **Explicitly disable auto-publishing when using custom release workflows**
- Use both configuration (`publish: null`) and command-line flags (`--publish never`) for defense in depth
- Separate build and release concerns into different jobs for better control

**Architectural Principle**:
- Separate build and release concerns
- Use explicit configuration over implicit behavior
- Design workflows with clear separation of responsibilities

---

## Error Handling & Debugging

### Problem: Silent Failures and Missing Validation

**Issue**: Release job could create a GitHub release without any files attached if artifacts were missing, with no clear error message.

**Root Cause**:
- No validation step before creating release
- No verification that expected files exist
- Lack of debugging information

**Solution**:
```yaml
- name: Validate release artifacts
  shell: bash
  run: |
    # Check for required files
    DMG_COUNT=$(find release -name "*.dmg" -type f | wc -l | tr -d ' ')
    if [ "$DMG_COUNT" -eq 0 ]; then
      echo "❌ Error: No DMG files found"
      exit 1
    fi
    
    # List files for debugging
    find release -name "*.dmg" -type f -exec ls -lh {} \;
```

**Key Learning**:
- **Always validate artifacts before using them**
- Add explicit checks for expected files
- Provide detailed logging for debugging
- Fail fast with clear error messages

**Architectural Principle**:
- Validate inputs and outputs at each stage
- Fail early with actionable error messages
- Include debugging information in logs
- Design for observability

---

## Architecture Decisions

### Decision: Skip E2E Tests in CI for Minimal Apps

**Context**: E2E tests for Electron apps require significant setup (Xvfb, system dependencies, display server) and can be unreliable in CI environments.

**Decision**: Remove E2E tests from CI workflow, keep them available locally.

**Rationale**:
- For minimal apps, E2E tests may be overkill
- CI should focus on fast, reliable checks (lint, typecheck, unit tests)
- E2E tests can be run manually before releases
- Reduces CI complexity and potential failure points

**Key Learning**:
- **Don't let perfect be the enemy of good**
- Choose the right level of testing for your project size
- Balance thoroughness with CI reliability and speed
- Keep tests available locally even if not in CI

**Architectural Principle**:
- Match testing strategy to project complexity
- Optimize CI for speed and reliability
- Don't block releases on flaky tests

---

## Additional Insights

### macOS Build Architecture Handling

**Learning**: electron-builder can build multiple architectures (arm64, x64) in a single macOS build job. Both DMGs are output to the same directory, so ensure artifact uploads capture all files:

```yaml
path: release/*  # Captures all files, including both arm64 and x64 DMGs
```

### Artifact Retention Strategy

**Learning**: GitHub Actions artifacts have retention limits. Consider:
- Setting appropriate retention periods (30 days is reasonable)
- Artifacts are automatically cleaned up after retention period
- For long-term storage, use GitHub Releases instead of artifacts

### Version Management

**Learning**: Use semantic versioning tags (`v1.0.0`) to trigger releases:
- Tags are immutable and provide clear version history
- GitHub Actions can detect tags with pattern matching (`v*`)
- Releases can be created automatically from tags

### Code Signing Strategy

**Learning**: Code signing is optional but recommended:
- Unsigned macOS apps show security warnings
- Code signing requires Apple Developer account and certificates
- Can be added later without changing workflow structure
- Use conditional environment variables to support both signed and unsigned builds

---

## Summary: Key Principles for Release Pipelines

1. **Explicit over Implicit**: Always explicitly configure behavior rather than relying on defaults
2. **Validate Early**: Check artifacts and inputs at each stage before proceeding
3. **Fail Fast**: Provide clear error messages and fail immediately when something is wrong
4. **Separate Concerns**: Keep build, test, and release stages separate
5. **Cross-Platform Awareness**: Account for platform differences in workflows
6. **Defense in Depth**: Use multiple layers of configuration (config files + CLI flags)
7. **Observability**: Include detailed logging and debugging information
8. **Pragmatic Testing**: Match testing strategy to project needs

---

## Common Pitfalls to Avoid

1. ❌ Passing empty secrets directly to tools expecting file paths
2. ❌ Mismatched artifact upload/download paths
3. ❌ Assuming default shell is consistent across platforms
4. ❌ Not validating artifacts before using them
5. ❌ Enabling auto-publishing when using custom release workflows
6. ❌ Using directory globs instead of specific file patterns
7. ❌ Not accounting for multiple architecture outputs
8. ❌ Creating releases without verifying files exist

---

## Resources

- [electron-builder Documentation](https://www.electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [GitHub Releases API](https://docs.github.com/en/rest/releases/releases)

---

*Last updated: January 2025*

