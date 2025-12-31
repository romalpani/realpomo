/**
 * Detented "Clockwork" Dial Interaction
 * 
 * Implements gear-like interaction with detents, progressive resistance,
 * velocity-sensitive behavior, and micro-settle animation.
 */

import { clamp } from './math'

// Tunable parameters
const STEPS = 60 // Detents per full revolution
const STEP_RAD = (2 * Math.PI) / STEPS
const DETENT_ZONE_FRAC = 0.20 // Last 20% of each step gets magnet pull
const MAX_MAGNET_STRENGTH = 0.55 // 0..1
const FAST_VEL = 8.0 // rad/s - considered "fast spin"
const SETTLE_MS = 180 // Settle animation duration - smoother and slower
const OVERSHOOT_RAD = 0.003 // ~0.17° subtle overshoot on snap
const DRAG_DEADZONE_PX = 2 // Pixels before rotation starts

// Utility functions
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function smoothstep(t: number): number {
  const clamped = clamp01(t)
  return clamped * clamped * (3 - 2 * clamped)
}

function easeOutCubic(p: number): number {
  const clamped = clamp01(p)
  return 1 - Math.pow(1 - clamped, 3)
}

function easeOutQuart(p: number): number {
  const clamped = clamp01(p)
  return 1 - Math.pow(1 - clamped, 4)
}

function normalizeAngle(angle: number): number {
  // Normalize to [0, 2π)
  while (angle < 0) angle += 2 * Math.PI
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI
  return angle
}

function unwrapAngleDelta(current: number, last: number): number {
  // Handle angle wrapping for continuous rotation
  let delta = current - last
  if (delta > Math.PI) delta -= 2 * Math.PI
  if (delta < -Math.PI) delta += 2 * Math.PI
  return delta
}

export type ClockworkState = {
  angleRaw: number // Continuous angle from pointer
  angleDisplay: number // What to render (after magnet + settle)
  angleTarget: number // Detent angle we snap to
  detentIndexCommitted: number // Committed tooth index
  detentIndexNearest: number // Nearest detent to raw angle
  velocityRadS: number // Angular velocity (rad/sec)
  isDragging: boolean
  inSettleAnimation: boolean
  lastPointerAngle: number
  lastTimeMs: number
  settleStartTime: number
  settleFrom: number
  settleTo: number
  dragStartDistance: number
  lastMinuteCrossed: number // Last minute index that was crossed during drag
}

export function createClockworkState(): ClockworkState {
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
  }
}

/**
 * Convert pointer position to angle in radians
 * Returns angle in [0, 2π) where 0 is at top (12 o'clock)
 */
export function pointerToAngle(
  pointerX: number,
  pointerY: number,
  centerX: number,
  centerY: number
): number {
  const dx = pointerX - centerX
  const dy = pointerY - centerY
  const angle = Math.atan2(dx, -dy) // -dy because y increases downward
  return normalizeAngle(angle)
}

/**
 * Get nearest detent index
 */
function nearestDetentIndex(angle: number): number {
  return Math.round(angle / STEP_RAD)
}

/**
 * Get committed detent index (midpoint rule)
 */
function committedDetentIndex(angle: number): number {
  return Math.floor(angle / STEP_RAD + 0.5)
}

/**
 * Apply magnet pull toward nearest detent (only in detent zone)
 */
function applyMagnet(angle: number, velocityRadS: number): number {
  const idxN = nearestDetentIndex(angle)
  const detentAngle = idxN * STEP_RAD
  const delta = angle - detentAngle
  
  // Normalize delta to [-π, π] range
  let normalizedDelta = delta
  if (normalizedDelta > Math.PI) normalizedDelta -= 2 * Math.PI
  if (normalizedDelta < -Math.PI) normalizedDelta += 2 * Math.PI
  
  const dist = Math.abs(normalizedDelta)
  const zone = DETENT_ZONE_FRAC * STEP_RAD

  // Velocity-sensitive strength
  const v = clamp01(Math.abs(velocityRadS) / FAST_VEL)
  const strength = MAX_MAGNET_STRENGTH * (1 - v)

  if (dist < zone) {
    const t = 1 - (dist / zone) // 0 at zone edge, 1 at detent
    const pull = smoothstep(t) * strength
    return angle - normalizedDelta * pull
  }
  
  return angle
}

/**
 * Initialize drag - check deadzone and set initial state
 */
export function startDrag(
  state: ClockworkState,
  pointerX: number,
  pointerY: number,
  centerX: number,
  centerY: number,
  currentAngle: number,
  maxSeconds: number
): boolean {
  const dx = pointerX - centerX
  const dy = pointerY - centerY
  const dist = Math.hypot(dx, dy)
  
  // Check deadzone
  if (dist < DRAG_DEADZONE_PX) {
    return false
  }
  
  state.isDragging = true
  state.inSettleAnimation = false
  state.dragStartDistance = dist
  
  const angle = pointerToAngle(pointerX, pointerY, centerX, centerY)
  state.angleRaw = angle
  state.angleDisplay = angle
  state.lastPointerAngle = angle
  state.lastTimeMs = performance.now()
  state.velocityRadS = 0
  
  // Initialize committed index from current angle
  state.detentIndexCommitted = committedDetentIndex(currentAngle)
  
  // Initialize last minute crossed from current position
  const currentSeconds = angleToSeconds(currentAngle, maxSeconds)
  state.lastMinuteCrossed = Math.floor(currentSeconds / 60)
  
  return true
}

/**
 * Update during drag - tracks raw angle and applies magnet pull
 * Returns true if a minute marker was crossed (for sound)
 */
