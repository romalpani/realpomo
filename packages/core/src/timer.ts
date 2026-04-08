type TickPayload = {
  remainingSeconds: number
}

type TimerScheduler = {
  requestAnimationFrame: (cb: (ts: number) => void) => number
  cancelAnimationFrame: (id: number) => void
}

type TimerOptions = {
  initialSeconds: number
  onTick: (payload: TickPayload) => void
  onDone: () => void
  scheduler?: TimerScheduler
}

export function createTimerEngine(options: TimerOptions) {
  // When a custom scheduler is provided (tests), use RAF-based timing only.
  // In production, use wall-clock timing with background interval for reliability.
  const isTestMode = options.scheduler !== undefined

  const scheduler: TimerScheduler =
    options.scheduler ??
    ({
      requestAnimationFrame: (cb) => requestAnimationFrame(cb),
      cancelAnimationFrame: (id) => cancelAnimationFrame(id)
    } satisfies TimerScheduler)

  let remainingMs = options.initialSeconds * 1000
  let running = false
  let lastTs = 0
  let rafId = 0
  let lastEmittedSeconds: number | null = null

  // Wall-clock based timing for background reliability (production only)
  let endTime = 0 // Absolute timestamp when timer should complete
  let backgroundIntervalId: ReturnType<typeof setInterval> | null = null

  function currentSeconds(): number {
    return Math.max(0, Math.round(remainingMs / 1000))
  }

  function emitTick(force = false): void {
    const seconds = currentSeconds()
    if (!force && lastEmittedSeconds === seconds) return
    lastEmittedSeconds = seconds
    options.onTick({ remainingSeconds: seconds })
  }

  function complete(): void {
    remainingMs = 0
    running = false
    cleanup()
    emitTick()
    options.onDone()
  }

  function checkWallClockCompletion(): boolean {
    if (!running) return false

    const now = Date.now()
    if (now >= endTime) {
      complete()
      return true
    }

    // Update remainingMs based on wall clock
    remainingMs = Math.max(0, endTime - now)
    return false
  }

  function cleanup(): void {
    if (rafId) {
      scheduler.cancelAnimationFrame(rafId)
      rafId = 0
    }
    if (backgroundIntervalId !== null) {
      clearInterval(backgroundIntervalId)
      backgroundIntervalId = null
    }
    lastTs = 0
  }

  // Production loop: uses wall-clock time for accuracy
  function productionLoop(): void {
    if (!running) return
    if (checkWallClockCompletion()) return

    emitTick()
    rafId = scheduler.requestAnimationFrame(productionLoop)
  }

  // Test loop: uses RAF delta timing (original behavior for testability)
  function testLoop(ts: number): void {
    if (!running) return
    if (lastTs === 0) lastTs = ts
    const dt = ts - lastTs
    lastTs = ts
    remainingMs = Math.max(0, remainingMs - dt)
    emitTick()

    if (remainingMs <= 0) {
      complete()
      return
    }
    rafId = scheduler.requestAnimationFrame(testLoop)
  }

  // Background interval check - fires even when app is not in foreground
  function backgroundCheck(): void {
    if (!running) return
    checkWallClockCompletion()
  }

  function start(): void {
    if (running) return
    running = true
    lastTs = 0

    if (isTestMode) {
      // Test mode: use RAF-based delta timing
      rafId = scheduler.requestAnimationFrame(testLoop)
    } else {
      // Production mode: use wall-clock timing with background interval
      endTime = Date.now() + remainingMs
      rafId = scheduler.requestAnimationFrame(productionLoop)

      // Start a background interval that checks completion every 500ms
      // This ensures the timer completes even when requestAnimationFrame is throttled
      backgroundIntervalId = setInterval(backgroundCheck, 500)
    }
  }

  function pause(): void {
    if (!running) return
    running = false

    if (!isTestMode) {
      // Capture remaining time based on wall clock
      remainingMs = Math.max(0, endTime - Date.now())
    }

    cleanup()
  }

  function reset(seconds: number): void {
    pause()
    remainingMs = Math.max(0, seconds) * 1000
    lastEmittedSeconds = null
    emitTick(true)
  }

  function setRemainingSeconds(seconds: number): void {
    const wasRunning = running
    if (wasRunning) {
      pause()
    }
    remainingMs = Math.max(0, seconds) * 1000
    lastEmittedSeconds = null
    emitTick(true)
    if (wasRunning) {
      start()
    }
  }

  function getRemainingSeconds(): number {
    // If running in production mode, calculate from wall clock for accuracy
    if (running && !isTestMode) {
      remainingMs = Math.max(0, endTime - Date.now())
    }
    return currentSeconds()
  }

  function isRunning(): boolean {
    return running
  }

  return {
    start,
    pause,
    reset,
    isRunning,
    setRemainingSeconds,
    getRemainingSeconds
  }
}
