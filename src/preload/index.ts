import { contextBridge, ipcRenderer } from 'electron'

export type TimerApi = {
  notifyDone: () => void
  requestResize: (height: number) => void
}

const api: TimerApi = {
  notifyDone: () => ipcRenderer.send('timer:done'),
  requestResize: (height: number) => ipcRenderer.send('window:resize', height)
}

contextBridge.exposeInMainWorld('timerApi', api)
