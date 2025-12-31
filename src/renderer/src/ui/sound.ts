let audioCtx: AudioContext | null = null

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
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
  const c = ctx()
  const now = c.currentTime

  // A short, soft mechanical tick: low "thud" + dull noise click.
  const out = c.createGain()
  out.gain.setValueAtTime(0.0001, now)
  out.gain.exponentialRampToValueAtTime(0.10, now + 0.004)
  out.gain.exponentialRampToValueAtTime(0.0001, now + 0.040)
  out.connect(c.destination)

  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(260, now)
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.025)
  osc.connect(out)
  osc.start(now)
  osc.stop(now + 0.035)

  const bufferLen = Math.max(1, Math.floor(c.sampleRate * 0.016))
  const buffer = c.createBuffer(1, bufferLen, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferLen; i += 1) data[i] = Math.random() * 2 - 1

  const noise = c.createBufferSource()
  noise.buffer = buffer

  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(1100, now)

  const ng = c.createGain()
  ng.gain.setValueAtTime(0.055, now)
  ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.018)

  noise.connect(lp)
  lp.connect(ng)
  ng.connect(out)
  noise.start(now)
}
