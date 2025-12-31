import type { TimerApi } from '../../preload/index'

declare global {
  interface Window {
    timerApi?: TimerApi
  }
}

export {}