export function updateDrag(
  state: ClockworkState,
  pointerX: number,
  pointerY: number,
  centerX: number,
  centerY: number,
  maxSeconds: number
): boolean {
  if (!state.isDragging) return false
  
  const now = performance.now()
  const angle = pointerToAngle(pointerX, pointerY, centerX, centerY)
  
  // Handle angle wrapping for continuous rotation
  const delta = unwrapAngleDelta(angle, state.lastPointerAngle)
  state.angleRaw = normalizeAngle(state.angleRaw + delta)
  
  // Update velocity (low-pass filtered)
  const dt = Math.max(0.001, (now - state.lastTimeMs) / 1000)
  const velNew = delta / dt
  state.velocityRadS = state.velocityRadS + (velNew - state.velocityRadS) * 0.35
  
  // Track nearest detent (for visual feedback) but don't commit yet
  state.detentIndexNearest = nearestDetentIndex(state.angleRaw)
  
  // Apply magnet pull during drag
  state.angleDisplay = applyMagnet(state.angleRaw, state.velocityRadS)
  
  // Check if we crossed a minute marker (every 60 seconds = 1 minute)
  // Since we have 60 detents and maxSeconds, each detent = maxSeconds/60 seconds
  // A minute marker is when the minute value changes
  const currentSeconds = angleToSeconds(state.angleRaw, maxSeconds)
  const currentMinute = Math.floor(currentSeconds / 60)
  const minuteCrossed = currentMinute !== state.lastMinuteCrossed && state.lastMinuteCrossed !== -1
  
  if (minuteCrossed) {
    state.lastMinuteCrossed = currentMinute
  } else if (state.lastMinuteCrossed === -1) {
    // Initialize on first drag update
    state.lastMinuteCrossed = currentMinute
  }
  
  state.lastPointerAngle = angle
  state.lastTimeMs = now
  
  return minuteCrossed
}

/**
 * Snap to nearest detent on release - smooth animation
 * Returns the snapped angle and whether sound should play
 */
export function snapOnRelease(
  state: ClockworkState,
  maxSeconds: number
): { angle: number; shouldPlaySound: boolean } {
  // Snap to nearest detent (not committed, but nearest to current position)
  const snappedAngle = snapToDetent(state.angleRaw)
  const snappedIndex = nearestDetentIndex(state.angleRaw)
  
  // Determine which minute we're snapping to
  const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
  const snappedMinute = Math.floor(snappedSeconds / 60)
  
  // Check if we're snapping forward to a minute we haven't crossed yet
  // or backward to a minute we already crossed
  const shouldPlaySound = snappedMinute > state.lastMinuteCrossed
  
  // Start smooth settle animation
  state.angleTarget = snappedAngle
  state.detentIndexCommitted = snappedIndex
  state.detentIndexNearest = snappedIndex
  state.lastMinuteCrossed = snappedMinute
  
  // Start settle animation from current display position
  state.inSettleAnimation = true
  state.settleStartTime = performance.now()
  state.settleFrom = state.angleDisplay
  state.settleTo = snappedAngle
  
  // Add subtle overshoot in the direction of movement
  const angleDelta = snappedAngle - state.angleRaw
  // Normalize delta to [-π, π]
  let normalizedDelta = angleDelta
  if (normalizedDelta > Math.PI) normalizedDelta -= 2 * Math.PI
  if (normalizedDelta < -Math.PI) normalizedDelta += 2 * Math.PI
  
  const sign = Math.sign(normalizedDelta) || 1
  state.settleFrom = snappedAngle + sign * OVERSHOOT_RAD
  state.settleTo = snappedAngle
  
  return { angle: snappedAngle, shouldPlaySound }
}

/**
 * Start settle animation after snap
 */
export function startSettle(state: ClockworkState): void {
  state.inSettleAnimation = true
  state.settleStartTime = performance.now()
  state.settleFrom = state.angleDisplay
  state.settleTo = state.angleTarget
  
  // Add overshoot
  const sign = Math.sign(state.velocityRadS) || 1
  state.settleFrom = state.angleTarget + sign * OVERSHOOT_RAD
  state.settleTo = state.angleTarget
}

/**
 * Update settle animation - returns true if still animating
 */
export function updateSettle(state: ClockworkState): boolean {
  if (!state.inSettleAnimation) return false
  
  const now = performance.now()
  const elapsed = now - state.settleStartTime
  const p = elapsed / SETTLE_MS
  
  if (p >= 1) {
    state.angleDisplay = state.settleTo
    state.angleRaw = state.settleTo // Sync raw angle too
    state.inSettleAnimation = false
    return false
  }
  
  // Use smoother easing (easeOutQuart) for more gradual deceleration
  state.angleDisplay = state.settleFrom + (state.settleTo - state.settleFrom) * easeOutQuart(p)
  return true
}

/**
 * End drag
 */
export function endDrag(state: ClockworkState): void {
  state.isDragging = false
  // Don't reset settle animation - let it complete
}

/**
 * Convert angle to seconds (0 to maxSeconds)
 */
export function angleToSeconds(angle: number, maxSeconds: number): number {
  const fraction = angle / (2 * Math.PI)
  return Math.round(fraction * maxSeconds)
}

/**
 * Convert seconds to angle
 */
export function secondsToAngle(seconds: number, maxSeconds: number): number {
  if (maxSeconds === 0) return 0
  const fraction = seconds / maxSeconds
  return normalizeAngle(fraction * 2 * Math.PI)
}

/**
 * Snap angle to nearest detent
 */
export function snapToDetent(angle: number): number {
  const idx = nearestDetentIndex(angle)
  return idx * STEP_RAD
}

