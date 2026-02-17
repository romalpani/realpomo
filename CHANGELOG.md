# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-10

### Added

- Auto-update feature with electron-updater
- Task tracking features with updated app images and HTML metadata
- Story page with Medium-style typography
- Code signing configuration for macOS
- Mobile conversion planning documents

### Changed

- Reorganized hero section layout on website
- Removed outdated macOS security instructions from website

### Fixed

- Countdown hand snap behavior to show next minute marker
- Quarantine attributes on macOS builds to prevent Gatekeeper warnings
- Tick sound loading with static import and data URL handling
- Apple notarization environment variable name
- ESLint error in confetti animation (function declaration to arrow function)
- Release workflow improvements (artifact paths, permissions, auto-publish)
- E2E test compatibility fixes for CI environment

## [1.0.0] - 2026-01-01

### Added

- Pomodoro clock desktop application built with Electron
- Color picker functionality for the clock face
- Clockwork mechanics with tick sound interaction
- Context menu and visibility preferences
- Release pipeline, website, icon, and CI/CD setup
- Security policy documentation

[Unreleased]: https://github.com/romalpani/realpomo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/romalpani/realpomo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/romalpani/realpomo/releases/tag/v1.0.0
