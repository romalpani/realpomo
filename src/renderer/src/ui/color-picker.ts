import type { ClockColor } from './clock'

export const COLOR_PRESETS: ClockColor[] = [
  { case: '#7AB58E', knob: '#7BB68F', sector: '#1D5D3B' }, // Sage green (default)
  { case: '#C9B99B', knob: '#D4C5A9', sector: '#8B6F47' }, // Warm beige
  { case: '#9DB4C0', knob: '#A8C0CC', sector: '#5A7A8A' }, // Soft blue
  { case: '#B0B0B0', knob: '#B8B8B8', sector: '#6B6B6B' }  // Muted gray
]

const STORAGE_KEY = 'realpomo-clock-color'

export function getStoredColor(): ClockColor | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ClockColor
      // Validate that it's a valid color preset
      if (parsed.case && parsed.knob && parsed.sector) {
        return parsed
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

export function storeColor(color: ClockColor): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(color))
  } catch {
    // Ignore storage errors
  }
}

type ColorPickerOptions = {
  onColorChange: (color: ClockColor) => void
  initialColor?: ClockColor
}

export function createColorPicker(options: ColorPickerOptions): HTMLElement {
  const { onColorChange, initialColor } = options

  const container = document.createElement('div')
  container.className = 'color-picker-container'

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'color-picker-button'
  button.setAttribute('aria-label', 'Change clock color')

  const menu = document.createElement('div')
  menu.className = 'color-picker-menu'
  menu.setAttribute('role', 'menu')
  menu.setAttribute('aria-hidden', 'true')

  let selectedColor = initialColor || COLOR_PRESETS[0]
  let isOpen = false

  function updateButtonColor(color: ClockColor): void {
    button.style.background = color.case
    button.style.borderColor = color.sector
  }

  function selectColor(color: ClockColor): void {
    selectedColor = color
    updateButtonColor(color)
    onColorChange(color)
    storeColor(color)
    closeMenu()
  }

  function openMenu(): void {
    isOpen = true
    menu.setAttribute('aria-hidden', 'false')
    menu.classList.add('open')
  }

  function closeMenu(): void {
    isOpen = false
    menu.setAttribute('aria-hidden', 'true')
    menu.classList.remove('open')
  }

  function toggleMenu(): void {
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  function handleClickOutside(e: MouseEvent): void {
    if (isOpen && !container.contains(e.target as Node)) {
      closeMenu()
    }
  }

  function handleEscapeKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && isOpen) {
      closeMenu()
    }
  }

  function handleWindowBlur(): void {
    container.classList.add('window-blurred')
    if (isOpen) {
      closeMenu()
    }
  }

  function handleWindowFocus(): void {
    container.classList.remove('window-blurred')
  }

  // Create color option buttons
  const colorOptionButtons: HTMLButtonElement[] = []
  COLOR_PRESETS.forEach((color, index) => {
    const option = document.createElement('button')
    option.type = 'button'
    option.className = 'color-picker-option'
    option.style.background = color.case
    option.setAttribute('role', 'menuitem')
    option.setAttribute('aria-label', `Color option ${index + 1}`)
    
    // Compare colors by checking all properties
    const isSelected = color.case === selectedColor.case && 
                       color.knob === selectedColor.knob && 
                       color.sector === selectedColor.sector
    if (isSelected) {
      option.classList.add('selected')
    }

    option.addEventListener('click', () => {
      selectColor(color)
      // Update selected state efficiently
      colorOptionButtons.forEach((opt) => opt.classList.remove('selected'))
      option.classList.add('selected')
    })

    colorOptionButtons.push(option)
    menu.appendChild(option)
  })

  updateButtonColor(selectedColor)

  button.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleMenu()
  })

  // Use capture phase for outside click detection to handle edge cases
  document.addEventListener('click', handleClickOutside, true)
  document.addEventListener('keydown', handleEscapeKey)
  window.addEventListener('blur', handleWindowBlur)
  window.addEventListener('focus', handleWindowFocus)

  // Check initial focus state
  if (!document.hasFocus()) {
    container.classList.add('window-blurred')
  }

  container.appendChild(button)
  container.appendChild(menu)

  return container
}

