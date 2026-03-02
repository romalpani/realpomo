# RealPomo

A minimal Pomodoro-style timer desktop app inspired by the physical Time Timer dial. RealPomo provides a beautiful, distraction-free visual timer with an intuitive circular interface that shows remaining time at a glance.

## Download

### Latest Release
Download the latest version from our [website](https://romalpani.github.io/realpomo) or directly from [GitHub Releases](https://github.com/romalpani/realpomo/releases/latest).

### System Requirements
- **macOS**: 10.13 (High Sierra) or later
- **Windows**: Windows 10 or later

### Installation
1. Download the DMG (macOS) or installer (Windows) from the latest release
2. Open the downloaded file
3. For macOS: Drag RealPomo to your Applications folder
4. For Windows: Run the installer and follow the prompts
5. Launch RealPomo from Applications/Start Menu

[View all releases →](https://github.com/romalpani/realpomo/releases)

## Features

### Visual Timer Interface
- **Circular dial design** - Inspired by the Time Timer, featuring a visual countdown sector that shrinks as time elapses
- **Drag to set time** - Click and drag around the dial to set your desired timer duration (up to 60 minutes)
- **Quick presets** - One-click buttons for common durations: 5m, 10m, 25m, and 50m
- **Center knob reset** - Click the center knob to reset the timer to 00:00
- **Minute markers** - Clear visual indicators every 5 minutes for easy time selection

### User Experience
- **Audio feedback** - Subtle tick sounds when adjusting the timer, and a pleasant chime when the timer completes
- **Desktop notifications** - System notification when your timer finishes ("Nice work. Take a breath.")
- **Visual completion** - Brief visual feedback when the timer reaches zero
- **Smooth animations** - Real-time updates using requestAnimationFrame for fluid countdown

### Desktop App Features
- **Native window** - Transparent window with vibrancy effects (macOS) and Mica material (Windows 11+)
- **Single instance** - Only one window can be open at a time; reopening focuses the existing window
- **Compact size** - Small, focused window (440×580px) that stays out of your way
- **Cross-platform** - Works on macOS and Windows

## How to Use

1. **Set the timer**: Click and drag around the dial, or use the quick preset buttons (5m, 10m, 25m, 50m)
2. **Start**: The timer automatically starts when you set a duration greater than zero
3. **Pause/Resume**: Click the dial while running to pause; click again to resume
4. **Reset**: Click the center knob to reset to 00:00
5. **Completion**: When the timer reaches zero, you'll hear a chime and receive a desktop notification

## Development

### Project Structure

RealPomo uses **npm workspaces** to share business logic across platforms:

```
packages/
  core/     — Shared timer engine, clockwork math, time formatting, colors
  mobile/   — React Native (Expo) app for iOS & Android
src/          — Electron desktop app (unchanged)
```

### Setup
```bash
npm install
npm run dev
```

### Quality Checks
- **Typecheck**: `npm run typecheck`
- **Lint**: `npm run lint` (autofix: `npm run lint:fix`)
- **Format**: `npm run format` (check only: `npm run format:check`)
- **Unit tests**: `npm run test:unit` (watch: `npm run test:unit:watch`, coverage: `npm run test:unit:coverage`)
- **Core tests**: `cd packages/core && npm test`
- **E2E smoke test** (builds app bundles first): `npm run test:e2e`

### Running the Mobile App

The mobile app lives in `packages/mobile/` and uses **Expo** (React Native).

#### Prerequisites
- Node.js 18+
- **iOS**: macOS with Xcode 15+ and an iOS Simulator
- **Android**: Android Studio with an Android emulator
- **Device testing**: Install the [Expo Go](https://expo.dev/go) app on your phone

#### Quick Start
```bash
cd packages/mobile
npm install
npx expo start
```

Then:
- Press **i** to open iOS Simulator
- Press **a** to open Android Emulator
- Scan the QR code with Expo Go on a physical device

#### Testing Checklist for Mobile
1. **Timer setting** — Tap a minute preset (5, 10, 15, 20, 25, 30, 45, 60) and verify the clock face updates
2. **Start/Pause** — Tap Start, verify countdown runs; tap Pause, verify it stops
3. **Reset** — Tap Reset, verify clock returns to 00:00
4. **Timer completion** — Set 1 minute (or shortest), let it complete; verify haptic feedback fires
5. **Background handling** — Start a timer, switch to another app, return; verify remaining time is accurate
6. **Color picker** — Tap each color swatch and verify the clock face, sector, and controls update
7. **Orientation** — Verify portrait orientation lock works correctly
8. **Accessibility** — Enable VoiceOver/TalkBack and verify all buttons are labeled

## Build

### Production Build (macOS / Windows)
```bash
npm run build
```

### Development Build (bundles only)
```bash
npm run build:app
```

## Technology Stack

- **Electron** - Cross-platform desktop framework
- **React Native (Expo)** - iOS & Android mobile framework
- **Vite** - Fast build tool and dev server (desktop)
- **TypeScript** - Type-safe development
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Web Audio API** - Audio feedback (desktop)
- **expo-haptics** - Haptic feedback (mobile)

## License

Private project.
