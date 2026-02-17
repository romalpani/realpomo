import type { TimerApi, UpdateApi } from '../../preload/index'

declare global {
  interface Window {
    timerApi?: TimerApi
    updateApi?: UpdateApi
    platform?: string
    testUpdate?: (testNumber: number) => void
  }
}

export {}
