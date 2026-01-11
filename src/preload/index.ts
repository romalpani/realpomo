import { contextBridge, ipcRenderer } from 'electron'

export type TimerApi = {
  notifyDone: () => void
  requestResize: (height: number) => void
}

export type UpdateApi = {
  checkForUpdates: () => void
  downloadUpdate: () => void
  installUpdate: () => void
  onUpdateStatus: (callback: (status: string, info?: unknown) => void) => () => void
}

const timerApi: TimerApi = {
  notifyDone: () => ipcRenderer.send('timer:done'),
  requestResize: (height: number) => ipcRenderer.send('window:resize', height)
}

const updateApi: UpdateApi = {
  checkForUpdates: () => ipcRenderer.send('update:check'),
  downloadUpdate: () => ipcRenderer.send('update:download'),
  installUpdate: () => ipcRenderer.send('update:install'),
  onUpdateStatus: (callback: (status: string, info?: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: string, info?: unknown) => {
      callback(status, info)
    }
    ipcRenderer.on('update:status', handler)
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('update:status', handler)
    }
  }
}

contextBridge.exposeInMainWorld('timerApi', timerApi)
contextBridge.exposeInMainWorld('updateApi', updateApi)
