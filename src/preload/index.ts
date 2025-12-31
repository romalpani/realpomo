import { contextBridge, ipcRenderer } from 'electron'

export type TimerApi = {
  notifyDone: () => void
}

const api: TimerApi = {
  notifyDone: () => ipcRenderer.send('timer:done')
}

contextBridge.exposeInMainWorld('timerApi', api)
