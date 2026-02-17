import './styles.css'
import { createTimerEngine } from './ui/timer'
import { playDoneChime, playSetTick } from './ui/sound'
import { createPomodoroClock } from './ui/clock'
import { createColorPicker, getStoredColor, COLOR_PRESETS } from './ui/color-picker'
import { createUpdateNotification } from './ui/update-notification'

// On Windows, account for the titlebar overlay height
if (window.platform === 'win32') {
  document.documentElement.style.setProperty('--chrome-h', '32px')
}

const host = document.getElementById('app')
if (!host) throw new Error('App host missing')

const initialSeconds = 0

const timer = createTimerEngine({
  initialSeconds,
  onTick: ({ remainingSeconds }) => {
    clock.update(remainingSeconds)
  },
  onDone: () => {
    playDoneChime()
    window.timerApi?.notifyDone()
    document.body.classList.add('done')
    setTimeout(() => document.body.classList.remove('done'), 1600)
  }
})

const storedColor = getStoredColor()
const initialColor = storedColor || COLOR_PRESETS[0]

const clock = createPomodoroClock({
  host,
  maxSeconds: 60 * 60,
  getSeconds: () => timer.getRemainingSeconds(),
  setSeconds: (seconds) => timer.setRemainingSeconds(seconds),
  start: () => timer.start(),
  pause: () => timer.pause(),
  canEdit: () => true,
  isRunning: () => timer.isRunning(),
  onMinuteStep: () => playSetTick()
})

// Apply initial color
clock.setColor(initialColor)

// Add color picker to the top chrome area
const shell = host.querySelector('.shell')
if (shell) {
  const colorPicker = createColorPicker({
    initialColor,
    onColorChange: (color) => {
      clock.setColor(color)
    }
  })
  shell.appendChild(colorPicker)
}

timer.reset(initialSeconds)
clock.update(initialSeconds)

// Set up update notification
let updateNotification: ReturnType<typeof createUpdateNotification> | null = null

if (window.updateApi) {
  updateNotification = createUpdateNotification({
    onCheckForUpdates: () => window.updateApi?.checkForUpdates(),
    onDownloadUpdate: () => window.updateApi?.downloadUpdate(),
    onInstallUpdate: () => window.updateApi?.installUpdate()
  })

  // Add update notification to the app
  host.appendChild(updateNotification.element)

  // Listen for update status changes
  window.updateApi.onUpdateStatus((status) => {
    updateNotification?.handleStatus(status)
  })

  // Check for updates on startup (only in production)
  if (import.meta.env.PROD) {
    // Small delay to let the app fully load
    setTimeout(() => {
      window.updateApi?.checkForUpdates()
    }, 2000)
  }
}

// Dev mode: Expose test functions for update notification
if (import.meta.env.DEV && updateNotification) {
  const notif = updateNotification

  const testUpdateNotification = (testNumber: number): void => {
    switch (testNumber) {
      case 1:
        notif.handleStatus('downloaded')
        console.log('🧪 Testing: Update available [Install]')
        break
      case 2:
        notif.hide()
        console.log('🧪 Testing: Hide notification')
        break
      default:
        console.log('🧪 Available: 1 = Show, 2 = Hide')
    }
  }

  // Expose to window for console testing
  ;(window as unknown as { testUpdate?: (n: number) => void }).testUpdate = testUpdateNotification

  // Keyboard shortcuts for testing (Cmd/Ctrl + Shift + 1 or 2)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
      const num = parseInt(e.key)
      if (num === 1 || num === 2) {
        e.preventDefault()
        testUpdateNotification(num)
      }
    }
  })

  console.log('🧪 Update test: Cmd+Shift+1 (show) or 2 (hide)')
}
