# RealPomo Mobile Conversion Plan

## Executive Summary

This document outlines a comprehensive plan to convert RealPomo from an Electron desktop app to native iOS and Android mobile apps while preserving all functionality, maintaining the existing Electron app, and updating the website to support mobile downloads.

**Recommended Approach**: Build native mobile apps using **React Native** with a shared codebase strategy, allowing maximum code reuse while delivering native performance and UX.

---

## Table of Contents

1. [Technology Recommendation](#technology-recommendation)
2. [Architecture Strategy](#architecture-strategy)
3. [Feature Mapping & Mobile Adaptations](#feature-mapping--mobile-adaptations)
4. [Sound Implementation Strategy](#sound-implementation-strategy)
5. [Project Structure](#project-structure)
6. [Development Phases](#development-phases)
7. [Website Updates](#website-updates)
8. [Testing Strategy](#testing-strategy)
9. [Deployment & Distribution](#deployment--distribution)
10. [Risk Mitigation](#risk-mitigation)

---

## Technology Recommendation

### Option 1: React Native (RECOMMENDED) ⭐

**Pros:**
- **Maximum code reuse**: Share ~80-90% of business logic (timer engine, clock rendering, color picker)
- **Native performance**: True native apps with smooth 60fps animations
- **Mature ecosystem**: Well-established libraries for audio, notifications, storage
- **Single codebase**: One TypeScript codebase for both platforms
- **Active development**: Strong community and Facebook/Meta backing
- **Easy to hire**: Large developer pool

**Cons:**
- Requires React Native knowledge (but similar to web React)
- Some platform-specific code needed for native features

**Best for**: Maximum code reuse, native performance, long-term maintainability

### Option 2: Flutter

**Pros:**
- Excellent performance and smooth animations
- Single codebase (Dart)
- Great UI customization

**Cons:**
- **Zero code reuse**: Would need to rewrite everything in Dart
- Different language and framework (steeper learning curve)
- Less code sharing with existing web/Electron codebase

**Best for**: If starting from scratch, but not ideal here since we have existing TypeScript code

### Option 3: Capacitor (Ionic)

**Pros:**
- **Maximum code reuse**: Can reuse entire web codebase
- Web technologies (HTML/CSS/JS)

**Cons:**
- **Performance concerns**: WebView-based, may feel less native
- **Limited native feel**: Animations and interactions may not feel as smooth
- **Battery impact**: WebView apps can be less battery-efficient

**Best for**: Quick conversion, but may compromise on native feel

### Option 4: Native Development (Swift + Kotlin)

**Pros:**
- Best performance and native feel
- Full platform API access

**Cons:**
- **Zero code reuse**: Complete rewrite required
- **Two codebases**: Need separate iOS and Android teams
- **Longer development time**: 2-3x longer than React Native

**Best for**: Large teams with platform-specific expertise, not ideal for solo/small teams

---

## Architecture Strategy

### Recommended: Monorepo with Shared Core

```
realpomo/
├── packages/
│   ├── core/                    # Shared business logic
│   │   ├── timer.ts             # Timer engine (reuse from Electron)
│   │   ├── clockwork.ts         # Clock interaction logic
│   │   ├── time.ts              # Time formatting utilities
│   │   ├── math.ts              # Math utilities
│   │   └── color-picker.ts      # Color picker logic
│   │
│   ├── electron/                # Existing Electron app (unchanged)
│   │   └── src/
│   │
│   ├── mobile/                  # React Native app
│   │   ├── src/
│   │   │   ├── components/      # React Native components
│   │   │   │   ├── Clock.tsx    # Clock component (uses core)
│   │   │   │   ├── Timer.tsx    # Timer component
│   │   │   │   └── ColorPicker.tsx
│   │   │   ├── screens/         # App screens
│   │   │   │   └── TimerScreen.tsx
│   │   │   ├── services/        # Platform-specific services
│   │   │   │   ├── sound.ts     # React Native sound service
│   │   │   │   └── notifications.ts
│   │   │   └── App.tsx
│   │   ├── ios/                 # iOS native code
│   │   ├── android/             # Android native code
│   │   └── package.json
│   │
│   └── web/                     # Website (existing docs/)
│       └── docs/
│
└── package.json                 # Root package.json (workspace)
```

### Code Sharing Strategy

1. **Pure TypeScript modules** → Share directly (timer.ts, clockwork.ts, time.ts, math.ts)
2. **UI Components** → Rewrite in React Native (but reuse logic)
3. **Platform APIs** → Abstract behind interfaces, implement per platform

---

## Feature Mapping & Mobile Adaptations

### ✅ Core Features (100% Preserved)

| Feature | Electron Implementation | Mobile Adaptation | Notes |
|---------|------------------------|-------------------|-------|
| **Circular dial timer** | SVG with drag interaction | React Native SVG with PanResponder | Same visual, touch-optimized |
| **Drag to set time** | Pointer events | PanResponder/Gesture Handler | More responsive on touch |
| **Quick presets (5m, 10m, 25m, 50m)** | Button clicks | Touch-optimized buttons | Larger touch targets (44pt min) |
| **Center knob reset** | Click detection | Touch detection | Same interaction |
| **Timer countdown** | requestAnimationFrame | React Native Animated API | Smooth 60fps animations |
| **Pause/Resume** | Click dial | Tap dial | Same interaction |
| **Color themes (5 presets)** | Color picker dropdown | Bottom sheet or modal | Mobile-friendly UI pattern |
| **LocalStorage preferences** | localStorage | AsyncStorage | Same API, async on mobile |
| **Minute markers** | SVG ticks | Same SVG rendering | Visual unchanged |

### 🔄 Adapted Features (Mobile-Optimized)

| Feature | Electron | Mobile | Rationale |
|---------|----------|--------|-----------|
| **Right-click context menu** | Context menu | Settings icon in header | Mobile doesn't have right-click |
| **Show/Hide timer display** | Context menu option | Settings screen toggle | Better UX in settings |
| **Show/Hide presets** | Context menu option | Settings screen toggle | Better UX in settings |
| **Window size** | Fixed 440×580px | Full screen (with safe areas) | Mobile is full-screen by default |
| **Desktop notifications** | Electron Notification API | React Native Push Notifications | Platform-specific APIs |
| **Window vibrancy** | macOS vibrancy effect | System blur (iOS) / Material (Android) | Platform-appropriate |

### 📱 New Mobile-Specific Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Haptic feedback** | Subtle vibration on minute markers | High - enhances tactile feel |
| **Background timer** | Continue running when app is backgrounded | High - essential for timer apps |
| **Lock screen widget** | Show timer on lock screen (iOS) | Medium - nice to have |
| **App shortcuts** | Quick actions from home screen | Medium - quick access to presets |
| **Dark mode support** | Respect system dark mode | High - standard expectation |
| **Safe area handling** | Respect notches and system UI | High - required for modern devices |

---

## Sound Implementation Strategy

### Current Implementation (Electron)
- **Tick sound**: WAV file (`clock_tick_extracted.wav`) loaded via Web Audio API
- **Completion chime**: Synthesized using Web Audio API oscillators
- **Rate limiting**: 60ms minimum interval between ticks

### Mobile Implementation

#### Option 1: React Native Sound (RECOMMENDED)

**Library**: `react-native-sound` or `expo-av` (if using Expo)

**Implementation:**
```typescript
// packages/mobile/src/services/sound.ts
import Sound from 'react-native-sound';

// Preload tick sound
const tickSound = new Sound('clock_tick_extracted.wav', Sound.MAIN_BUNDLE);

export function playSetTick() {
  tickSound.setCurrentTime(0);
  tickSound.play();
}

// Completion chime - use same Web Audio API approach or pre-recorded chime
```

**Pros:**
- Simple API
- Works offline
- Low latency
- Can reuse existing WAV file

**Cons:**
- Need to bundle audio files
- Platform-specific file handling

#### Option 2: Web Audio API (Alternative)

**Implementation:**
- Use `react-native-webview` with Web Audio API
- Or use `react-native-audio` for Web Audio API support

**Pros:**
- Can reuse exact same code
- More flexible for synthesized sounds

**Cons:**
- More complex setup
- May have latency issues

### Audio File Management

1. **Bundle audio files** in app (iOS: Xcode assets, Android: `res/raw/`)
2. **Preload on app start** to minimize latency
3. **Respect device volume** and silent mode (iOS: respect silent switch)
4. **Background audio** (optional): Continue playing when app backgrounds

### Platform Considerations

**iOS:**
- Respect silent mode switch (check `AVAudioSession`)
- May need background audio capability for background timer
- Audio files must be in app bundle

**Android:**
- Respect Do Not Disturb mode
- Audio focus management (pause when other audio plays)
- Audio files in `res/raw/` directory

---

## Project Structure

### Phase 1: Setup Monorepo

```
realpomo/
├── packages/
│   ├── core/                          # NEW: Shared business logic
│   │   ├── src/
│   │   │   ├── timer.ts              # Move from electron
│   │   │   ├── clockwork.ts          # Move from electron
│   │   │   ├── time.ts               # Move from electron
│   │   │   ├── math.ts               # Move from electron
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── electron/                      # EXISTING: Keep as-is
│   │   └── src/
│   │       └── renderer/
│   │           └── src/
│   │               └── ui/
│   │                   ├── timer.ts  # Refactor to import from core
│   │                   └── clock.ts  # Refactor to import from core
│   │
│   ├── mobile/                        # NEW: React Native app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Clock.tsx
│   │   │   │   ├── Timer.tsx
│   │   │   │   └── ColorPicker.tsx
│   │   │   ├── screens/
│   │   │   │   └── TimerScreen.tsx
│   │   │   ├── services/
│   │   │   │   ├── sound.ts
│   │   │   │   └── notifications.ts
│   │   │   ├── navigation/
│   │   │   │   └── AppNavigator.tsx
│   │   │   └── App.tsx
│   │   ├── assets/
│   │   │   └── sounds/
│   │   │       └── clock_tick_extracted.wav
│   │   ├── ios/                       # iOS native project
│   │   ├── android/                   # Android native project
│   │   ├── package.json
│   │   └── app.json                   # Expo config (if using Expo)
│   │
│   └── web/                           # EXISTING: Website (docs/)
│       └── docs/
│
├── package.json                       # Root workspace config
└── pnpm-workspace.yaml               # or npm/yarn workspaces
```

### Refactoring Strategy

1. **Extract core logic** from Electron app to `packages/core`
2. **Update Electron app** to import from `packages/core`
3. **Build mobile app** using `packages/core` + React Native UI
4. **Test Electron app** after refactoring to ensure nothing broke

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Set up monorepo and extract shared code without breaking Electron app

**Tasks:**
- [ ] Set up monorepo structure (pnpm/npm workspaces)
- [ ] Create `packages/core` package
- [ ] Move pure TypeScript modules to core:
  - [ ] `timer.ts` → `core/src/timer.ts`
  - [ ] `clockwork.ts` → `core/src/clockwork.ts`
  - [ ] `time.ts` → `core/src/time.ts`
  - [ ] `math.ts` → `core/src/math.ts`
- [ ] Update Electron app to import from `packages/core`
- [ ] Run Electron tests to ensure nothing broke
- [ ] Build and test Electron app manually

**Deliverable**: Electron app still works, core logic extracted

---

### Phase 2: React Native Setup (Week 2-3)

**Goal**: Initialize React Native project and basic structure

**Tasks:**
- [ ] Initialize React Native project (Expo or bare React Native)
- [ ] Set up TypeScript configuration
- [ ] Configure monorepo to link `packages/core`
- [ ] Set up basic navigation (if needed)
- [ ] Create basic app shell with safe areas
- [ ] Test on iOS simulator
- [ ] Test on Android emulator

**Deliverable**: Basic React Native app running on both platforms

---

### Phase 3: Core UI Components (Week 3-5)

**Goal**: Build clock and timer UI components

**Tasks:**
- [ ] Install React Native SVG (`react-native-svg`)
- [ ] Port clock rendering to React Native:
  - [ ] SVG dial with sector fill
  - [ ] Minute markers and numbers
  - [ ] Center knob
  - [ ] Hand indicator (at 00:00)
- [ ] Implement touch interaction:
  - [ ] PanResponder for drag-to-set
  - [ ] Touch detection for center knob
  - [ ] Touch detection for preset buttons
- [ ] Port timer display (digital time)
- [ ] Port preset buttons (5m, 10m, 25m, 50m)
- [ ] Test touch interactions on both platforms

**Deliverable**: Functional clock UI with touch interactions

---

### Phase 4: Timer Logic Integration (Week 5-6)

**Goal**: Connect timer engine to UI

**Tasks:**
- [ ] Integrate `packages/core` timer engine
- [ ] Connect timer state to clock component
- [ ] Implement pause/resume on tap
- [ ] Implement reset on center knob tap
- [ ] Test timer accuracy and performance
- [ ] Ensure smooth animations (60fps)

**Deliverable**: Fully functional timer with accurate countdown

---

### Phase 5: Sound Implementation (Week 6-7)

**Goal**: Implement audio feedback

**Tasks:**
- [ ] Choose sound library (`react-native-sound` or `expo-av`)
- [ ] Bundle tick sound WAV file:
  - [ ] iOS: Add to Xcode project assets
  - [ ] Android: Add to `res/raw/`
- [ ] Implement `playSetTick()` function
- [ ] Implement `playDoneChime()` (synthesized or pre-recorded)
- [ ] Add rate limiting (60ms minimum interval)
- [ ] Test on physical devices (audio latency)
- [ ] Handle silent mode (iOS) and Do Not Disturb (Android)

**Deliverable**: Working audio feedback matching Electron app

---

### Phase 6: Settings & Preferences (Week 7-8)

**Goal**: Mobile-optimized settings UI

**Tasks:**
- [ ] Create settings screen (modal or separate screen)
- [ ] Port color picker to mobile UI (bottom sheet or grid)
- [ ] Implement show/hide timer display toggle
- [ ] Implement show/hide presets toggle
- [ ] Use AsyncStorage for preferences
- [ ] Test preference persistence

**Deliverable**: Settings screen with all preferences

---

### Phase 7: Notifications & Background (Week 8-9)

**Goal**: Timer completion notifications

**Tasks:**
- [ ] Set up push notification permissions
- [ ] Implement local notifications (timer completion)
- [ ] Test notification on timer completion
- [ ] Handle background timer (if needed):
  - [ ] iOS: Background tasks
  - [ ] Android: Foreground service (optional)
- [ ] Test app behavior when backgrounded

**Deliverable**: Notifications working, background timer (if implemented)

---

### Phase 8: Polish & Mobile Optimizations (Week 9-10)

**Goal**: Mobile-specific enhancements

**Tasks:**
- [ ] Add haptic feedback on minute markers
- [ ] Implement dark mode support
- [ ] Optimize for different screen sizes
- [ ] Add app icons and splash screens
- [ ] Test on various devices (iPhone SE, iPad, Android phones/tablets)
- [ ] Performance optimization
- [ ] Accessibility improvements

**Deliverable**: Polished mobile app ready for testing

---

### Phase 9: Testing & QA (Week 10-11)

**Goal**: Comprehensive testing

**Tasks:**
- [ ] Unit tests for core logic (reuse from Electron)
- [ ] Integration tests for timer flow
- [ ] Manual testing on iOS devices
- [ ] Manual testing on Android devices
- [ ] Test edge cases (rapid taps, backgrounding, etc.)
- [ ] Test sound on various devices
- [ ] Test notifications
- [ ] Performance profiling

**Deliverable**: Tested and validated mobile apps

---

### Phase 10: App Store Preparation (Week 11-12)

**Goal**: Prepare for distribution

**Tasks:**
- [ ] Create App Store Connect listing (iOS)
- [ ] Create Google Play Console listing (Android)
- [ ] Prepare screenshots and app previews
- [ ] Write app descriptions
- [ ] Set up app signing certificates
- [ ] Build release versions
- [ ] Submit for review

**Deliverable**: Apps submitted to App Store and Google Play

---

## Website Updates

### Current Website Structure

The website is hosted on GitHub Pages (`docs/` folder) and includes:
- Hero section with interactive timer demo
- Download buttons (auto-update from GitHub Releases)
- Feature sections
- Open source section

### Mobile App Integration Strategy

#### Option 1: Smart Download Buttons (RECOMMENDED)

**Implementation:**
- Detect user's device/platform
- Show appropriate download button:
  - iOS → App Store button
  - Android → Google Play button
  - Desktop → Existing DMG/installer buttons

**Code Changes:**
```javascript
// docs/app.js - Add mobile detection
function detectPlatform() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMac = /mac|darwin/.test(userAgent);
  const isWindows = /win/.test(userAgent);
  
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  if (isMac) return 'mac';
  if (isWindows) return 'win';
  return 'unknown';
}

function updateDownloadLinks(release) {
  const platform = detectPlatform();
  const downloadBtn = document.getElementById('download-btn');
  
  if (platform === 'ios') {
    downloadBtn.href = 'https://apps.apple.com/app/realpomo/idXXXXXX';
    downloadBtn.textContent = 'Download on the App Store';
    downloadBtn.classList.add('app-store-button');
  } else if (platform === 'android') {
    downloadBtn.href = 'https://play.google.com/store/apps/details?id=com.realpomo.app';
    downloadBtn.textContent = 'Get it on Google Play';
    downloadBtn.classList.add('google-play-button');
  } else {
    // Existing desktop logic
    // ...
  }
}
```

#### Option 2: Platform Selector

**Implementation:**
- Show all platform options in a grid:
  - App Store (iOS)
  - Google Play (Android)
  - macOS DMG
  - Windows Installer

**UI:**
```
┌─────────────────────────────────┐
│  Download RealPomo              │
├─────────────────────────────────┤
│  [App Store]  [Google Play]     │
│  [macOS]      [Windows]         │
└─────────────────────────────────┘
```

### Website File Updates

**Files to modify:**
1. `docs/index.html` - Add mobile app download sections
2. `docs/app.js` - Add mobile platform detection
3. `docs/styles.css` - Style mobile download buttons

**New sections to add:**
- Mobile app download section (if using Option 2)
- App Store badges/assets
- Google Play badges/assets

### App Store Assets Needed

**iOS (App Store Connect):**
- App icon (1024×1024px)
- Screenshots (various sizes for iPhone/iPad)
- App preview video (optional)
- App description and keywords

**Android (Google Play Console):**
- App icon (512×512px)
- Screenshots (phone and tablet)
- Feature graphic (1024×500px)
- App description

### SEO Updates

Update structured data in `docs/index.html`:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "realpomo",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": ["iOS", "Android", "macOS", "Windows"],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "ratingCount": "100"
  }
}
```

---

## Testing Strategy

### Unit Tests

**Reuse existing tests:**
- `packages/core` tests (timer, clockwork, time utilities)
- Run same test suite for Electron and mobile

**New tests:**
- React Native component tests (using React Native Testing Library)
- Sound service tests
- Notification service tests

### Integration Tests

**Timer flow:**
1. Set timer → Start → Countdown → Completion → Notification
2. Set timer → Pause → Resume → Completion
3. Set timer → Reset → Verify state

**Touch interactions:**
1. Drag to set time
2. Tap center knob to reset
3. Tap preset buttons
4. Tap to pause/resume

### Device Testing Matrix

**iOS:**
- iPhone SE (small screen)
- iPhone 14 Pro (standard)
- iPhone 14 Pro Max (large screen)
- iPad (tablet)

**Android:**
- Small phone (e.g., Pixel 4a)
- Standard phone (e.g., Pixel 7)
- Large phone (e.g., Pixel 7 Pro)
- Tablet (optional)

### Test Scenarios

1. **Timer accuracy**: Run 1-minute timer, verify completion within ±1 second
2. **Sound**: Verify tick sounds play, verify completion chime
3. **Background**: Background app, verify timer continues, verify notification
4. **Interruptions**: Phone call during timer, verify behavior
5. **Battery**: Monitor battery usage during extended use
6. **Performance**: Verify 60fps animations, smooth interactions

---

## Deployment & Distribution

### iOS (App Store)

**Requirements:**
- Apple Developer Account ($99/year)
- Xcode (macOS only)
- App Store Connect access

**Process:**
1. Build release version (`npx react-native run-ios --configuration Release`)
2. Archive in Xcode
3. Upload to App Store Connect
4. Submit for review
5. Wait for approval (typically 1-3 days)

**Considerations:**
- App Review Guidelines compliance
- Privacy policy (if collecting any data)
- Age rating (likely 4+ for productivity app)

### Android (Google Play)

**Requirements:**
- Google Play Developer Account ($25 one-time)
- Android Studio (optional, for manual builds)

**Process:**
1. Build release APK/AAB (`cd android && ./gradlew assembleRelease`)
2. Create app listing in Google Play Console
3. Upload AAB file
4. Submit for review
5. Wait for approval (typically 1-7 days)

**Considerations:**
- Google Play policies compliance
- Privacy policy
- Content rating questionnaire

### Update Strategy

**Mobile apps:**
- Users update via App Store/Google Play
- Can push updates independently of Electron app
- Consider in-app update prompts for major versions

**Website:**
- Auto-updates download links (already implemented)
- Add mobile app badges/links (this plan)

**Electron app:**
- Continue existing release process
- No changes needed

---

## Risk Mitigation

### Risk 1: Breaking Electron App During Refactoring

**Mitigation:**
- Extract code incrementally
- Run Electron tests after each change
- Keep Electron app working at all times
- Use feature flags if needed
- Test Electron app manually before committing

**Rollback plan:**
- Git branches for each phase
- Can revert to previous state if issues arise

### Risk 2: Performance Issues on Mobile

**Mitigation:**
- Profile early and often
- Use React Native Performance Monitor
- Optimize animations (use `useNativeDriver`)
- Test on lower-end devices
- Consider performance budgets

**Fallback:**
- Simplify animations if needed
- Reduce visual complexity if performance is poor

### Risk 3: Sound Latency on Mobile

**Mitigation:**
- Preload audio files on app start
- Use native sound libraries (not Web Audio API)
- Test on physical devices (not just simulators)
- Consider pre-recorded chime instead of synthesized

**Fallback:**
- Use system sounds if custom sounds have latency
- Reduce sound complexity if needed

### Risk 4: App Store Rejection

**Mitigation:**
- Review App Store Guidelines before submission
- Test on TestFlight (iOS) / Internal Testing (Android) first
- Ensure all required metadata is complete
- Have privacy policy ready (even if not collecting data)

**Fallback:**
- Address feedback and resubmit
- Consider alternative distribution (TestFlight only, etc.)

### Risk 5: Code Duplication Between Platforms

**Mitigation:**
- Strictly enforce monorepo structure
- Use `packages/core` for all shared logic
- Code review to catch duplication
- Document what goes in core vs platform-specific

**Fallback:**
- Refactor duplicated code in later phase
- Accept some duplication for platform-specific optimizations

---

## Timeline Estimate

### Conservative Estimate (Solo Developer)

- **Phase 1-2**: 2 weeks (Foundation + RN Setup)
- **Phase 3-4**: 3 weeks (UI Components + Timer Logic)
- **Phase 5**: 1 week (Sound)
- **Phase 6**: 1 week (Settings)
- **Phase 7**: 1 week (Notifications)
- **Phase 8**: 1 week (Polish)
- **Phase 9**: 1 week (Testing)
- **Phase 10**: 1 week (App Store Prep)

**Total: ~12 weeks (3 months)**

### Aggressive Estimate (Experienced Developer)

- **Phase 1-2**: 1 week
- **Phase 3-4**: 2 weeks
- **Phase 5-7**: 2 weeks
- **Phase 8-9**: 1 week
- **Phase 10**: 1 week

**Total: ~7 weeks (1.5 months)**

### With Team (2-3 Developers)

- Can parallelize phases
- **Total: ~6-8 weeks**

---

## Cost Estimate

### Development Costs

- **Solo developer**: Time investment only (no additional cost)
- **Hired developer**: $50-150/hour × 200-400 hours = $10,000-$60,000

### Platform Costs

- **Apple Developer Account**: $99/year (required for App Store)
- **Google Play Developer Account**: $25 one-time (required for Google Play)

### Ongoing Costs

- **App Store**: No ongoing fees (just $99/year developer account)
- **Google Play**: No ongoing fees (just $25 one-time)

**Total one-time cost: $124** (developer accounts)

---

## Success Metrics

### Technical Metrics

- [ ] Timer accuracy: ±1 second over 60 minutes
- [ ] Animation performance: 60fps consistently
- [ ] Sound latency: <50ms
- [ ] App size: <50MB (iOS), <30MB (Android)
- [ ] Battery usage: <5% per hour of active use

### User Experience Metrics

- [ ] App Store rating: >4.0 stars
- [ ] Crash rate: <1%
- [ ] User retention: >30% day-7 retention
- [ ] Feature parity: 100% of Electron features working

### Business Metrics

- [ ] Downloads: Track via App Store/Play Console
- [ ] User feedback: Monitor reviews
- [ ] Feature requests: Track common requests

---

## Next Steps

1. **Review this plan** and decide on technology choice (React Native recommended)
2. **Set up monorepo** structure (Phase 1)
3. **Extract core logic** from Electron app (Phase 1)
4. **Initialize React Native project** (Phase 2)
5. **Begin UI component development** (Phase 3)

### Immediate Actions

1. **Decide on React Native vs alternatives** (recommend React Native)
2. **Set up development environment**:
   - Install Node.js, pnpm/npm
   - Install Xcode (for iOS, macOS only)
   - Install Android Studio (for Android)
3. **Create feature branch** for mobile development
4. **Start Phase 1**: Extract core logic to monorepo

---

## Appendix: Technology Stack Details

### React Native Stack

**Core:**
- React Native 0.72+ (latest stable)
- TypeScript 5.7+
- React 18+

**UI:**
- `react-native-svg` - SVG rendering (clock dial)
- `react-native-gesture-handler` - Advanced touch gestures (optional)
- `react-native-reanimated` - Smooth animations (optional, for advanced animations)

**Audio:**
- `react-native-sound` or `expo-av` - Audio playback
- `@react-native-async-storage/async-storage` - Local storage

**Notifications:**
- `@react-native-community/push-notification-ios` - iOS notifications
- `@react-native-firebase/messaging` or `react-native-push-notification` - Android notifications

**Navigation (if needed):**
- `@react-navigation/native` - Navigation library
- `@react-navigation/stack` or `@react-navigation/bottom-tabs`

**Development:**
- `react-native-debugger` - Debugging
- `Flipper` - Development tools
- `Detox` or `Appium` - E2E testing (optional)

### Monorepo Tools

**Package Manager:**
- `pnpm` (recommended) - Fast, efficient
- `npm` workspaces - Alternative
- `yarn` workspaces - Alternative

**Build Tools:**
- `Turborepo` (optional) - Build system for monorepos
- `Nx` (optional) - Alternative build system

---

## Questions & Decisions Needed

1. **Technology choice**: React Native, Flutter, Capacitor, or Native?
   - **Recommendation**: React Native

2. **Monorepo tool**: pnpm, npm workspaces, or yarn?
   - **Recommendation**: pnpm (fastest)

3. **React Native flavor**: Expo or bare React Native?
   - **Recommendation**: Bare React Native (more control, can add Expo later if needed)

4. **Navigation**: Single screen or multiple screens?
   - **Recommendation**: Single screen (timer) + settings modal

5. **Background timer**: Continue running when app backgrounds?
   - **Recommendation**: Yes, essential for timer app

6. **App Store strategy**: Free or paid?
   - **Recommendation**: Free (matches current Electron app)

7. **Update frequency**: How often to update mobile apps?
   - **Recommendation**: Match Electron app release cycle

---

## Conclusion

This plan provides a comprehensive roadmap for converting RealPomo to mobile while preserving all functionality and maintaining the existing Electron app. The recommended approach (React Native with shared core) maximizes code reuse, delivers native performance, and provides a clear path forward.

**Key advantages of this plan:**
- ✅ Preserves all existing functionality
- ✅ Doesn't break Electron app (incremental refactoring)
- ✅ Maximum code reuse (80-90% shared)
- ✅ Native performance and UX
- ✅ Clear phases with deliverables
- ✅ Risk mitigation strategies
- ✅ Website integration plan

**Next step**: Review and approve this plan, then begin Phase 1 (monorepo setup and core extraction).

