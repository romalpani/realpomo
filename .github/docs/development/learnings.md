# Release Pipeline Learnings

Key learnings from setting up and troubleshooting the Electron app release pipeline.

## Environment Variables & Secrets

**Problem**: Empty secrets resolve to empty strings. electron-builder misinterpreted empty `CSC_LINK` as a file path, causing `not a file` errors.

**Solution**: Only set env vars when secrets exist:
```yaml
if [ -n "${{ secrets.CSC_LINK }}" ]; then
  export CSC_LINK="${{ secrets.CSC_LINK }}"
fi
```

**Key Learning**: Never pass empty secrets to tools expecting file paths. Use conditionals to check secret existence first.

---

## Artifact Management

**Problem**: electron-builder outputs to `release/`, but artifacts were downloaded to `release/mac/` and `release/win/` subdirectories, causing file path mismatches.

**Solution**:
```yaml
# Download to same location as build output
path: release/  # Not release/mac/

# Use specific file patterns
files: |
  release/*.dmg
  release/*.exe
```

**Key Learning**: Keep artifact paths consistent between build and release. Use specific file patterns (`*.dmg`) not directory globs (`release/mac/**`).

---

## Cross-Platform Builds

**Problem**: Windows runners use PowerShell by default, but workflow used bash syntax, causing syntax errors.

**Solution**: Explicitly specify shell:
```yaml
- name: Build distributable
  shell: bash
```

**Key Learning**: Always explicitly specify `shell: bash` for cross-platform compatibility.

---

## CI/CD Best Practices

**Problem**: electron-builder auto-publishes in CI, conflicting with custom release workflow.

**Solution**: Disable auto-publishing:
```json
// package.json
{ "build": { "publish": null } }
```
```yaml
# workflow.yml
npx electron-builder --publish never
```

**Key Learning**: Explicitly disable auto-publishing when using custom release workflows. Use both config and CLI flags.

---

## Error Handling

**Problem**: Release could be created without files if artifacts were missing.

**Solution**: Validate before release:
```yaml
- name: Validate artifacts
  run: |
    DMG_COUNT=$(find release -name "*.dmg" -type f | wc -l | tr -d ' ')
    [ "$DMG_COUNT" -eq 0 ] && exit 1
```

**Key Learning**: Always validate artifacts exist before using them. Fail fast with clear errors.

---

## Architecture Decisions

**Decision**: Skip E2E tests in CI for minimal apps.

**Rationale**: E2E tests require Xvfb, system dependencies, and can be flaky. For minimal apps, CI should focus on fast, reliable checks (lint, typecheck, unit tests). Keep E2E available locally.

**Key Learning**: Match testing strategy to project complexity. Don't block releases on flaky tests.

---

## Key Principles

1. **Explicit over Implicit**: Configure behavior explicitly, don't rely on defaults
2. **Validate Early**: Check artifacts at each stage before proceeding
3. **Fail Fast**: Clear error messages, fail immediately
4. **Separate Concerns**: Build, test, and release in separate jobs
5. **Cross-Platform**: Account for platform differences (shell, paths)
6. **Defense in Depth**: Use multiple layers (config + CLI flags)

---

## Common Pitfalls

1. ❌ Passing empty secrets to tools expecting file paths
2. ❌ Mismatched artifact upload/download paths
3. ❌ Assuming default shell is consistent across platforms
4. ❌ Not validating artifacts before release
5. ❌ Enabling auto-publishing with custom release workflows
6. ❌ Using directory globs instead of specific file patterns
7. ❌ Not accounting for multiple architecture outputs (arm64 + x64)

---

*Last updated: January 2025*
