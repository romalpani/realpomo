import './styles.css'
import { createTimerEngine } from './ui/timer'
import { playDoneChime, playSetTick } from './ui/sound'
import { createPomodoroClock } from './ui/clock'
import { createColorPicker, getStoredColor, COLOR_PRESETS } from './ui/color-picker'

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
