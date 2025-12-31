let audioCtx: AudioContext | null = null
let tickBuffer: AudioBuffer | null = null
let tickBufferLoading: Promise<AudioBuffer> | null = null

// Rate limiting for tick sounds - prevent reverb from rapid ticks
const MIN_TICK_INTERVAL_MS = 60 // Minimum 60ms between ticks
let lastTickTime = 0

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

async function loadTickBuffer(): Promise<AudioBuffer> {
  if (tickBuffer) return tickBuffer
  if (tickBufferLoading) return tickBufferLoading

  tickBufferLoading = (async () => {
    try {
      // Import the WAV file - Vite will handle the asset path
      const tickUrl = new URL('../assets/clock_tick_extracted.wav', import.meta.url).href
      const response = await fetch(tickUrl)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await ctx().decodeAudioData(arrayBuffer)
      tickBuffer = buffer
      return buffer
    } catch (error) {
      console.error('Failed to load tick sound:', error)
      throw error
    } finally {
      tickBufferLoading = null
    }
  })()

  return tickBufferLoading
}

function getTickBuffer(): AudioBuffer | null {
  return tickBuffer
}

export function playDoneChime(): void {
  const c = ctx()
  const now = c.currentTime

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
  gain.connect(c.destination)

  const osc1 = c.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(660, now)
  osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18)
  osc1.connect(gain)

  const osc2 = c.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(440, now + 0.12)
  osc2.frequency.exponentialRampToValueAtTime(660, now + 0.32)
  osc2.connect(gain)

  osc1.start(now)
  osc2.start(now + 0.12)
  osc1.stop(now + 0.55)
  osc2.stop(now + 0.85)
}

export function playSetTick(): void {
  const now = performance.now()
  
  // Rate limiting - ensure minimum interval between ticks
  // This prevents reverb-like overlapping when rotating fast
  if (now - lastTickTime < MIN_TICK_INTERVAL_MS) {
    return // Skip this tick - too soon after the last one
  }
  
  lastTickTime = now
  
  // Load buffer if not already loaded (non-blocking)
  const buffer = getTickBuffer()
  if (!buffer) {
    loadTickBuffer()
      .then(() => {
        // Buffer loaded, play it now
        playTickSound()
      })
      .catch(() => {
        // Silently fail if loading fails
      })
    return
  }

  playTickSound()
}

function playTickSound(): void {
  const buffer = getTickBuffer()
  if (!buffer) return

  const c = ctx()
  const source = c.createBufferSource()
  source.buffer = buffer
  
  // Well-oiled ratchet = very soft and subtle (reduced to ~30% of original)
  const gain = c.createGain()
  gain.gain.value = 0.3
  gain.connect(c.destination)
  
  // No fades, no reverb, no tail - instant start/stop
  source.connect(gain)
  source.start(0)
}
