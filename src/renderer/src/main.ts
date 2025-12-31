import './styles.css'
import { createTimerEngine } from './ui/timer'
import { playDoneChime, playSetTick } from './ui/sound'
import { createPomodoroClock } from './ui/clock'

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

timer.reset(initialSeconds)
clock.update(initialSeconds)
