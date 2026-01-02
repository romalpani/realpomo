# Interactive Timer on Website - Implementation Plan

## Overview
Replace the static `app-1.png` image in the hero section with a fully interactive timer that matches the Electron app experience. The goal is high-quality impact while keeping the website lightweight and performant.

## Architecture Approach

### Option 1: Standalone Web Component (Recommended)
Create a lightweight, self-contained timer component that can be embedded directly in the HTML page. This keeps dependencies minimal and ensures fast loading.

**Pros:**
- No build step required for the website
- Minimal JavaScript bundle size (~15-20KB gzipped)
- Works immediately, no framework overhead
- Easy to maintain and update

**Cons:**
- Need to adapt TypeScript code to vanilla JavaScript (or use a simple build step)

### Option 2: Shared Module with Build Step
Extract timer logic into a shared module that both Electron app and website can use.

**Pros:**
- Single source of truth
- TypeScript support maintained

**Cons:**
- Requires build pipeline for website
- More complex deployment

**Recommendation: Option 1** - Keep website simple and fast.

## What to Reuse from Electron App

### Core Components to Port:
1. **Timer Engine** (`timer.ts`)
   - `requestAnimationFrame`-based timing
   - Start/pause/reset functionality
   - Tick callbacks

2. **Clock Component** (`clock.ts`)
   - SVG dial rendering
   - Drag interaction
   - Visual updates

3. **Clockwork Logic** (`clockwork.ts`)
   - Detent snapping
   - Velocity-based behavior
   - Settle animations

4. **Time Formatting** (`time.ts`)
   - `formatTimerTime()` function

### What to Adapt/Simplify:

1. **Sound Effects** (`sound.ts`)
   - **Option A**: Use Web Audio API (same as Electron) - lightweight, works well
   - **Option B**: Skip sounds initially, add later if needed
   - **Recommendation**: Include sounds - they're a key part of the "physical feel"

2. **Color Picker**
   - Skip for website version (keep default green theme)
   - Can add later if desired

3. **Preset Buttons**
   - Keep these! They're great for quick interaction
   - Show: 5m, 10m, 25m, 50m

4. **Digital Timer Display**
   - Keep it - shows current time
   - Make toggleable (hide/show) like in Electron app

## Performance Optimizations

### 1. Lazy Loading
- Load timer JavaScript only when user scrolls near hero section
- Or load immediately but defer heavy initialization

### 2. Code Splitting
- Timer code in separate file (`timer-web.js`)
- Load asynchronously: `<script src="timer-web.js" defer></script>`

### 3. SVG Optimization
- Pre-render static SVG elements (ticks, numbers)
- Only animate dynamic parts (hand, sector)

### 4. Animation Performance
- Use CSS transforms for hand rotation (GPU accelerated)
- Throttle tick updates if needed (though `requestAnimationFrame` is already optimal)

### 5. Sound Loading
- Load audio files lazily (on first interaction)
- Use small, compressed WAV files
- Consider Web Audio API synthesis for tick sound (no file needed)

### 6. Bundle Size Targets
- Total JavaScript: < 30KB gzipped
- CSS: < 5KB gzipped
- Assets (sounds): < 50KB total

## Implementation Structure

### File Organization
```
docs/
├── index.html (modified)
├── timer-web.js (new - standalone timer component)
├── timer-web.css (new - timer-specific styles)
└── assets/
    ├── tick.wav (optional - or synthesize)
    └── chime.wav (optional - or synthesize)
```

### HTML Integration
Replace the hero image section:
```html
<!-- Before -->
<div class="hero-image">
  <img src="app-1.png" alt="realpomo app UI showing timer dial" />
</div>

<!-- After -->
<div class="hero-image" id="timer-container">
  <!-- Timer will be injected here -->
</div>
```

### JavaScript API
Simple initialization:
```javascript
// timer-web.js exports:
initTimer(containerElement, options)
```

Options:
- `maxSeconds`: Maximum time (default: 3600)
- `initialSeconds`: Starting time (default: 0)
- `enableSounds`: Enable audio feedback (default: true)
- `showPresets`: Show preset buttons (default: true)
- `showDigital`: Show digital display (default: true)

## Visual Design Considerations

### 1. Size & Responsiveness
- Desktop: ~400px × 400px (matches Electron app)
- Mobile: Scale down to ~300px × 300px
- Maintain aspect ratio

### 2. Styling Integration
- Match website's color scheme (accent: `#ff6347`)
- Use website's existing CSS variables where possible
- Ensure timer doesn't clash with hero section background

### 3. Interaction Feedback
- Cursor changes: `grab` → `grabbing` during drag
- Visual feedback on preset button clicks
- Smooth animations (match Electron app feel)

