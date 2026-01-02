# Interactive Timer - Quick Start Guide

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Website (index.html)           │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │      Hero Section               │  │
│  │                                 │  │
│  │  ┌───────────────────────────┐ │  │
│  │  │  Interactive Timer        │ │  │
│  │  │  (timer-web.js)          │ │  │
│  │  │                           │ │  │
│  │  │  ┌─────────────────────┐ │ │  │
│  │  │  │  SVG Dial          │ │ │  │
│  │  │  │  - Draggable hand  │ │ │  │
│  │  │  │  - Sector fill     │ │ │  │
│  │  │  └─────────────────────┘ │ │  │
│  │  │                           │ │  │
│  │  │  ┌─────────────────────┐ │ │  │
│  │  │  │  Digital Display   │ │ │  │
│  │  │  │  "25:00"           │ │ │  │
│  │  │  └─────────────────────┘ │ │  │
│  │  │                           │ │  │
│  │  │  [5m] [10m] [25m] [50m]  │ │  │
│  │  │                           │ │  │
│  │  └───────────────────────────┘ │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Code Integration Example

### HTML (index.html)
```html
<div class="hero">
  <h1>Focus that feels physical.</h1>
  <p class="sub">...</p>
  <a class="btn" href="...">Download</a>
  
  <!-- Replace static image with timer container -->
  <div class="hero-image" id="timer-container">
    <!-- Timer will be injected here by timer-web.js -->
  </div>
</div>

<!-- Load timer script asynchronously -->
<script src="timer-web.js" defer></script>
<script>
  // Initialize timer when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('timer-container');
    if (container && window.initTimer) {
      window.initTimer(container, {
        maxSeconds: 3600,
        initialSeconds: 0,
        enableSounds: true,
        showPresets: true,
        showDigital: true
      });
    }
  });
</script>
```

### JavaScript API (timer-web.js structure)
```javascript
// Simplified API surface
window.initTimer = function(container, options) {
  // 1. Create timer engine
  const timer = createTimerEngine({
    initialSeconds: options.initialSeconds || 0,
    onTick: (seconds) => updateDisplay(seconds),
    onDone: () => handleCompletion()
  });
  
  // 2. Create clock UI
  const clock = createPomodoroClock({
    host: container,
    maxSeconds: options.maxSeconds || 3600,
    getSeconds: () => timer.getRemainingSeconds(),
    setSeconds: (s) => timer.setRemainingSeconds(s),
    start: () => timer.start(),
    pause: () => timer.pause(),
    canEdit: () => !timer.isRunning(),
    onMinuteStep: () => playTickSound()
  });
  
  // 3. Initialize with presets
  if (options.showPresets) {
    setupPresetButtons(clock, timer);
  }
};
```

## File Size Estimates

| Component | Size (gzipped) | Notes |
|-----------|---------------|-------|
| timer-web.js | ~18KB | Core timer logic + clock rendering |
| timer-web.css | ~3KB | Timer-specific styles |
| tick.wav | ~8KB | Optional sound effect |
| chime.wav | ~12KB | Optional completion sound |
| **Total** | **~41KB** | Minimal impact on page load |

## Performance Budget

- **JavaScript Parse Time**: < 50ms
- **Initial Render**: < 100ms
- **Animation FPS**: 60fps (smooth)
- **Memory Usage**: < 5MB
- **Lighthouse Score**: Maintain 90+

## Key Differences from Electron App

| Feature | Electron App | Website Version |
|---------|-------------|-----------------|
| Color Themes | ✅ Full picker | ❌ Single theme (green) |
| Window Controls | ✅ Yes | ❌ N/A |
| System Notifications | ✅ Native | ⚠️ Browser notifications |
| Sound Effects | ✅ Full | ✅ Full (optional) |
| Preset Buttons | ✅ Yes | ✅ Yes |
| Digital Display | ✅ Toggleable | ✅ Toggleable |
| Drag Interaction | ✅ Yes | ✅ Yes |
| Detent Snapping | ✅ Yes | ✅ Yes |

## Implementation Checklist

### Core Functionality
- [ ] Port timer engine (requestAnimationFrame loop)
- [ ] Port clock rendering (SVG generation)
- [ ] Port clockwork interaction (drag, detents, settle)
- [ ] Port time formatting utilities
- [ ] Integrate with HTML page

### UI Components
- [ ] SVG dial with ticks and numbers
- [ ] Draggable hand
- [ ] Sector fill animation
- [ ] Digital time display
- [ ] Preset buttons (5/10/25/50m)
- [ ] Center knob (start/pause)

### Interactions
- [ ] Drag hand to set time
- [ ] Click center to start/pause
- [ ] Click presets to set time
- [ ] Visual feedback on interactions
- [ ] Smooth animations

### Audio (Optional)
- [ ] Tick sound on drag
- [ ] Chime on completion
- [ ] Lazy load audio files

### Polish
- [ ] Responsive design (mobile/desktop)
- [ ] Style integration with website
- [ ] Accessibility (ARIA, keyboard)
- [ ] Cross-browser testing
- [ ] Performance optimization

## Quick Win: MVP Version

Start with a simplified version to validate the concept:

1. **Static SVG dial** (no drag initially)
2. **Preset buttons** (5/10/25/50m)
3. **Start/pause button**
4. **Digital display**
5. **Basic countdown**

Then add drag interaction and sounds in Phase 2.

## Testing Strategy

### Manual Testing
- Desktop: Chrome, Firefox, Safari
- Mobile: iOS Safari, Chrome Android
- Touch interactions
- Keyboard navigation

### Performance Testing
- Lighthouse audit
- Bundle size analysis
- Animation frame rate
- Memory profiling

### User Testing
- A/B test vs static image
- Measure engagement
- Collect feedback

