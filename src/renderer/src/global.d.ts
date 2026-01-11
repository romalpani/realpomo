import type { TimerApi, UpdateApi } from '../../preload/index'

declare global {
  interface Window {
    timerApi?: TimerApi
    updateApi?: UpdateApi
    testUpdate?: (testNumber: number) => void
  }
}

export {}
