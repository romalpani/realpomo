// Static import - Vite will handle this correctly in both dev and production
// In production, this becomes a data URL or a proper asset URL
import tickSoundUrl from '../assets/clock_tick_extracted.wav?url'
import pencilClickSoundUrl from '../assets/pencil_click_extracted.wav?url'

let audioCtx: AudioContext | null = null
let tickBuffer: AudioBuffer | null = null
let tickBufferLoading: Promise<AudioBuffer> | null = null
let pencilClickBuffer: AudioBuffer | null = null
let pencilClickBufferLoading: Promise<AudioBuffer> | null = null

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
      let arrayBuffer: ArrayBuffer
      
      // Handle data URLs directly (production build)
      if (tickSoundUrl.startsWith('data:')) {
        const base64Data = tickSoundUrl.split(',')[1]
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        arrayBuffer = bytes.buffer
      } else {
        // Handle regular URLs (dev mode)
        const response = await fetch(tickSoundUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch tick sound: ${response.status} ${response.statusText}`)
        }
        arrayBuffer = await response.arrayBuffer()
      }
      
      const buffer = await ctx().decodeAudioData(arrayBuffer)
      tickBuffer = buffer
      return buffer
    } catch (error) {
      console.error('Failed to load tick sound:', error, { tickSoundUrl: tickSoundUrl.substring(0, 50) + '...' })
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

function playSingleChime(startTime: number): void {
  const c = ctx()

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9)
  gain.connect(c.destination)

  const osc1 = c.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(660, startTime)
  osc1.frequency.exponentialRampToValueAtTime(880, startTime + 0.18)
  osc1.connect(gain)

  const osc2 = c.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(440, startTime + 0.12)
  osc2.frequency.exponentialRampToValueAtTime(660, startTime + 0.32)
  osc2.connect(gain)

  osc1.start(startTime)
  osc2.start(startTime + 0.12)
  osc1.stop(startTime + 0.55)
  osc2.stop(startTime + 0.85)
}

export function playDoneChime(): void {
  const c = ctx()
  const now = c.currentTime

  // Play 3 beeps with 1 second spacing between them
  playSingleChime(now)
  playSingleChime(now + 1.0)
  playSingleChime(now + 2.0)
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
      .catch((error) => {
        // Log error but don't crash - sound is optional
        console.warn('Tick sound failed to load, continuing without sound:', error)
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

async function loadPencilClickBuffer(): Promise<AudioBuffer> {
  if (pencilClickBuffer) return pencilClickBuffer
  if (pencilClickBufferLoading) return pencilClickBufferLoading

  pencilClickBufferLoading = (async () => {
    try {
      let arrayBuffer: ArrayBuffer
      
      // Handle data URLs directly (production build)
      if (pencilClickSoundUrl.startsWith('data:')) {
        const base64Data = pencilClickSoundUrl.split(',')[1]
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        arrayBuffer = bytes.buffer
      } else {
        // Handle regular URLs (dev mode)
        const response = await fetch(pencilClickSoundUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch pencil click sound: ${response.status} ${response.statusText}`)
        }
        arrayBuffer = await response.arrayBuffer()
      }
      
      const buffer = await ctx().decodeAudioData(arrayBuffer)
      pencilClickBuffer = buffer
      return buffer
    } catch (error) {
      console.error('Failed to load pencil click sound:', error)
      throw error
    } finally {
      pencilClickBufferLoading = null
    }
  })()

  return pencilClickBufferLoading
}

function getPencilClickBuffer(): AudioBuffer | null {
  return pencilClickBuffer
}

export function playPencilClick(): void {
  const buffer = getPencilClickBuffer()
  if (!buffer) {
    loadPencilClickBuffer()
      .then(() => {
        playPencilClickSound()
      })
      .catch((error) => {
        console.warn('Pencil click sound failed to load, continuing without sound:', error)
      })
    return
  }

  playPencilClickSound()
}

function playPencilClickSound(): void {
  const buffer = getPencilClickBuffer()
  if (!buffer) return

  const c = ctx()
  const source = c.createBufferSource()
  source.buffer = buffer
  
  const gain = c.createGain()
  gain.gain.value = 0.4
  gain.connect(c.destination)
  
  source.connect(gain)
  source.start(0)
}
