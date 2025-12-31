import { app, BrowserWindow, ipcMain, nativeImage, nativeTheme, Notification } from 'electron'
import { join } from 'node:path'
import log from 'electron-log/main'

log.initialize()

process.on('uncaughtException', (err) => {
  log.error('uncaughtException', err)
})

process.on('unhandledRejection', (reason) => {
  log.error('unhandledRejection', reason)
})

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 440,
    height: 580,
    useContentSize: true,
    resizable: false,
    show: false,
    backgroundColor: '#00000000',
    transparent: true,
    ...(process.platform === 'darwin'
      ? {
          vibrancy: 'under-window',
          visualEffectState: 'active'
        }
      : {}),
    ...(process.platform === 'win32'
      ? {
          // Windows 11+ (when supported) gives a native translucent material.
          // Falls back gracefully on older systems.
          backgroundMaterial: 'mica'
        }
      : {}),
    title: 'RealPomo',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  win.once('ready-to-show', () => win.show())

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })
}

app.whenReady().then(() => {
  // Helps Windows notifications and taskbar grouping.
  if (process.platform === 'win32') app.setAppUserModelId('com.realpomo.app')

  // Ensure nativeTheme is initialized early.
  void nativeTheme

  const mainWindow = createWindow()

  ipcMain.on('timer:done', () => {
    if (Notification.isSupported()) {
      const icon = nativeImage.createEmpty()
      new Notification({
        title: 'Timer complete',
        body: 'Nice work. Take a breath.',
        icon
      }).show()
    }

    mainWindow.flashFrame(true)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('render-process-gone', (_event, details) => {
    log.warn('render-process-gone', details)
  })

  app.on('child-process-gone', (_event, details) => {
    log.warn('child-process-gone', details)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
