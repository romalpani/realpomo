import { clamp } from './math'
import { formatTimerTime } from './time'

type ClockOptions = {
  host: HTMLElement
  maxSeconds: number
  getSeconds: () => number
  setSeconds: (seconds: number) => void
  start: () => void
  pause: () => void
  canEdit: () => boolean
  onMinuteStep?: (minute: number) => void
}

const SVG_NS = 'http://www.w3.org/2000/svg'

const COLORS = {
  CASE: '#7AB58E',
  FACE: '#FFFFFF',
  SECTOR: '#1D5D3B',
  TICKS: '#000000',
  KNOB: '#7BB68F',
  TEXT: '#333333',
  INVERT: 'rgba(255,255,255,0.92)'
}

export type ClockColor = {
  case: string
  knob: string
  sector: string
}

export function createPomodoroClock(options: ClockOptions) {
  const { host, maxSeconds, getSeconds, setSeconds, start, pause, canEdit, onMinuteStep } = options

  host.replaceChildren()

  const shell = document.createElement('div')
  shell.className = 'shell'

  const content = document.createElement('div')
  content.className = 'shell-content'

  const clockStack = document.createElement('div')
  clockStack.className = 'clock-stack no-drag'

  let currentColor: ClockColor = {
    case: COLORS.CASE,
    knob: COLORS.KNOB,
    sector: COLORS.SECTOR
  }

  const clockCase = document.createElement('div')
  clockCase.className = 'clock-case'
  clockCase.style.background = currentColor.case

  const clockFace = document.createElement('div')
  clockFace.className = 'clock-face'

  const interactive = document.createElement('div')
  interactive.className = 'clock-interactive'
  interactive.setAttribute('role', 'application')

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.style.display = 'block'

  const defs = document.createElementNS(SVG_NS, 'defs')

  const sectorClip = document.createElementNS(SVG_NS, 'clipPath')
  sectorClip.setAttribute('id', 'sectorClip')
  const sectorClipPath = document.createElementNS(SVG_NS, 'path')
  sectorClip.appendChild(sectorClipPath)
  defs.appendChild(sectorClip)

  const handGlowFilter = document.createElementNS(SVG_NS, 'filter')
  handGlowFilter.setAttribute('id', 'handGlow')
  handGlowFilter.setAttribute('x', '-50%')
  handGlowFilter.setAttribute('y', '-50%')
  handGlowFilter.setAttribute('width', '200%')
  handGlowFilter.setAttribute('height', '200%')

  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur')
  blur.setAttribute('in', 'SourceGraphic')
  blur.setAttribute('stdDeviation', '0.9')
  handGlowFilter.appendChild(blur)
  defs.appendChild(handGlowFilter)

  const grad = document.createElementNS(SVG_NS, 'radialGradient')
  grad.setAttribute('id', 'knobGradient')
  grad.setAttribute('cx', '50%')
  grad.setAttribute('cy', '50%')
  grad.setAttribute('r', '50%')
  grad.setAttribute('fx', '25%')
  grad.setAttribute('fy', '25%')

  const stop1 = document.createElementNS(SVG_NS, 'stop')
  stop1.setAttribute('offset', '0%')
  stop1.setAttribute('stop-color', 'white')
  stop1.setAttribute('stop-opacity', '0.3')

  const stop2 = document.createElementNS(SVG_NS, 'stop')
  stop2.setAttribute('offset', '100%')
  stop2.setAttribute('stop-color', 'black')
  stop2.setAttribute('stop-opacity', '0.1')

  grad.appendChild(stop1)
  grad.appendChild(stop2)
  defs.appendChild(grad)

  const sector = document.createElementNS(SVG_NS, 'path')
  sector.setAttribute('fill', currentColor.sector)

  // Hand only shows at 00 when nothing is selected.
  // Layered strokes for a subtle liquid-glass look.
  const handGlow = document.createElementNS(SVG_NS, 'line')
  handGlow.setAttribute('x1', '50')
  handGlow.setAttribute('y1', '50')
  handGlow.setAttribute('x2', '50')
  handGlow.setAttribute('y2', '22')
  handGlow.setAttribute('stroke', 'rgba(255,255,255,0.22)')
  handGlow.setAttribute('stroke-width', '4.2')
  handGlow.setAttribute('stroke-linecap', 'round')
  handGlow.setAttribute('filter', 'url(#handGlow)')
  handGlow.setAttribute('opacity', '0')

  const handBase = document.createElementNS(SVG_NS, 'line')
  handBase.setAttribute('x1', '50')
  handBase.setAttribute('y1', '50')
  handBase.setAttribute('x2', '50')
  handBase.setAttribute('y2', '22')
  handBase.setAttribute('stroke', 'rgba(0,0,0,0.42)')
  handBase.setAttribute('stroke-width', '1.35')
  handBase.setAttribute('stroke-linecap', 'round')
  handBase.setAttribute('opacity', '0')

  const handHighlight = document.createElementNS(SVG_NS, 'line')
  handHighlight.setAttribute('x1', '50')
  handHighlight.setAttribute('y1', '50')
  handHighlight.setAttribute('x2', '50')
  handHighlight.setAttribute('y2', '22')
  handHighlight.setAttribute('stroke', 'rgba(255,255,255,0.28)')
  handHighlight.setAttribute('stroke-width', '0.7')
  handHighlight.setAttribute('stroke-linecap', 'round')
  handHighlight.setAttribute('opacity', '0')

  const ticksGroup = document.createElementNS(SVG_NS, 'g')
  const numbersGroup = document.createElementNS(SVG_NS, 'g')

  const ticksInverted = document.createElementNS(SVG_NS, 'g')
  const numbersInverted = document.createElementNS(SVG_NS, 'g')
  const invertedGroup = document.createElementNS(SVG_NS, 'g')
  invertedGroup.setAttribute('clip-path', 'url(#sectorClip)')
  invertedGroup.appendChild(ticksInverted)
  invertedGroup.appendChild(numbersInverted)

  for (let i = 0; i < 60; i += 1) {
    const isMajor = i % 5 === 0
    const tickAngle = (i / 60) * 2 * Math.PI
    const innerR = isMajor ? 37 : 41
    const outerR = 44

    const x1 = 50 + innerR * Math.sin(tickAngle)
    const y1 = 50 - innerR * Math.cos(tickAngle)
    const x2 = 50 + outerR * Math.sin(tickAngle)
    const y2 = 50 - outerR * Math.cos(tickAngle)

    const tick = document.createElementNS(SVG_NS, 'line')
    tick.setAttribute('x1', x1.toFixed(3))
    tick.setAttribute('y1', y1.toFixed(3))
    tick.setAttribute('x2', x2.toFixed(3))
    tick.setAttribute('y2', y2.toFixed(3))
    tick.setAttribute('stroke', COLORS.TICKS)
    tick.setAttribute('stroke-width', isMajor ? '0.8' : '0.4')
    tick.setAttribute('stroke-linecap', 'round')
    ticksGroup.appendChild(tick)

    const tickInv = document.createElementNS(SVG_NS, 'line')
    tickInv.setAttribute('x1', x1.toFixed(3))
    tickInv.setAttribute('y1', y1.toFixed(3))
    tickInv.setAttribute('x2', x2.toFixed(3))
    tickInv.setAttribute('y2', y2.toFixed(3))
    tickInv.setAttribute('stroke', COLORS.INVERT)
    tickInv.setAttribute('stroke-width', isMajor ? '0.8' : '0.4')
    tickInv.setAttribute('stroke-linecap', 'round')
    ticksInverted.appendChild(tickInv)
  }

  for (let i = 0; i < 60; i += 5) {
    const numAngle = (i / 60) * 2 * Math.PI
    const textRadius = 31
    const x = 50 + textRadius * Math.sin(numAngle)
    const y = 50 - textRadius * Math.cos(numAngle)

    const label = document.createElementNS(SVG_NS, 'text')
    label.setAttribute('x', x.toFixed(3))
    label.setAttribute('y', y.toFixed(3))
    label.setAttribute('fill', COLORS.TEXT)
    label.setAttribute('font-size', '5')
    label.setAttribute('font-weight', '700')
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('alignment-baseline', 'middle')
    label.setAttribute('dominant-baseline', 'central')
    label.setAttribute('style', "font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial")
    label.textContent = String(i)
    numbersGroup.appendChild(label)

    const labelInv = document.createElementNS(SVG_NS, 'text')
    labelInv.setAttribute('x', x.toFixed(3))
    labelInv.setAttribute('y', y.toFixed(3))
    labelInv.setAttribute('fill', COLORS.INVERT)
    labelInv.setAttribute('font-size', '5')
    labelInv.setAttribute('font-weight', '700')
    labelInv.setAttribute('text-anchor', 'middle')
    labelInv.setAttribute('alignment-baseline', 'middle')
    labelInv.setAttribute('dominant-baseline', 'central')
    labelInv.setAttribute(
      'style',
      "font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
    )
    labelInv.textContent = String(i)
    numbersInverted.appendChild(labelInv)
  }

  const knobShadow = document.createElementNS(SVG_NS, 'circle')
  knobShadow.setAttribute('cx', '50')
  knobShadow.setAttribute('cy', '50')
  knobShadow.setAttribute('r', '6.5')
  knobShadow.setAttribute('fill', 'black')
  knobShadow.setAttribute('opacity', '0.1')

  const knobBase = document.createElementNS(SVG_NS, 'circle')
  knobBase.setAttribute('cx', '50')
  knobBase.setAttribute('cy', '50')
  knobBase.setAttribute('r', '6')
  knobBase.setAttribute('fill', currentColor.knob)
  knobBase.setAttribute('data-knob-base', 'true')

  const knobHighlight = document.createElementNS(SVG_NS, 'circle')
  knobHighlight.setAttribute('cx', '50')
  knobHighlight.setAttribute('cy', '50')
  knobHighlight.setAttribute('r', '6')
  knobHighlight.setAttribute('fill', 'url(#knobGradient)')
  knobHighlight.setAttribute('data-knob-highlight', 'true')

  svg.appendChild(defs)
  svg.appendChild(sector)
  svg.appendChild(ticksGroup)
  svg.appendChild(numbersGroup)
  svg.appendChild(invertedGroup)
  svg.appendChild(handGlow)
  svg.appendChild(handBase)
  svg.appendChild(handHighlight)
  svg.appendChild(knobShadow)
  svg.appendChild(knobBase)
  svg.appendChild(knobHighlight)

  interactive.appendChild(svg)
  clockFace.appendChild(interactive)
  clockCase.appendChild(clockFace)

  const display = document.createElement('div')
  display.className = 'timer-display no-drag'

  const timeEl = document.createElement('div')
  timeEl.className = 'timer-time'

  const quick = document.createElement('div')
  quick.className = 'timer-quick'

  const quickMins = [5, 15, 25, 45, 60]
  const quickButtons: HTMLButtonElement[] = []
  for (const min of quickMins) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'timer-quick-btn'
    btn.textContent = `${min}m`
    btn.addEventListener('click', () => {
      pause()
      setSeconds(min * 60)
      update(getSeconds())
      start()
    })
    quickButtons.push(btn)
    quick.appendChild(btn)
  }

  display.appendChild(timeEl)
  display.appendChild(quick)

  clockStack.appendChild(clockCase)
  clockStack.appendChild(display)

  content.appendChild(clockStack)
  shell.appendChild(content)
  host.appendChild(shell)

  const center = 50
  const sectorRadius = 45

  function updateSector(seconds: number): void {
    const t = clamp(seconds, 0, maxSeconds)
    const timeFraction = maxSeconds === 0 ? 0 : t / maxSeconds
    const angle = timeFraction * 2 * Math.PI
    const endX = center + sectorRadius * Math.sin(angle)
    const endY = center - sectorRadius * Math.cos(angle)
    const largeArcFlag = angle > Math.PI ? 1 : 0

    let path = ''
    if (t >= maxSeconds) {
      path = `M ${center} ${center - sectorRadius} A ${sectorRadius} ${sectorRadius} 0 1 1 ${center} ${center + sectorRadius} A ${sectorRadius} ${sectorRadius} 0 1 1 ${center} ${center - sectorRadius} Z`
    } else if (t <= 0) {
      path = ''
    } else {
      path = `M ${center} ${center} L ${center} ${center - sectorRadius} A ${sectorRadius} ${sectorRadius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
    }

    sector.setAttribute('d', path)
    sectorClipPath.setAttribute('d', path)

    // When nothing is selected, show the hand pointing at 00.
    const showHand = t <= 0
    handGlow.setAttribute('opacity', showHand ? '1' : '0')
    handBase.setAttribute('opacity', showHand ? '1' : '0')
    handHighlight.setAttribute('opacity', showHand ? '1' : '0')
  }

  function update(seconds: number): void {
    timeEl.textContent = formatTimerTime(seconds)
    updateSector(seconds)
  }

  let dragging = false
  let lastMinute = -1

  let lastDragAngleDeg: number | null = null
  let unwrappedDragAngleDeg = 0

  function clockAngleFromPointer(ev: PointerEvent): number {
    const rect = interactive.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const x = ev.clientX - rect.left - cx
    const y = ev.clientY - rect.top - cy

    const angleRad = Math.atan2(y, x)
    const angleDeg = (angleRad * 180) / Math.PI
    let clockAngle = angleDeg + 90
    if (clockAngle < 0) clockAngle += 360
    return clockAngle
  }

  function secondsFromPointer(ev: PointerEvent): number {
    const angleDeg = clockAngleFromPointer(ev)

    // When maxSeconds is a full hour (or any full-range max), we don't want the user
    // to be able to "lap" past the top (12 o'clock) and wrap back to 00.
    // Track an unwrapped angle while dragging and clamp it to [0, 360].
    if (!dragging) {
      const seconds = clamp(Math.round((angleDeg / 360) * maxSeconds), 0, maxSeconds)
      return seconds
    }

    if (lastDragAngleDeg === null) {
      lastDragAngleDeg = angleDeg

      // Snap a tiny zone around 12 o'clock to avoid accidental selection of max.
      // Important: keep the rest of the dial "direct-click" accurate (e.g. 55m).
      const snapBandDeg = 10
      const inTopSnapBand = angleDeg <= snapBandDeg || angleDeg >= 360 - snapBandDeg

      if (inTopSnapBand) {
        const currentSeconds = clamp(getSeconds(), 0, maxSeconds)
        const snapToMaxThresholdSeconds = Math.max(0, maxSeconds - 5 * 60)
        unwrappedDragAngleDeg = currentSeconds >= snapToMaxThresholdSeconds ? 360 : 0
      } else {
        unwrappedDragAngleDeg = angleDeg
      }
    } else {
      let delta = angleDeg - lastDragAngleDeg
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      unwrappedDragAngleDeg = clamp(unwrappedDragAngleDeg + delta, 0, 360)
      lastDragAngleDeg = angleDeg
    }

    const seconds = clamp(Math.round((unwrappedDragAngleDeg / 360) * maxSeconds), 0, maxSeconds)
    return seconds
  }

  function isCenterPress(ev: PointerEvent): boolean {
    const rect = interactive.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const x = ev.clientX - rect.left - cx
    const y = ev.clientY - rect.top - cy
    const dist = Math.hypot(x, y)

    // Roughly matches the rendered knob size (r≈6 in a 100x100 viewBox).
    // Use a slightly larger hit target for accessibility.
    const hitRadius = Math.min(rect.width, rect.height) * 0.12
    return dist <= hitRadius
  }

  function isCenterHover(ev: PointerEvent | MouseEvent): boolean {
    const rect = interactive.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const x = ev.clientX - rect.left - cx
    const y = ev.clientY - rect.top - cy
    const dist = Math.hypot(x, y)

    // Use the same hit radius as center press detection
    const hitRadius = Math.min(rect.width, rect.height) * 0.12
    return dist <= hitRadius
  }

  function isHandHover(ev: PointerEvent | MouseEvent): boolean {
    // Hand is only visible when timer is at 00:00
    const currentSeconds = getSeconds()
    if (currentSeconds > 0) return false

    const rect = interactive.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    
    // Convert pointer position to SVG coordinates (0-100)
    const svgX = ((ev.clientX - rect.left) / rect.width) * 100
    const svgY = ((ev.clientY - rect.top) / rect.height) * 100
    
    // Hand is a vertical line from center (50, 50) to top (50, 22)
    const handStartX = 50
    const handStartY = 50
    const handEndX = 50
    const handEndY = 22
    
    // Check if pointer is near the hand line
    // Calculate distance from point to line segment
    const A = svgX - handStartX
    const B = svgY - handStartY
    const C = handEndX - handStartX
    const D = handEndY - handStartY
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    if (lenSq !== 0) param = dot / lenSq
    
    let xx: number, yy: number
    
    if (param < 0) {
      xx = handStartX
      yy = handStartY
    } else if (param > 1) {
      xx = handEndX
      yy = handEndY
    } else {
      xx = handStartX + param * C
      yy = handStartY + param * D
    }
    
    const dx = svgX - xx
    const dy = svgY - yy
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Use a hit radius that scales with the viewBox (roughly 2-3 units)
    const hitRadius = 2.5
    return distance <= hitRadius && param >= 0 && param <= 1
  }

  function applyPointer(ev: PointerEvent): void {
    const seconds = secondsFromPointer(ev)

    const minute = Math.floor(seconds / 60)
    if (minute !== lastMinute) {
      onMinuteStep?.(minute)
      lastMinute = minute
    }

    setSeconds(seconds)
    update(seconds)
  }

  function onPointerDown(ev: PointerEvent): void {
    if (!canEdit()) return
    ev.preventDefault()

    // Clicking the center knob resets to 00:00.
    if (isCenterPress(ev)) {
      interactive.classList.add('knob-active')
      pause()
      setSeconds(0)
      update(0)
      // Set a timeout to remove active state after a brief moment for visual feedback
      setTimeout(() => {
        interactive.classList.remove('knob-active')
      }, 150)
      return
    }

    // Remove any knob/hand states when starting to drag elsewhere
    interactive.classList.remove('knob-hover', 'knob-active', 'hand-hover')
    dragging = true
    interactive.classList.add('dragging')
    lastDragAngleDeg = null
    pause()
    interactive.setPointerCapture(ev.pointerId)
    applyPointer(ev)
  }

  function onPointerMove(ev: PointerEvent): void {
    if (!dragging) return
    ev.preventDefault()
    applyPointer(ev)
  }

  function onPointerUp(ev: PointerEvent): void {
    interactive.classList.remove('knob-active', 'dragging')
    if (!dragging) return
    dragging = false
    lastMinute = -1
    lastDragAngleDeg = null

    try {
      interactive.releasePointerCapture(ev.pointerId)
    } catch {
      // ignore
    }

    const seconds = getSeconds()
    if (seconds > 0) start()
    else pause()
  }

  function onMouseMove(ev: MouseEvent): void {
    if (!canEdit()) return
    
    // Check for center knob hover
    if (isCenterHover(ev)) {
      interactive.classList.add('knob-hover')
      interactive.classList.remove('hand-hover')
    } else {
      interactive.classList.remove('knob-hover')
    }
    
    // Check for hand hover (only when hand is visible)
    if (!interactive.classList.contains('knob-hover')) {
      if (isHandHover(ev)) {
        interactive.classList.add('hand-hover')
      } else {
        interactive.classList.remove('hand-hover')
      }
    }
  }

  function onMouseLeave(): void {
    interactive.classList.remove('knob-hover', 'knob-active', 'hand-hover')
  }

  interactive.addEventListener('pointerdown', onPointerDown)
  interactive.addEventListener('pointermove', onPointerMove)
  interactive.addEventListener('pointerup', onPointerUp)
  interactive.addEventListener('pointercancel', onPointerUp)
  interactive.addEventListener('mousemove', onMouseMove)
  interactive.addEventListener('mouseleave', onMouseLeave)

  update(getSeconds())

  return {
    update,
    setInteractive(next: boolean) {
      interactive.style.pointerEvents = next ? 'auto' : 'none'
      interactive.style.opacity = next ? '1' : '0.98'
      for (const btn of quickButtons) btn.disabled = !next
    },
    setColor(color: ClockColor) {
      currentColor = color
      clockCase.style.background = color.case
      knobBase.setAttribute('fill', color.knob)
      sector.setAttribute('fill', color.sector)
    },
    getColor(): ClockColor {
      return { ...currentColor }
    }
  }
}
