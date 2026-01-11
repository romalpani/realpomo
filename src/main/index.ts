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

  // Fallback: show window after a timeout if ready-to-show doesn't fire
  const showTimeout = setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      log.warn('Window not shown after timeout, forcing show')
      win.show()
    }
  }, 3000)

  // Show window when ready
  win.once('ready-to-show', () => {
    clearTimeout(showTimeout)
    log.info('Window ready-to-show, showing window')
    if (!win.isDestroyed()) {
      win.show()
      log.info('Window shown')
    }
  })

  // Log when window is actually shown
  win.on('show', () => {
    log.info('Window show event fired')
  })

  // Handle page load errors
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    log.error('Failed to load page', { errorCode, errorDescription, validatedURL })
    if (!win.isDestroyed()) {
      win.show() // Show window even on error so user can see what happened
    }
  })

  // Handle renderer process crashes
  win.webContents.on('render-process-gone', (_event, details) => {
    log.error('Renderer process gone', details)
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL).catch((err) => {
      log.error('Failed to load URL', err)
      if (!win.isDestroyed()) {
        win.show()
      }
    })
  } else {
    const htmlPath = join(__dirname, '../renderer/index.html')
    log.info('Loading HTML file', htmlPath)
    void win.loadFile(htmlPath).catch((err) => {
      log.error('Failed to load HTML file', { err, htmlPath })
      if (!win.isDestroyed()) {
        win.show()
      }
    })
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
  log.info('App ready, creating window...')
  
  // Helps Windows notifications and taskbar grouping.
  if (process.platform === 'win32') app.setAppUserModelId('com.realpomo.app')

  // Ensure nativeTheme is initialized early.
  void nativeTheme

  const mainWindow = createWindow()
  log.info('Window created', { id: mainWindow.id })

  // Store reference for IPC handler
  let mainWindowRef: BrowserWindow | null = mainWindow
  
  mainWindow.on('closed', () => {
    log.info('Main window closed')
    mainWindowRef = null
  })

  ipcMain.on('timer:done', () => {
    if (Notification.isSupported()) {
      const icon = nativeImage.createEmpty()
      new Notification({
        title: 'Timer complete',
        body: 'Nice work. Take a breath.',
        icon
      }).show()
    }

    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.flashFrame(true)
    }
  })

  ipcMain.on('window:resize', (_event, height: number) => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      const currentSize = mainWindowRef.getSize()
      const currentPos = mainWindowRef.getPosition()
      // Store top position before resize
      const topBeforeResize = currentPos[1]
      
      // Resize the window (this may move the top position)
      mainWindowRef.setSize(currentSize[0], height, false)
      
      // Get position after resize
      const posAfterResize = mainWindowRef.getPosition()
      
      // Calculate how much the top moved and restore it
      const topMoved = posAfterResize[1] - topBeforeResize
      if (topMoved !== 0) {
        // Restore original top position (grow/shrink from bottom)
        mainWindowRef.setPosition(posAfterResize[0], topBeforeResize, false)
      }
    }
  })

  app.on('activate', () => {
    log.info('App activated')
    if (BrowserWindow.getAllWindows().length === 0) {
      log.info('No windows, creating new one')
      mainWindowRef = createWindow()
    }
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
