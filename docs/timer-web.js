/**
 * realpomo Web Timer - Standalone timer component for website
 * Ported from Electron app timer implementation
 */

(function() {
  'use strict';

  // ============================================================================
  // Production Console Wrapper
  // ============================================================================
  
  const isProduction = (function() {
    try {
      return window.location.hostname !== 'localhost' && 
             window.location.hostname !== '127.0.0.1' &&
             !window.location.hostname.startsWith('192.168.');
    } catch (e) {
      return true; // Assume production if check fails
    }
  })();

  function safeConsole(method) {
    if (typeof console === 'undefined' || !console[method]) {
      return function() {}; // No-op if console not available
    }
    if (isProduction) {
      return function() {}; // No-op in production
    }
    return function() {
      console[method].apply(console, arguments);
    };
  }

  const logger = {
    warn: safeConsole('warn'),
    error: safeConsole('error'),
    log: safeConsole('log')
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatTimerTime(seconds) {
    const s = clamp(Math.round(seconds), 0, 60 * 60);
    return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
  }

  function normalizeAngle(angle) {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
  }

  function unwrapAngleDelta(current, last) {
    let delta = current - last;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    return delta;
  }

  function smoothstep(t) {
    const clamped = clamp01(t);
    return clamped * clamped * (3 - 2 * clamped);
  }

  function easeOutQuart(p) {
    const clamped = clamp01(p);
    return 1 - Math.pow(1 - clamped, 4);
  }

  // ============================================================================
  // Timer Engine
  // ============================================================================

  function createTimerEngine(options) {
    const scheduler = options.scheduler || {
      requestAnimationFrame: (cb) => requestAnimationFrame(cb),
      cancelAnimationFrame: (id) => cancelAnimationFrame(id)
    };

    let remainingMs = options.initialSeconds * 1000;
    let running = false;
    let lastTs = 0;
    let rafId = 0;
    let lastEmittedSeconds = null;

    function currentSeconds() {
      return Math.max(0, Math.round(remainingMs / 1000));
    }

    function emitTick(force) {
      const seconds = currentSeconds();
      if (!force && lastEmittedSeconds === seconds) return;
      lastEmittedSeconds = seconds;
      options.onTick({ remainingSeconds: seconds });
    }

    function loop(ts) {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;
      remainingMs = Math.max(0, remainingMs - dt);
      emitTick();

      if (remainingMs <= 0) {
        running = false;
        lastTs = 0;
        options.onDone();
        return;
      }
      rafId = scheduler.requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = scheduler.requestAnimationFrame(loop);
    }

    function pause() {
      if (!running) return;
      running = false;
      lastTs = 0;
      if (rafId) {
        scheduler.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }
    
    function cleanup() {
      pause();
      remainingMs = 0;
      lastEmittedSeconds = null;
    }

    function reset(seconds) {
      pause();
      remainingMs = Math.max(0, seconds) * 1000;
      lastEmittedSeconds = null;
      emitTick(true);
    }

    function setRemainingSeconds(seconds) {
      remainingMs = Math.max(0, seconds) * 1000;
      lastEmittedSeconds = null;
      emitTick(true);
    }

    function getRemainingSeconds() {
      return currentSeconds();
    }

    function isRunning() {
      return running;
    }

    return {
      start,
      pause,
      reset,
      isRunning,
      setRemainingSeconds,
      getRemainingSeconds,
      cleanup: cleanup
    };
  }

  // ============================================================================
  // Clockwork Interaction (Detent Logic)
  // ============================================================================

  const STEPS = 60;
  const STEP_RAD = (2 * Math.PI) / STEPS;
  const DETENT_ZONE_FRAC = 0.20;
  const MAX_MAGNET_STRENGTH = 0.55;
  const FAST_VEL = 8.0;
  const SETTLE_MS = 180;
  const OVERSHOOT_RAD = 0.003;
  const DRAG_DEADZONE_PX = 2;

  function createClockworkState() {
    return {
      angleRaw: 0,
      angleDisplay: 0,
      angleTarget: 0,
      detentIndexCommitted: 0,
      detentIndexNearest: 0,
      velocityRadS: 0,
      isDragging: false,
      inSettleAnimation: false,
      lastPointerAngle: 0,
      lastTimeMs: 0,
      settleStartTime: 0,
      settleFrom: 0,
      settleTo: 0,
      dragStartDistance: 0,
      lastMinuteCrossed: -1
    };
  }

  function pointerToAngle(pointerX, pointerY, centerX, centerY) {
    const dx = pointerX - centerX;
    const dy = pointerY - centerY;
    const angle = Math.atan2(dx, -dy);
    return normalizeAngle(angle);
  }

  function nearestDetentIndex(angle) {
    return Math.round(angle / STEP_RAD);
  }

  function committedDetentIndex(angle) {
    return Math.floor(angle / STEP_RAD + 0.5);
  }

  function applyMagnet(angle, velocityRadS) {
    const idxN = nearestDetentIndex(angle);
    const detentAngle = idxN * STEP_RAD;
    let delta = angle - detentAngle;
    
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    
    const dist = Math.abs(delta);
    const zone = DETENT_ZONE_FRAC * STEP_RAD;
    const v = clamp01(Math.abs(velocityRadS) / FAST_VEL);
    const strength = MAX_MAGNET_STRENGTH * (1 - v);

    if (dist < zone) {
      const t = 1 - (dist / zone);
      const pull = smoothstep(t) * strength;
      return angle - delta * pull;
    }
    
    return angle;
  }

  function startDrag(state, pointerX, pointerY, centerX, centerY, currentAngle, maxSeconds) {
    const dx = pointerX - centerX;
    const dy = pointerY - centerY;
    const dist = Math.hypot(dx, dy);
    
    if (dist < DRAG_DEADZONE_PX) {
      return false;
    }
    
    state.isDragging = true;
    state.inSettleAnimation = false;
    state.dragStartDistance = dist;
    
    const angle = pointerToAngle(pointerX, pointerY, centerX, centerY);
    state.angleRaw = angle;
    state.angleDisplay = angle;
    state.lastPointerAngle = angle;
    state.lastTimeMs = performance.now();
    state.velocityRadS = 0;
    
    state.detentIndexCommitted = committedDetentIndex(currentAngle);
    const currentSeconds = angleToSeconds(currentAngle, maxSeconds);
    state.lastMinuteCrossed = Math.floor(currentSeconds / 60);
    
    return true;
  }

  function updateDrag(state, pointerX, pointerY, centerX, centerY, maxSeconds) {
    if (!state.isDragging) return false;
    
    const now = performance.now();
    const angle = pointerToAngle(pointerX, pointerY, centerX, centerY);
    
    const delta = unwrapAngleDelta(angle, state.lastPointerAngle);
    state.angleRaw = normalizeAngle(state.angleRaw + delta);
    
    const dt = Math.max(0.001, (now - state.lastTimeMs) / 1000);
    const velNew = delta / dt;
    state.velocityRadS = state.velocityRadS + (velNew - state.velocityRadS) * 0.35;
    
    state.detentIndexNearest = nearestDetentIndex(state.angleRaw);
    state.angleDisplay = applyMagnet(state.angleRaw, state.velocityRadS);
    
    const currentSeconds = angleToSeconds(state.angleRaw, maxSeconds);
    const currentMinute = Math.floor(currentSeconds / 60);
    const minuteCrossed = currentMinute !== state.lastMinuteCrossed && state.lastMinuteCrossed !== -1;
    
    if (minuteCrossed) {
      state.lastMinuteCrossed = currentMinute;
    } else if (state.lastMinuteCrossed === -1) {
      state.lastMinuteCrossed = currentMinute;
    }
    
    state.lastPointerAngle = angle;
    state.lastTimeMs = now;
    
    return minuteCrossed;
  }

  function snapOnRelease(state, maxSeconds) {
    const snappedAngle = snapToDetent(state.angleRaw);
    const snappedIndex = nearestDetentIndex(state.angleRaw);
    
    const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds);
    const snappedMinute = Math.floor(snappedSeconds / 60);
    const shouldPlaySound = snappedMinute > state.lastMinuteCrossed;
    
    state.angleTarget = snappedAngle;
    state.detentIndexCommitted = snappedIndex;
    state.detentIndexNearest = snappedIndex;
    state.lastMinuteCrossed = snappedMinute;
    
    state.inSettleAnimation = true;
    state.settleStartTime = performance.now();
    
    const angleDelta = snappedAngle - state.angleRaw;
    let normalizedDelta = angleDelta;
    if (normalizedDelta > Math.PI) normalizedDelta -= 2 * Math.PI;
    if (normalizedDelta < -Math.PI) normalizedDelta += 2 * Math.PI;
    
    const sign = Math.sign(normalizedDelta) || 1;
    state.settleFrom = snappedAngle + sign * OVERSHOOT_RAD;
    state.settleTo = snappedAngle;
    
    return { angle: snappedAngle, shouldPlaySound };
  }

  function updateSettle(state) {
    if (!state.inSettleAnimation) return false;
    
    const now = performance.now();
    const elapsed = now - state.settleStartTime;
    const p = elapsed / SETTLE_MS;
    
    if (p >= 1) {
      state.angleDisplay = state.settleTo;
      state.angleRaw = state.settleTo;
      state.inSettleAnimation = false;
      return false;
    }
    
    state.angleDisplay = state.settleFrom + (state.settleTo - state.settleFrom) * easeOutQuart(p);
    return true;
  }

  function endDrag(state) {
    state.isDragging = false;
  }

  function angleToSeconds(angle, maxSeconds) {
    // Normalize angle to [0, 2π) first
    const normalizedAngle = normalizeAngle(angle);
    const fraction = normalizedAngle / (2 * Math.PI);
    // Clamp result to prevent negative or out-of-range values
    return clamp(Math.round(fraction * maxSeconds), 0, maxSeconds);
  }

  function secondsToAngle(seconds, maxSeconds) {
    if (maxSeconds === 0) return 0;
    const fraction = seconds / maxSeconds;
    return normalizeAngle(fraction * 2 * Math.PI);
  }

  function snapToDetent(angle) {
    const idx = nearestDetentIndex(angle);
    return idx * STEP_RAD;
  }

  // ============================================================================
  // Sound Effects (Web Audio API)
  // ============================================================================

  let audioCtx = null;
  let tickBuffer = null;
  let tickBufferLoading = null;
  const MIN_TICK_INTERVAL_MS = 60;
  let lastTickTime = 0;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function loadTickBuffer() {
    if (tickBuffer) return Promise.resolve(tickBuffer);
    if (tickBufferLoading) return tickBufferLoading;

    tickBufferLoading = (function() {
      try {
        // Use relative path only - prevent path traversal attacks
        var tickUrl = 'clock_tick_extracted.wav';
        
        // Validate URL is safe (relative path only)
        if (tickUrl.includes('..') || tickUrl.includes('://') || tickUrl.startsWith('/')) {
          throw new Error('Invalid audio file path');
        }
        
        return fetch(tickUrl, {
          method: 'GET',
          credentials: 'same-origin'
        })
          .then(function(response) {
            if (!response.ok) {
              throw new Error('Failed to load tick sound');
            }
            // Limit response size to prevent memory exhaustion (max 1MB)
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
              throw new Error('Audio file too large');
            }
            return response.arrayBuffer();
          })
          .then(function(arrayBuffer) {
            // Validate array buffer size
            if (arrayBuffer.byteLength > 1024 * 1024) {
              throw new Error('Audio buffer too large');
            }
            return getAudioContext().decodeAudioData(arrayBuffer);
          })
          .then(function(buffer) {
            tickBuffer = buffer;
            tickBufferLoading = null;
            return buffer;
          })
          .catch(function(error) {
            tickBufferLoading = null;
            logger.warn('Failed to load tick sound, using synthesized sound:', error);
            return null;
          });
      } catch (error) {
        tickBufferLoading = null;
        logger.warn('Failed to load tick sound, using synthesized sound:', error);
        return Promise.resolve(null);
      }
    })();

    return tickBufferLoading;
  }

  function getTickBuffer() {
    return tickBuffer;
  }

  function playTickSound() {
    var buffer = getTickBuffer();
    if (!buffer) {
      // Fallback to synthesized sound if buffer not loaded
      var c = getAudioContext();
      if (!c) return;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.01);
      gain.gain.setValueAtTime(0.1, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.05);
      return;
    }

    var c = getAudioContext();
    if (!c) return;
    var source = c.createBufferSource();
    source.buffer = buffer;
    
    // Well-oiled ratchet = very soft and subtle (reduced to ~30% of original)
    var gain = c.createGain();
    gain.gain.value = 0.3;
    gain.connect(c.destination);
    
    // No fades, no reverb, no tail - instant start/stop
    source.connect(gain);
    source.start(0);
  }

  function playSetTick() {
    var now = performance.now();
    
    // Rate limiting - ensure minimum interval between ticks
    if (now - lastTickTime < MIN_TICK_INTERVAL_MS) {
      return;
    }
    
    lastTickTime = now;
    
    // Load buffer if not already loaded (non-blocking)
    var buffer = getTickBuffer();
    if (!buffer) {
      loadTickBuffer()
        .then(function() {
          // Buffer loaded, play it now
          playTickSound();
        })
        .catch(function() {
          // Silently fail if loading fails
        });
      return;
    }

    playTickSound();
  }

  function playDoneChime() {
    const c = getAudioContext();
    if (!c) return;

    function playSingleChime(startTime) {
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);
      gain.connect(c.destination);

      const osc1 = c.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(660, startTime);
      osc1.frequency.exponentialRampToValueAtTime(880, startTime + 0.18);
      osc1.connect(gain);

      const osc2 = c.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, startTime + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(660, startTime + 0.32);
      osc2.connect(gain);

      osc1.start(startTime);
      osc2.start(startTime + 0.12);
      osc1.stop(startTime + 0.55);
      osc2.stop(startTime + 0.85);
    }

    const now = c.currentTime;
    playSingleChime(now);
    playSingleChime(now + 1.0);
    playSingleChime(now + 2.0);
  }

  // ============================================================================
  // Clock Component
  // ============================================================================

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const COLORS = {
    CASE: '#FF6347', // Tomato red/orange (default theme, matches Electron app)
    FACE: '#FFFFFF',
    SECTOR: '#CC4F38',
    TICKS: '#000000',
    KNOB: '#FF7055',
    TEXT: '#333333',
    INVERT: 'rgba(255,255,255,0.92)'
  };

  function createPomodoroClock(options) {
    const { host, maxSeconds, getSeconds, setSeconds, start, pause, canEdit, onMinuteStep, enableSounds } = options;

    host.replaceChildren();

    const shell = document.createElement('div');
    shell.className = 'timer-shell';

    const content = document.createElement('div');
    content.className = 'timer-content';

    const clockStack = document.createElement('div');
    clockStack.className = 'timer-clock-stack';

    let currentColor = {
      case: COLORS.CASE,
      knob: COLORS.KNOB,
      sector: COLORS.SECTOR
    };

    const clockCase = document.createElement('div');
    clockCase.className = 'timer-clock-case';
    clockCase.style.background = currentColor.case;

    const clockFace = document.createElement('div');
    clockFace.className = 'timer-clock-face';

    const interactive = document.createElement('div');
    interactive.className = 'timer-clock-interactive';
    interactive.setAttribute('role', 'application');

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';

    const defs = document.createElementNS(SVG_NS, 'defs');

    const sectorClip = document.createElementNS(SVG_NS, 'clipPath');
    sectorClip.setAttribute('id', 'sectorClip');
    const sectorClipPath = document.createElementNS(SVG_NS, 'path');
    sectorClip.appendChild(sectorClipPath);
    defs.appendChild(sectorClip);

    const handGlowFilter = document.createElementNS(SVG_NS, 'filter');
    handGlowFilter.setAttribute('id', 'handGlow');
    handGlowFilter.setAttribute('x', '-50%');
    handGlowFilter.setAttribute('y', '-50%');
    handGlowFilter.setAttribute('width', '200%');
    handGlowFilter.setAttribute('height', '200%');

    const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '0.9');
    handGlowFilter.appendChild(blur);
    defs.appendChild(handGlowFilter);

    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', 'knobGradient');
    grad.setAttribute('cx', '50%');
    grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
    grad.setAttribute('fx', '25%');
    grad.setAttribute('fy', '25%');

    const stop1 = document.createElementNS(SVG_NS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', 'white');
    stop1.setAttribute('stop-opacity', '0.3');

    const stop2 = document.createElementNS(SVG_NS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', 'black');
    stop2.setAttribute('stop-opacity', '0.1');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);

    const sector = document.createElementNS(SVG_NS, 'path');
    sector.setAttribute('fill', currentColor.sector);

    const handGlow = document.createElementNS(SVG_NS, 'line');
    handGlow.setAttribute('x1', '50');
    handGlow.setAttribute('y1', '50');
    handGlow.setAttribute('x2', '50');
    handGlow.setAttribute('y2', '22');
    handGlow.setAttribute('stroke', 'rgba(255,255,255,0.22)');
    handGlow.setAttribute('stroke-width', '4.2');
    handGlow.setAttribute('stroke-linecap', 'round');
    handGlow.setAttribute('filter', 'url(#handGlow)');
    handGlow.setAttribute('opacity', '0');

    const handBase = document.createElementNS(SVG_NS, 'line');
    handBase.setAttribute('x1', '50');
    handBase.setAttribute('y1', '50');
    handBase.setAttribute('x2', '50');
    handBase.setAttribute('y2', '22');
    handBase.setAttribute('stroke', 'rgba(0,0,0,0.42)');
    handBase.setAttribute('stroke-width', '1.35');
    handBase.setAttribute('stroke-linecap', 'round');
    handBase.setAttribute('opacity', '0');

    const handHighlight = document.createElementNS(SVG_NS, 'line');
    handHighlight.setAttribute('x1', '50');
    handHighlight.setAttribute('y1', '50');
    handHighlight.setAttribute('x2', '50');
    handHighlight.setAttribute('y2', '22');
    handHighlight.setAttribute('stroke', 'rgba(255,255,255,0.28)');
    handHighlight.setAttribute('stroke-width', '0.7');
    handHighlight.setAttribute('stroke-linecap', 'round');
    handHighlight.setAttribute('opacity', '0');

    const ticksGroup = document.createElementNS(SVG_NS, 'g');
    const numbersGroup = document.createElementNS(SVG_NS, 'g');

    const ticksInverted = document.createElementNS(SVG_NS, 'g');
    const numbersInverted = document.createElementNS(SVG_NS, 'g');
    const invertedGroup = document.createElementNS(SVG_NS, 'g');
    invertedGroup.setAttribute('clip-path', 'url(#sectorClip)');
    invertedGroup.appendChild(ticksInverted);
    invertedGroup.appendChild(numbersInverted);

    for (let i = 0; i < 60; i += 1) {
      const isMajor = i % 5 === 0;
      const tickAngle = (i / 60) * 2 * Math.PI;
      const innerR = isMajor ? 37 : 41;
      const outerR = 44;

      const x1 = 50 + innerR * Math.sin(tickAngle);
      const y1 = 50 - innerR * Math.cos(tickAngle);
      const x2 = 50 + outerR * Math.sin(tickAngle);
      const y2 = 50 - outerR * Math.cos(tickAngle);

      const tick = document.createElementNS(SVG_NS, 'line');
      tick.setAttribute('x1', x1.toFixed(3));
      tick.setAttribute('y1', y1.toFixed(3));
      tick.setAttribute('x2', x2.toFixed(3));
      tick.setAttribute('y2', y2.toFixed(3));
      tick.setAttribute('stroke', COLORS.TICKS);
      tick.setAttribute('stroke-width', isMajor ? '0.8' : '0.4');
      tick.setAttribute('stroke-linecap', 'round');
      ticksGroup.appendChild(tick);

      const tickInv = document.createElementNS(SVG_NS, 'line');
      tickInv.setAttribute('x1', x1.toFixed(3));
      tickInv.setAttribute('y1', y1.toFixed(3));
      tickInv.setAttribute('x2', x2.toFixed(3));
      tickInv.setAttribute('y2', y2.toFixed(3));
      tickInv.setAttribute('stroke', COLORS.INVERT);
      tickInv.setAttribute('stroke-width', isMajor ? '0.8' : '0.4');
      tickInv.setAttribute('stroke-linecap', 'round');
      ticksInverted.appendChild(tickInv);
    }

    for (let i = 0; i < 60; i += 5) {
      const numAngle = (i / 60) * 2 * Math.PI;
      const textRadius = 31;
      const x = 50 + textRadius * Math.sin(numAngle);
      const y = 50 - textRadius * Math.cos(numAngle);

      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', x.toFixed(3));
      label.setAttribute('y', y.toFixed(3));
      label.setAttribute('fill', COLORS.TEXT);
      label.setAttribute('font-size', '5');
      label.setAttribute('font-weight', '700');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'central');
      label.setAttribute('style', "font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial");
      label.textContent = String(i);
      numbersGroup.appendChild(label);

      const labelInv = document.createElementNS(SVG_NS, 'text');
      labelInv.setAttribute('x', x.toFixed(3));
      labelInv.setAttribute('y', y.toFixed(3));
      labelInv.setAttribute('fill', COLORS.INVERT);
      labelInv.setAttribute('font-size', '5');
      labelInv.setAttribute('font-weight', '700');
      labelInv.setAttribute('text-anchor', 'middle');
      labelInv.setAttribute('dominant-baseline', 'central');
      labelInv.setAttribute('style', "font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial");
      labelInv.textContent = String(i);
      numbersInverted.appendChild(labelInv);
    }

    const knobShadow = document.createElementNS(SVG_NS, 'circle');
    knobShadow.setAttribute('cx', '50');
    knobShadow.setAttribute('cy', '50');
    knobShadow.setAttribute('r', '6.5');
    knobShadow.setAttribute('fill', 'black');
    knobShadow.setAttribute('opacity', '0.1');

    const knobBase = document.createElementNS(SVG_NS, 'circle');
    knobBase.setAttribute('cx', '50');
    knobBase.setAttribute('cy', '50');
    knobBase.setAttribute('r', '6');
    knobBase.setAttribute('fill', currentColor.knob);
    knobBase.setAttribute('data-knob-base', 'true');

    const knobHighlight = document.createElementNS(SVG_NS, 'circle');
    knobHighlight.setAttribute('cx', '50');
    knobHighlight.setAttribute('cy', '50');
    knobHighlight.setAttribute('r', '6');
    knobHighlight.setAttribute('fill', 'url(#knobGradient)');
    knobHighlight.setAttribute('data-knob-highlight', 'true');

    svg.appendChild(defs);
    svg.appendChild(sector);
    svg.appendChild(ticksGroup);
    svg.appendChild(numbersGroup);
    svg.appendChild(invertedGroup);
    svg.appendChild(handGlow);
    svg.appendChild(handBase);
    svg.appendChild(handHighlight);
    svg.appendChild(knobShadow);
    svg.appendChild(knobBase);
    svg.appendChild(knobHighlight);

    interactive.appendChild(svg);
    clockFace.appendChild(interactive);
    clockCase.appendChild(clockFace);

    const display = document.createElement('div');
    display.className = 'timer-display';

    const timeEl = document.createElement('div');
    timeEl.className = 'timer-time';

    const quick = document.createElement('div');
    quick.className = 'timer-quick';

    const quickMins = [5, 10, 25, 50];
    const quickButtons = [];
    for (const min of quickMins) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'timer-quick-btn';
      btn.textContent = min + 'm';
      btn.addEventListener('click', () => {
        pause();
        setSeconds(min * 60);
        update(getSeconds());
        start();
      });
      quickButtons.push(btn);
      quick.appendChild(btn);
    }

    display.appendChild(timeEl);
    display.appendChild(quick);

    clockStack.appendChild(clockCase);
    clockStack.appendChild(display);

    content.appendChild(clockStack);
    shell.appendChild(content);
    host.appendChild(shell);

    const center = 50;
    const sectorRadius = 45;

    function updateSector(seconds) {
      const t = clamp(seconds, 0, maxSeconds);
      const timeFraction = maxSeconds === 0 ? 0 : t / maxSeconds;
      let angle = timeFraction * 2 * Math.PI;
      
      // Special case: when at maxSeconds, always show full circle
      // Don't snap to detent as it might wrap 2π to 0
      if (t >= maxSeconds) {
        const path = `M ${center} ${center - sectorRadius} A ${sectorRadius} ${sectorRadius} 0 1 1 ${center} ${center + sectorRadius} A ${sectorRadius} ${sectorRadius} 0 1 1 ${center} ${center - sectorRadius} Z`;
        sector.setAttribute('d', path);
        sectorClipPath.setAttribute('d', path);
        handGlow.setAttribute('opacity', '0');
        handBase.setAttribute('opacity', '0');
        handHighlight.setAttribute('opacity', '0');
        return;
      }
      
      if (dragging || clockworkState.inSettleAnimation) {
        angle = clockworkState.angleDisplay;
      } else {
        angle = snapToDetent(angle);
      }
      
      const endX = center + sectorRadius * Math.sin(angle);
      const endY = center - sectorRadius * Math.cos(angle);
      const largeArcFlag = angle > Math.PI ? 1 : 0;

      let path = '';
      if (t <= 0) {
        path = '';
      } else {
        path = `M ${center} ${center} L ${center} ${center - sectorRadius} A ${sectorRadius} ${sectorRadius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
      }

      sector.setAttribute('d', path);
      sectorClipPath.setAttribute('d', path);

      const showHand = t <= 0;
      handGlow.setAttribute('opacity', showHand ? '1' : '0');
      handBase.setAttribute('opacity', showHand ? '1' : '0');
      handHighlight.setAttribute('opacity', showHand ? '1' : '0');
    }

    function update(seconds) {
      // Clamp seconds to valid range to prevent hand from appearing incorrectly
      const clampedSeconds = clamp(seconds, 0, maxSeconds);
      timeEl.textContent = formatTimerTime(clampedSeconds);
      
      if (!dragging) {
        const angle = secondsToAngle(clampedSeconds, maxSeconds);
        clockworkState.angleRaw = angle;
        clockworkState.angleDisplay = snapToDetent(angle);
        clockworkState.detentIndexCommitted = Math.floor(angle / ((2 * Math.PI) / 60) + 0.5);
        clockworkState.detentIndexNearest = Math.round(angle / ((2 * Math.PI) / 60));
      }
      
      updateSector(clampedSeconds);
    }

    let dragging = false;
    let lastMinute = -1;
    let rafId = null;
    
    const clockworkState = createClockworkState();
    
    function animateSettle() {
      if (updateSettle(clockworkState)) {
        const seconds = angleToSeconds(clockworkState.angleDisplay, maxSeconds);
        const clampedSeconds = clamp(seconds, 0, maxSeconds);
        setSeconds(clampedSeconds);
        timeEl.textContent = formatTimerTime(clampedSeconds);
        updateSector(clampedSeconds);
        rafId = requestAnimationFrame(animateSettle);
      } else {
        rafId = null;
        const finalSeconds = angleToSeconds(clockworkState.angleDisplay, maxSeconds);
        const clampedSeconds = clamp(finalSeconds, 0, maxSeconds);
        setSeconds(clampedSeconds);
        update(clampedSeconds);
      }
    }

    function getCenter(rect) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }

    function isCenterPress(ev) {
      const rect = interactive.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const x = ev.clientX - rect.left - cx;
      const y = ev.clientY - rect.top - cy;
      const dist = Math.hypot(x, y);
      const hitRadius = Math.min(rect.width, rect.height) * 0.12;
      return dist <= hitRadius;
    }

    function isCenterHover(ev) {
      const rect = interactive.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const x = ev.clientX - rect.left - cx;
      const y = ev.clientY - rect.top - cy;
      const dist = Math.hypot(x, y);
      const hitRadius = Math.min(rect.width, rect.height) * 0.12;
      return dist <= hitRadius;
    }

    function isHandHover(ev) {
      const currentSeconds = getSeconds();
      if (currentSeconds > 0) return false;

      const rect = interactive.getBoundingClientRect();
      const svgX = ((ev.clientX - rect.left) / rect.width) * 100;
      const svgY = ((ev.clientY - rect.top) / rect.height) * 100;
      
      const handStartX = 50;
      const handStartY = 50;
      const handEndX = 50;
      const handEndY = 22;
      
      const A = svgX - handStartX;
      const B = svgY - handStartY;
      const C = handEndX - handStartX;
      const D = handEndY - handStartY;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = handStartX;
        yy = handStartY;
      } else if (param > 1) {
        xx = handEndX;
        yy = handEndY;
      } else {
        xx = handStartX + param * C;
        yy = handStartY + param * D;
      }
      
      const dx = svgX - xx;
      const dy = svgY - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = 2.5;
      return distance <= hitRadius && param >= 0 && param <= 1;
    }

    function applyPointer(ev) {
      const rect = interactive.getBoundingClientRect();
      const center = getCenter(rect);
      
      const minuteCrossed = updateDrag(
        clockworkState,
        ev.clientX,
        ev.clientY,
        center.x,
        center.y,
        maxSeconds
      );
      
      if (minuteCrossed && enableSounds) {
        playSetTick();
        const currentSeconds = angleToSeconds(clockworkState.angleDisplay, maxSeconds);
        const currentMinute = Math.floor(currentSeconds / 60);
        if (currentMinute !== lastMinute) {
          if (onMinuteStep) onMinuteStep(currentMinute);
          lastMinute = currentMinute;
        }
      }
      
      const seconds = angleToSeconds(clockworkState.angleDisplay, maxSeconds);
      const clampedSeconds = clamp(seconds, 0, maxSeconds);
      
      const minute = Math.floor(clampedSeconds / 60);
      if (minute !== lastMinute) {
        lastMinute = minute;
      }
      
      setSeconds(clampedSeconds);
      update(clampedSeconds);
    }

    function onPointerDown(ev) {
      ev.preventDefault();

      // Center press always works (even when timer is running) - pause and reset
      if (isCenterPress(ev)) {
        interactive.classList.add('knob-active');
        pause();
        setSeconds(0);
        update(0);
        clockworkState.angleRaw = 0;
        clockworkState.angleDisplay = 0;
        clockworkState.inSettleAnimation = false;
        clockworkState.isDragging = false;
        setTimeout(() => {
          interactive.classList.remove('knob-active');
        }, 150);
        return;
      }

      // Allow dragging even when timer is running (user can adjust time while running)
      // Only pause the timer when drag starts, don't prevent dragging
      if (canEdit && !canEdit()) {
        // If timer is running, pause it when user starts dragging
        pause();
      }

      interactive.classList.remove('knob-hover', 'knob-active', 'hand-hover');
      
      const rect = interactive.getBoundingClientRect();
      const center = getCenter(rect);
      const currentAngle = secondsToAngle(getSeconds(), maxSeconds);
      
      if (!startDrag(clockworkState, ev.clientX, ev.clientY, center.x, center.y, currentAngle, maxSeconds)) {
        return;
      }
      
      dragging = true;
      interactive.classList.add('dragging');
      pause();
      interactive.setPointerCapture(ev.pointerId);
      applyPointer(ev);
    }

    function onPointerMove(ev) {
      if (!dragging) return;
      ev.preventDefault();
      applyPointer(ev);
    }

    function onPointerUp(ev) {
      interactive.classList.remove('knob-active', 'dragging');
      if (!dragging) return;
      
      const { shouldPlaySound } = snapOnRelease(clockworkState, maxSeconds);
      
      if (shouldPlaySound && enableSounds) {
        playSetTick();
      }
      
      if (rafId === null) {
        rafId = requestAnimationFrame(animateSettle);
      }
      
      endDrag(clockworkState);
      dragging = false;
      lastMinute = -1;

      try {
        interactive.releasePointerCapture(ev.pointerId);
      } catch (e) {
        // ignore
      }

      const checkSettle = () => {
        if (!clockworkState.inSettleAnimation) {
          const seconds = getSeconds();
          if (seconds > 0) start();
          else pause();
          rafId = null;
        } else {
          rafId = requestAnimationFrame(checkSettle);
        }
      };
      rafId = requestAnimationFrame(checkSettle);
    }

    function onMouseMove(ev) {
      // Always allow hover feedback, even when timer is running
      if (isCenterHover(ev)) {
        interactive.classList.add('knob-hover');
        interactive.classList.remove('hand-hover');
      } else {
        interactive.classList.remove('knob-hover');
      }
      
      if (!interactive.classList.contains('knob-hover')) {
        if (isHandHover(ev)) {
          interactive.classList.add('hand-hover');
        } else {
          interactive.classList.remove('hand-hover');
        }
      }
    }

    function onMouseLeave() {
      interactive.classList.remove('knob-hover', 'knob-active', 'hand-hover');
    }

    interactive.addEventListener('pointerdown', onPointerDown);
    interactive.addEventListener('pointermove', onPointerMove);
    interactive.addEventListener('pointerup', onPointerUp);
    interactive.addEventListener('pointercancel', onPointerUp);
    interactive.addEventListener('mousemove', onMouseMove);
    interactive.addEventListener('mouseleave', onMouseLeave);

    update(getSeconds());

    // Cleanup function to prevent memory leaks
    function cleanup() {
      // Remove event listeners
      interactive.removeEventListener('pointerdown', onPointerDown);
      interactive.removeEventListener('pointermove', onPointerMove);
      interactive.removeEventListener('pointerup', onPointerUp);
      interactive.removeEventListener('pointercancel', onPointerUp);
      interactive.removeEventListener('mousemove', onMouseMove);
      interactive.removeEventListener('mouseleave', onMouseLeave);
      
      // Cancel any pending animation frames
      if (rafId !== null && rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      // End any active drag
      if (dragging) {
        endDrag(clockworkState);
        dragging = false;
      }
      
      // Pause timer
      pause();
    }

    return {
      update,
      cleanup: cleanup,
      setInteractive: function(next) {
        interactive.style.pointerEvents = next ? 'auto' : 'none';
        interactive.style.opacity = next ? '1' : '0.98';
        for (const btn of quickButtons) btn.disabled = !next;
      }
    };
  }

  // ============================================================================
  // Public API
  // ============================================================================

  // Store cleanup functions for multiple timer instances
  const timerInstances = new WeakMap();

  window.initTimer = function(container, options) {
    // Validate container
    if (!container || !(container instanceof HTMLElement)) {
      logger.error('initTimer: container must be a valid HTMLElement');
      return null;
    }
    
    // Cleanup existing timer if present
    const existingCleanup = timerInstances.get(container);
    if (existingCleanup && typeof existingCleanup === 'function') {
      existingCleanup();
    }
    
    // Validate and sanitize options
    options = options || {};
    
    // Clamp maxSeconds to reasonable range (1 minute to 24 hours)
    const maxSeconds = Math.max(60, Math.min(86400, parseInt(options.maxSeconds, 10) || 3600));
    
    // Clamp initialSeconds to valid range
    const initialSeconds = Math.max(0, Math.min(maxSeconds, parseInt(options.initialSeconds, 10) || 0));
    
    // Boolean options with defaults
    const enableSounds = options.enableSounds !== false;
    const showPresets = options.showPresets !== false;
    const showDigital = options.showDigital !== false;

    const timer = createTimerEngine({
      initialSeconds,
      onTick: function(payload) {
        clock.update(payload.remainingSeconds);
      },
      onDone: function() {
        if (enableSounds) {
          playDoneChime();
        }
        // Browser notification (secure, same-origin icon only)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Timer complete', {
              body: 'Nice work. Take a breath.',
              icon: 'icon.png', // Same-origin only
              badge: 'icon.png',
              tag: 'realpomo-timer',
              requireInteraction: false
            });
          } catch (e) {
            logger.warn('Failed to show notification:', e);
          }
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
              try {
                new Notification('Timer complete', {
                  body: 'Nice work. Take a breath.',
                  icon: 'icon.png', // Same-origin only
                  badge: 'icon.png',
                  tag: 'realpomo-timer',
                  requireInteraction: false
                });
              } catch (e) {
                logger.warn('Failed to show notification:', e);
              }
            }
          }).catch(function(e) {
            logger.warn('Failed to request notification permission:', e);
          });
        }
      }
    });

    const clock = createPomodoroClock({
      host: container,
      maxSeconds: maxSeconds,
      getSeconds: function() { return timer.getRemainingSeconds(); },
      setSeconds: function(seconds) { timer.setRemainingSeconds(seconds); },
      start: function() { timer.start(); },
      pause: function() { timer.pause(); },
      canEdit: function() { return true; }, // Always allow editing (can drag even when running)
      onMinuteStep: function(minute) {
        // Optional callback
      },
      enableSounds: enableSounds
    });

    // Store cleanup function
    const cleanup = function() {
      if (timer && typeof timer.pause === 'function') {
        timer.pause();
      }
      if (timer && typeof timer.cleanup === 'function') {
        timer.cleanup();
      }
      if (clock && typeof clock.cleanup === 'function') {
        clock.cleanup();
      }
    };
    timerInstances.set(container, cleanup);

    // Request notification permission on first interaction
    if ('Notification' in window && Notification.permission === 'default') {
      // Request permission on first user interaction
      const requestPermission = function() {
        Notification.requestPermission();
        document.removeEventListener('click', requestPermission);
        document.removeEventListener('touchstart', requestPermission);
      };
      document.addEventListener('click', requestPermission, { once: true });
      document.addEventListener('touchstart', requestPermission, { once: true });
    }
    
    // Return cleanup function for external use
    return cleanup;
  };
  
  // Expose cleanup function globally
  window.cleanupTimer = function(container) {
    const cleanup = timerInstances.get(container);
    if (cleanup && typeof cleanup === 'function') {
      cleanup();
      timerInstances.delete(container);
    }
  };

})();