## Feature Parity with Electron App

### Core Features (Must Have)
- ✅ Draggable dial to set time
- ✅ Detent snapping (60 steps per rotation)
- ✅ Start/pause on center click
- ✅ Digital time display
- ✅ Preset buttons (5/10/25/50 min)
- ✅ Visual sector fill as time counts down
- ✅ Smooth animations

### Nice-to-Have Features
- ⚠️ Sound effects (tick on drag, chime on completion)
- ⚠️ Hide/show digital display toggle
- ⚠️ Completion notification (browser notification API)

### Skip for Website
- ❌ Color picker (keep default green)
- ❌ Window controls
- ❌ System notifications (use browser notifications instead)

## Implementation Steps

### Phase 1: Core Timer (Week 1)
1. Port timer engine (`timer.ts`) to vanilla JS
2. Port clock rendering (`clock.ts`) - SVG generation
3. Port clockwork interaction (`clockwork.ts`)
4. Basic drag interaction working
5. Visual updates working

### Phase 2: Polish (Week 2)
1. Add preset buttons
2. Add digital display
3. Style integration with website
4. Responsive design
5. Performance testing

### Phase 3: Audio & Final Touches (Week 3)
1. Sound effects (tick, chime)
2. Browser notification on completion
3. Accessibility improvements (ARIA labels, keyboard support)
4. Cross-browser testing
5. Performance optimization pass

## Technical Considerations

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Use Pointer Events API (with fallback to Mouse/Touch)
- Web Audio API for sounds (with graceful degradation)

### Accessibility
- ARIA labels for timer controls
- Keyboard navigation (arrow keys to adjust time)
- Screen reader support
- Focus management

### SEO & Performance
- Timer doesn't block page load (async script)
- No impact on Core Web Vitals
- Graceful degradation if JS fails

## Code Reuse Strategy

### Shared Logic
Extract these into reusable functions:
- `formatTimerTime(seconds)` - time formatting
- `secondsToAngle(seconds, maxSeconds)` - conversion
- `angleToSeconds(angle, maxSeconds)` - conversion
- `clamp(value, min, max)` - utility

### Web-Specific Adaptations
- Remove Electron-specific APIs (`window.timerApi`)
- Use browser APIs for notifications
- Simplify color system (single theme)
- Remove window chrome styling

## Testing Strategy

### Manual Testing
- Drag interaction on desktop (mouse)
- Touch interaction on mobile
- Preset button clicks
- Start/pause functionality
- Visual updates during countdown
- Sound playback (if enabled)

### Performance Testing
- Lighthouse score (should maintain 90+)
- Bundle size analysis
- Animation frame rate (60fps target)
- Memory usage (should be minimal)

## Rollout Plan

### Option A: A/B Test
- Show interactive timer to 50% of users
- Static image to other 50%
- Measure engagement metrics

### Option B: Gradual Rollout
- Deploy behind feature flag
- Enable for small percentage
- Gradually increase if metrics are positive

### Option C: Full Rollout
- Deploy to all users immediately
- Monitor for issues
- Quick rollback if needed

## Success Metrics

### Engagement
- Time spent on hero section
- Timer interactions (drags, clicks)
- Preset button usage

### Performance
- Page load time (should not increase)
- Lighthouse score (maintain 90+)
- Animation smoothness (60fps)

### User Feedback
- Positive comments about interactivity
- No complaints about performance
- Increased download conversions

## Future Enhancements

### Phase 2 Ideas
- Multiple color themes (like Electron app)
- Timer persistence (localStorage)
- Share timer state via URL
- Full-screen timer mode

### Phase 3 Ideas
- Pomodoro session tracking
- Statistics dashboard
- Export timer sessions

## Risk Mitigation

### Performance Concerns
- **Risk**: Timer slows down page
- **Mitigation**: Lazy load, async script, performance budgets

### Browser Compatibility
- **Risk**: Doesn't work on older browsers
- **Mitigation**: Feature detection, graceful degradation

### Bundle Size
- **Risk**: JavaScript bundle too large
- **Mitigation**: Code splitting, tree shaking, compression

### Maintenance Burden
- **Risk**: Two codebases to maintain
- **Mitigation**: Extract shared utilities, document differences

## Conclusion

This plan provides a lightweight, high-impact interactive timer that matches the Electron app experience while keeping the website fast and performant. The standalone component approach ensures minimal complexity while delivering maximum value.

**Estimated Implementation Time**: 2-3 weeks
**Estimated Bundle Size**: ~25KB gzipped (JS + CSS)
**Performance Impact**: Minimal (< 100ms added to page load)

