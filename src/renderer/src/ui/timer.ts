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

  function currentSeconds(): number {
    return Math.max(0, Math.round(remainingMs / 1000))
  }

  function emitTick(force = false): void {
    const seconds = currentSeconds()
    if (!force && lastEmittedSeconds === seconds) return
    lastEmittedSeconds = seconds
    options.onTick({ remainingSeconds: seconds })
  }

  function loop(ts: number): void {
    if (!running) return
    if (lastTs === 0) lastTs = ts
    const dt = ts - lastTs
    lastTs = ts
    remainingMs = Math.max(0, remainingMs - dt)
    emitTick()

    if (remainingMs <= 0) {
      running = false
      lastTs = 0
      options.onDone()
      return
    }
    rafId = scheduler.requestAnimationFrame(loop)
  }

  function start(): void {
    if (running) return
    running = true
    lastTs = 0
    rafId = scheduler.requestAnimationFrame(loop)
  }

  function pause(): void {
    if (!running) return
    running = false
    lastTs = 0
    if (rafId) scheduler.cancelAnimationFrame(rafId)
  }

  function reset(seconds: number): void {
    pause()
    remainingMs = Math.max(0, seconds) * 1000
    lastEmittedSeconds = null
    emitTick(true)
  }

  function setRemainingSeconds(seconds: number): void {
    remainingMs = Math.max(0, seconds) * 1000
    lastEmittedSeconds = null
    emitTick(true)
  }

  function getRemainingSeconds(): number {
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
