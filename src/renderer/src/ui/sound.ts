let audioCtx: AudioContext | null = null
let tickBuffer: AudioBuffer | null = null
let tickBufferLoading: Promise<AudioBuffer> | null = null

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
      const tickUrl = new URL('../assets/relativistic_tick.wav', import.meta.url).href
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
  // Load buffer if not already loaded (non-blocking)
  if (!tickBuffer) {
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
  if (!tickBuffer) return

  const c = ctx()
  const source = c.createBufferSource()
  source.buffer = tickBuffer
  
  // No fades - instant start/stop as per usage tips
  source.connect(c.destination)
  source.start(0)
}
