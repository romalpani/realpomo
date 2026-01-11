import { clamp } from './math'
import { formatTimerTime } from './time'
import { playSetTick, playPencilClick } from './sound'
import {
  createClockworkState,
  startDrag,
  updateDrag,
  snapOnRelease,
  updateSettle,
  endDrag,
  angleToSeconds,
  secondsToAngle,
  snapToDetent,
  snapToDetentForCountdown
} from './clockwork'

type ClockOptions = {
  host: HTMLElement
  maxSeconds: number
  getSeconds: () => number
  setSeconds: (seconds: number) => void
  start: () => void
  pause: () => void
  canEdit: () => boolean
  isRunning: () => boolean
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
  const { host, maxSeconds, getSeconds, setSeconds, start, pause, canEdit, isRunning, onMinuteStep } = options

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

  const quickMins = [5, 10, 25, 50]
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

  // Create todo item container (before presets)
  const todoContainer = document.createElement('div')
  todoContainer.className = 'todo-container no-drag'
  
  const todoItem = document.createElement('div')
  todoItem.className = 'todo-item'
  
  const todoCheckbox = document.createElement('input')
  todoCheckbox.type = 'checkbox'
  todoCheckbox.className = 'todo-checkbox'
  todoCheckbox.disabled = true
  todoCheckbox.setAttribute('aria-label', 'Mark task as complete')
  
  const todoInput = document.createElement('input')
  todoInput.type = 'text'
  todoInput.className = 'todo-input'
  todoInput.placeholder = 'Add a task to focus on'
  todoInput.setAttribute('aria-label', 'Task input')
  todoInput.setAttribute('role', 'textbox')
  
  // Typing indicator
  const typingIndicator = document.createElement('div')
  typingIndicator.className = 'todo-typing-indicator'
  typingIndicator.setAttribute('aria-hidden', 'true')
  
  todoItem.appendChild(todoCheckbox)
  todoItem.appendChild(todoInput)
  todoItem.appendChild(typingIndicator)
  todoContainer.appendChild(todoItem)
  
  display.appendChild(todoContainer)
  display.appendChild(quick)

  clockStack.appendChild(clockCase)
  clockStack.appendChild(display)

  content.appendChild(clockStack)
  shell.appendChild(content)
  host.appendChild(shell)

  // Context menu state
  let showTimer = true
  let showPresets = true
  let showTodo = true

  // Load saved preferences
  let savedTaskText = ''
  try {
    const savedTimer = localStorage.getItem('realpomo:showTimer')
    const savedPresets = localStorage.getItem('realpomo:showPresets')
    const savedTodo = localStorage.getItem('realpomo:showTodo')
    const savedTask = localStorage.getItem('realpomo:taskText')
    if (savedTimer !== null) showTimer = savedTimer === 'true'
    if (savedPresets !== null) showPresets = savedPresets === 'true'
    if (savedTodo !== null) showTodo = savedTodo === 'true'
    if (savedTask !== null) savedTaskText = savedTask
  } catch {
    // Ignore localStorage errors
  }

  // Calculate window height based on actual content measurements
  function calculateWindowHeight(): void {
    // Use double RAF to ensure DOM has fully updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (typeof window !== 'undefined' && window.timerApi?.requestResize) {
          // Measure the clockStack which contains clock + display + gap
          // This already includes all visible content
          const clockStackRect = clockStack.getBoundingClientRect()
          const contentHeight = clockStackRect.height
          
          // Padding from .shell-content (28px top + 20px bottom = 48px)
          const padding = 48
          
          // Calculate total height: content + padding
          const totalHeight = Math.ceil(contentHeight + padding)
          
          // Ensure minimum height of at least clock size + padding
          const minHeight = 400 + padding
          const newHeight = Math.max(minHeight, totalHeight)
          
          window.timerApi.requestResize(newHeight)
        }
      })
    })
  }
  
  // Update todo item width to match clock width
  function updateTodoWidth(): void {
    requestAnimationFrame(() => {
      const clockCaseRect = clockCase.getBoundingClientRect()
      const clockWidth = clockCaseRect.width
      if (clockWidth > 0) {
        todoItem.style.width = `${clockWidth}px`
        todoItem.style.maxWidth = `${clockWidth}px`
      }
    })
  }

  // Apply initial visibility
  function updateVisibility(): void {
    timeEl.style.display = showTimer ? '' : 'none'
    quick.style.display = showPresets ? '' : 'none'
    todoContainer.style.display = showTodo ? '' : 'none'
    
    // Hide display container if all children are hidden
    if (!showTimer && !showPresets && !showTodo) {
      display.style.display = 'none'
      // Ensure no pointer events when hidden
      display.style.pointerEvents = 'none'
    } else {
      display.style.display = ''
      display.style.pointerEvents = ''
    }
    
    // Resize window based on actual content measurements
    setTimeout(() => {
      calculateWindowHeight()
      updateTodoWidth()
    }, 50) // Small delay to ensure DOM has updated
  }
  
  updateVisibility()
  
  // Restore saved task text
  if (savedTaskText) {
    todoInput.value = savedTaskText
    todoCheckbox.disabled = false
  }
  
  // Add fade-in animation on first appearance
  if (showTodo) {
    requestAnimationFrame(() => {
      todoContainer.classList.add('todo-fade-in')
    })
  }
  
  // Initial window resize and todo width update after everything is set up
  setTimeout(() => {
    calculateWindowHeight()
    updateTodoWidth()
  }, 100)
  
  // Update todo width on window resize
  window.addEventListener('resize', () => {
    updateTodoWidth()
  })

  // Color utility functions
  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0]
  }

  function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map(x => {
      const hex = Math.round(x).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')}`
  }

  function rgbToRgba(r: number, g: number, b: number, alpha: number): string {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  function lighten(color: string, amount: number): string {
    const [r, g, b] = hexToRgb(color)
    return rgbToHex(
      Math.min(255, r + amount),
      Math.min(255, g + amount),
      Math.min(255, b + amount)
    )
  }

  function darken(color: string, amount: number): string {
    const [r, g, b] = hexToRgb(color)
    return rgbToHex(
      Math.max(0, r - amount),
      Math.max(0, g - amount),
      Math.max(0, b - amount)
    )
  }

  // Theme-aware confetti animation with pop effect from random sides
  function createConfetti(): void {
    // Generate theme-aware colors from current theme
    const baseColor = currentColor.sector
    const caseColor = currentColor.case
    const knobColor = currentColor.knob
    
    // Create color palette from theme
    const colors = [
      baseColor,
      lighten(baseColor, 40),
      lighten(baseColor, 60),
      caseColor,
      lighten(caseColor, 30),
      knobColor,
      lighten(knobColor, 20),
      darken(baseColor, 20)
    ]
    
    const confettiCount = 120
    const duration = 2000
    
    // Get checkbox position as center point
    const checkboxRect = todoCheckbox.getBoundingClientRect()
    const centerX = checkboxRect.left + checkboxRect.width / 2
    const centerY = checkboxRect.top + checkboxRect.height / 2
    
    // Randomly choose a side/corner to pop from
    const sides = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']
    const popSide = sides[Math.floor(Math.random() * sides.length)]
    
    // Determine starting position based on pop side
    let startX = centerX
    let startY = centerY
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    switch (popSide) {
      case 'top':
        startX = Math.random() * viewportWidth
        startY = -20
        break
      case 'bottom':
        startX = Math.random() * viewportWidth
        startY = viewportHeight + 20
        break
      case 'left':
        startX = -20
        startY = Math.random() * viewportHeight
        break
      case 'right':
        startX = viewportWidth + 20
        startY = Math.random() * viewportHeight
        break
      case 'top-left':
        startX = -20
        startY = -20
        break
      case 'top-right':
        startX = viewportWidth + 20
        startY = -20
        break
      case 'bottom-left':
        startX = -20
        startY = viewportHeight + 20
        break
      case 'bottom-right':
        startX = viewportWidth + 20
        startY = viewportHeight + 20
        break
    }
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.style.position = 'fixed'
      confetti.style.width = `${Math.random() * 8 + 4}px`
      confetti.style.height = confetti.style.width
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.left = `${startX}px`
      confetti.style.top = `${startY}px`
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0'
      confetti.style.pointerEvents = 'none'
      confetti.style.zIndex = '9999'
      confetti.style.opacity = '0'
      
      document.body.appendChild(confetti)
      
      // Calculate angle from start position to center (explosion effect)
      const dx = centerX - startX
      const dy = centerY - startY
      const baseAngle = Math.atan2(dy, dx)
      
      // Add random spread around the base angle
      const angleSpread = Math.PI * 0.6 // 60 degree spread
      const angle = baseAngle + (Math.random() - 0.5) * angleSpread
      
      // Random velocity with explosion effect
      const baseVelocity = 200 + Math.random() * 300
      const velocity = baseVelocity * (0.7 + Math.random() * 0.6)
      
      const rotation = (Math.random() - 0.5) * 720
      
      const startTime = Date.now()
      
      function animate() {
        const elapsed = Date.now() - startTime
        const progress = elapsed / duration
        
        if (progress >= 1) {
          confetti.remove()
          return
        }
        
        // Explosion effect - fast initial velocity, then deceleration
        const distance = velocity * progress * (1 - progress * 0.5)
        const x = startX + Math.cos(angle) * distance
        const y = startY + Math.sin(angle) * distance + 0.5 * 300 * progress * progress
        const currentRotation = rotation * progress
        
        // Fade in quickly, then fade out
        const opacity = progress < 0.1 ? progress * 10 : 0.9 * (1 - progress)
        
        confetti.style.transform = `translate(${x - startX}px, ${y - startY}px) rotate(${currentRotation}deg)`
        confetti.style.opacity = String(opacity)
        
        requestAnimationFrame(animate)
      }
      
      requestAnimationFrame(animate)
    }
  }

  // Prevent rapid clicks during disabled state
  let isCompleting = false
  
  // Typing indicator state
  let typingTimeout: number | null = null
  
  // Update checkbox color when theme changes
  function updateCheckboxColor(): void {
    const sectorColor = currentColor.sector
    const [r, g, b] = hexToRgb(sectorColor)
    // Create lighter tone (30% opacity) for active/press state
    const lighterColor = rgbToRgba(r, g, b, 0.3)
    
    todoCheckbox.style.accentColor = sectorColor
    todoCheckbox.style.setProperty('--checkbox-color', sectorColor)
    todoCheckbox.style.setProperty('--checkbox-color-light', lighterColor)
  }
  
  // Initial checkbox color
  updateCheckboxColor()

  // Todo item functionality
  todoInput.addEventListener('input', () => {
    const hasText = todoInput.value.trim().length > 0
    
    // Enable/disable checkbox based on text
    if (hasText && todoCheckbox.disabled) {
      todoCheckbox.disabled = false
    } else if (!hasText && !todoCheckbox.disabled) {
      todoCheckbox.disabled = true
    }
    
    // Save task text to localStorage
    try {
      localStorage.setItem('realpomo:taskText', todoInput.value)
    } catch {
      // Ignore localStorage errors
    }
    
    // Show typing indicator
    if (hasText) {
      typingIndicator.classList.add('typing-active')
      if (typingTimeout) clearTimeout(typingTimeout)
      typingTimeout = window.setTimeout(() => {
        typingIndicator.classList.remove('typing-active')
      }, 1000)
    } else {
      typingIndicator.classList.remove('typing-active')
    }
  })

  // Keyboard support
  todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      todoInput.value = ''
      todoInput.dispatchEvent(new Event('input'))
      todoInput.blur()
    }
  })

  todoCheckbox.addEventListener('change', () => {
    if (todoCheckbox.checked && !isCompleting) {
      isCompleting = true
      
      // Play pencil click sound
      playPencilClick()
      
      // Show theme-aware confetti animation
      createConfetti()
      
      // Disable the todo item
      todoItem.classList.add('todo-completed')
      todoInput.disabled = true
      todoCheckbox.disabled = true
      
      // Clear saved task text
      try {
        localStorage.removeItem('realpomo:taskText')
      } catch {
        // Ignore localStorage errors
      }
      
      // After 1 second, reset
      setTimeout(() => {
        isCompleting = false
        todoItem.classList.remove('todo-completed')
        todoInput.disabled = false
        todoInput.value = ''
        todoInput.dispatchEvent(new Event('input'))
        todoCheckbox.checked = false
        todoCheckbox.disabled = true
        typingIndicator.classList.remove('typing-active')
      }, 1000)
    }
  })
  
  // Focus management for accessibility
  todoInput.addEventListener('focus', () => {
    todoItem.classList.add('todo-focused')
  })
  
  todoInput.addEventListener('blur', () => {
    todoItem.classList.remove('todo-focused')
  })

  // Create context menu - append to body to avoid stacking context issues
  const contextMenu = document.createElement('div')
  contextMenu.className = 'context-menu no-drag'
  contextMenu.style.display = 'none'
  contextMenu.style.zIndex = '10000'
  contextMenu.style.position = 'fixed'
  contextMenu.style.pointerEvents = 'none'
  contextMenu.setAttribute('data-context-menu', 'true')
  document.body.appendChild(contextMenu)

  function createCheckmarkIcon(): SVGElement {
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('width', '16')
    svg.setAttribute('height', '16')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '2.5')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
    
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('d', 'M20 6L9 17l-5-5')
    
    svg.appendChild(path)
    return svg
  }

  function createMenuItem(
    label: string,
    checked: boolean,
    onClick: () => void
  ): HTMLElement {
    const item = document.createElement('div')
    item.className = 'context-menu-item'
    
    const iconContainer = document.createElement('span')
    iconContainer.className = 'context-menu-icon'
    iconContainer.style.width = '16px'
    iconContainer.style.height = '16px'
    iconContainer.style.display = 'inline-flex'
    iconContainer.style.alignItems = 'center'
    iconContainer.style.justifyContent = 'center'
    iconContainer.style.marginRight = '8px'
    
    if (checked) {
      const checkIcon = createCheckmarkIcon()
      iconContainer.appendChild(checkIcon)
    }
    
    const labelEl = document.createElement('span')
    labelEl.textContent = label
    
    item.appendChild(iconContainer)
    item.appendChild(labelEl)
    
    // Use capture phase to ensure we catch the event before anything else
    item.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      e.stopImmediatePropagation()
      onClick()
      hideContextMenu()
    }, true)
    
    // Also handle mousedown to ensure clicks work
    item.addEventListener('mousedown', (e) => {
      e.stopPropagation()
      e.stopImmediatePropagation()
    }, true)
    
    // Handle mouseup as well
    item.addEventListener('mouseup', (e) => {
      e.stopPropagation()
      e.stopImmediatePropagation()
    }, true)
    
    return item
  }

  function updateContextMenu(): void {
    contextMenu.innerHTML = ''
    
    const timerItem = createMenuItem('Show digital timer', showTimer, () => {
      showTimer = !showTimer
      try {
        localStorage.setItem('realpomo:showTimer', String(showTimer))
      } catch {
        // Ignore localStorage errors
      }
      updateVisibility()
    })
    
    const todoItem = createMenuItem('Show to-do', showTodo, () => {
      showTodo = !showTodo
      try {
        localStorage.setItem('realpomo:showTodo', String(showTodo))
      } catch {
        // Ignore localStorage errors
      }
      updateVisibility()
    })
    
    const presetsItem = createMenuItem('Show presets', showPresets, () => {
      showPresets = !showPresets
      try {
        localStorage.setItem('realpomo:showPresets', String(showPresets))
      } catch {
        // Ignore localStorage errors
      }
      updateVisibility()
    })
    
    contextMenu.appendChild(timerItem)
    contextMenu.appendChild(todoItem)
    contextMenu.appendChild(presetsItem)
  }

  function showContextMenu(x: number, y: number): void {
    updateContextMenu()
    
    // Ensure menu is always on top with maximum z-index
    contextMenu.style.zIndex = '10000'
    contextMenu.style.display = 'block'
    contextMenu.style.pointerEvents = 'auto'
    contextMenu.style.position = 'fixed'
    contextMenu.style.visibility = 'visible'
    
    // Position menu, ensuring it stays within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Estimate menu size (will be measured after first render)
    const estimatedWidth = 180
    const estimatedHeight = 80
    
    let left = x
    let top = y
    
    // Adjust if menu would go off right edge
    if (left + estimatedWidth > viewportWidth) {
      left = viewportWidth - estimatedWidth - 8
    }
    
    // Adjust if menu would go off bottom edge
    if (top + estimatedHeight > viewportHeight) {
      top = viewportHeight - estimatedHeight - 8
    }
    
    // Ensure menu doesn't go off left or top edges
    if (left < 8) left = 8
    if (top < 8) top = 8
    
    contextMenu.style.left = `${left}px`
    contextMenu.style.top = `${top}px`
    
    // After positioning, get actual size and adjust if needed
    requestAnimationFrame(() => {
      const menuRect = contextMenu.getBoundingClientRect()
      if (menuRect.right > viewportWidth) {
        contextMenu.style.left = `${viewportWidth - menuRect.width - 8}px`
      }
      if (menuRect.bottom > viewportHeight) {
        contextMenu.style.top = `${viewportHeight - menuRect.height - 8}px`
      }
    })
  }

  function hideContextMenu(): void {
    contextMenu.style.display = 'none'
    contextMenu.style.pointerEvents = 'none'
  }

  // Helper function to check if click is on clock dial
  function isClockDialClick(target: EventTarget | null): boolean {
    if (!target || !(target instanceof Node)) return false
    
    const element = target instanceof Element ? target : null
    if (!element) return false
    
    // Check if click is on clock dial elements
    return (
      interactive.contains(element) ||
      clockCase.contains(element) ||
      clockFace.contains(element) ||
      svg.contains(element)
    )
  }

  // Add right-click handler to shell (everywhere except clock dial)
  shell.addEventListener('contextmenu', (e) => {
    // Don't show menu if clicking on clock dial
    if (isClockDialClick(e.target)) {
      return
    }
    
    // Don't show menu if clicking on color picker (let it handle its own menu)
    const target = e.target instanceof Element ? e.target : null
    if (target && target.closest('.color-picker-container')) {
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    // Close color picker menu if open (by removing open class and setting aria-hidden)
    const colorPickerMenu = document.querySelector('.color-picker-menu.open')
    if (colorPickerMenu) {
      colorPickerMenu.classList.remove('open')
      colorPickerMenu.setAttribute('aria-hidden', 'true')
    }
    
    showContextMenu(e.clientX, e.clientY)
  })

  // Close menu on click outside - use capture phase to catch events before they're blocked
  document.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null
    
    // Don't close if clicking on the context menu itself
    if (target && contextMenu.contains(target)) {
      return
    }
    
    // Don't close if clicking on color picker menu or any color picker option
    if (target && (target.closest('.color-picker-menu') || target.closest('.color-picker-option') || target.closest('.color-picker-container'))) {
      return
    }
    
    // Close the menu
    hideContextMenu()
  }, true) // Use capture phase
  
  // Also handle clicks on shell/content areas directly
  shell.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null
    
    // Don't close if clicking on the context menu itself
    if (target && contextMenu.contains(target)) {
      return
    }
    
    // Don't close if clicking on clock dial (let clock handle its own clicks)
    if (isClockDialClick(e.target)) {
      return
    }
    
    // Don't close if clicking on color picker or its options
    if (target && (target.closest('.color-picker-container') || target.closest('.color-picker-menu') || target.closest('.color-picker-option'))) {
      return
    }
    
    // Close the menu
    hideContextMenu()
  }, true) // Use capture phase
  
  document.addEventListener('contextmenu', (e) => {
    const target = e.target instanceof Element ? e.target : null
    
    // Don't close if clicking on color picker
    if (target && target.closest('.color-picker-container')) {
      return
    }
    
    // Don't close if clicking on the context menu itself
    if (target && contextMenu.contains(target)) {
      return
    }
    
    hideContextMenu()
  }, true) // Use capture phase
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contextMenu.style.display !== 'none') {
      hideContextMenu()
    }
  })

  const center = 50
  const sectorRadius = 45

  /**
   * Helper to determine which snapping function to use based on timer state
   * During countdown (timer running with seconds > 0), use ceiling snap to show next minute marker
   * Otherwise (timer paused/stopped or at 0), use nearest snap for setting time
   */
  function getSnapFunction(seconds: number): (angle: number) => number {
    if (isRunning() && seconds > 0) {
      return snapToDetentForCountdown
    }
    return snapToDetent
  }

  function updateSector(seconds: number): void {
    const t = clamp(seconds, 0, maxSeconds)
    const timeFraction = maxSeconds === 0 ? 0 : t / maxSeconds
    let angle = timeFraction * 2 * Math.PI
    
    // When dragging or settling, use the display angle (which includes magnet pull or animation)
    if (dragging || clockworkState.inSettleAnimation) {
      angle = clockworkState.angleDisplay
    } else {
      // Snap angle based on timer state (countdown vs setting)
      angle = getSnapFunction(t)(angle)
    }
    
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
    
    // Update clockwork state when timer updates externally (not during drag)
    if (!dragging) {
      const angle = secondsToAngle(seconds, maxSeconds)
      clockworkState.angleRaw = angle
      // Snap display angle based on timer state (countdown vs setting)
      clockworkState.angleDisplay = getSnapFunction(seconds)(angle)
      clockworkState.detentIndexCommitted = Math.floor(angle / ((2 * Math.PI) / 60) + 0.5)
      clockworkState.detentIndexNearest = Math.round(angle / ((2 * Math.PI) / 60))
    }
    
    updateSector(seconds)
  }

  let dragging = false
  let lastMinute = -1
  let rafId: number | null = null
  
  // Clockwork interaction state
  const clockworkState = createClockworkState()
  
  // Animation loop for settle animation
  function animateSettle(): void {
    if (updateSettle(clockworkState)) {
      // Still animating - update display
      const seconds = angleToSeconds(clockworkState.angleDisplay, maxSeconds)
      const clampedSeconds = clamp(seconds, 0, maxSeconds)
      setSeconds(clampedSeconds)
      // Update display directly (bypass clockwork state update in update function)
      timeEl.textContent = formatTimerTime(clampedSeconds)
      updateSector(clampedSeconds)
      rafId = requestAnimationFrame(animateSettle)
    } else {
      // Animation complete
      rafId = null
      // Final update to sync everything
      const finalSeconds = angleToSeconds(clockworkState.angleDisplay, maxSeconds)
      const clampedSeconds = clamp(finalSeconds, 0, maxSeconds)
      setSeconds(clampedSeconds)
      update(clampedSeconds)
    }
  }


  function getCenter(rect: DOMRect): { x: number; y: number } {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
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
    const rect = interactive.getBoundingClientRect()
    const center = getCenter(rect)
    
    // Update clockwork state during drag
    // Returns true if a minute marker was crossed
    const minuteCrossed = updateDrag(
      clockworkState,
      ev.clientX,
      ev.clientY,
      center.x,
      center.y,
      maxSeconds
    )
    
    // Play sound when crossing a minute marker during drag
    if (minuteCrossed) {
      playSetTick()
      const currentSeconds = angleToSeconds(clockworkState.angleDisplay, maxSeconds)
      const currentMinute = Math.floor(currentSeconds / 60)
      if (currentMinute !== lastMinute) {
        onMinuteStep?.(currentMinute)
        lastMinute = currentMinute
      }
    }
    
    // Update seconds from display angle (magnetized during drag)
    const seconds = angleToSeconds(clockworkState.angleDisplay, maxSeconds)
    const clampedSeconds = clamp(seconds, 0, maxSeconds)
    
    const minute = Math.floor(clampedSeconds / 60)
    if (minute !== lastMinute) {
      lastMinute = minute
    }
    
    setSeconds(clampedSeconds)
    update(clampedSeconds)
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
      // Reset clockwork state
      clockworkState.angleRaw = 0
      clockworkState.angleDisplay = 0
      clockworkState.inSettleAnimation = false
      // Set a timeout to remove active state after a brief moment for visual feedback
      setTimeout(() => {
        interactive.classList.remove('knob-active')
      }, 150)
      return
    }

    // Remove any knob/hand states when starting to drag elsewhere
    interactive.classList.remove('knob-hover', 'knob-active', 'hand-hover')
    
    const rect = interactive.getBoundingClientRect()
    const center = getCenter(rect)
    const currentAngle = secondsToAngle(getSeconds(), maxSeconds)
    
    // Try to start clockwork drag (checks deadzone)
    if (!startDrag(clockworkState, ev.clientX, ev.clientY, center.x, center.y, currentAngle, maxSeconds)) {
      return // Deadzone - don't start drag
    }
    
    dragging = true
    interactive.classList.add('dragging')
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
    
    // Snap smoothly to nearest detent on release
    const { shouldPlaySound } = snapOnRelease(clockworkState, maxSeconds)
    
    // Play sound only if snapping forward to a minute not yet crossed
    if (shouldPlaySound) {
      playSetTick()
    }
    
    // Start smooth settle animation
    if (rafId === null) {
      rafId = requestAnimationFrame(animateSettle)
    }
    
    endDrag(clockworkState)
    dragging = false
    lastMinute = -1

    try {
      interactive.releasePointerCapture(ev.pointerId)
    } catch {
      // ignore
    }

    // Wait for settle animation to complete before starting timer
    const checkSettle = () => {
      if (!clockworkState.inSettleAnimation) {
        const seconds = getSeconds()
        if (seconds > 0) start()
        else pause()
      } else {
        requestAnimationFrame(checkSettle)
      }
    }
    requestAnimationFrame(checkSettle)
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
      updateCheckboxColor()
    },
    getColor(): ClockColor {
      return { ...currentColor }
    }
  }
}
