import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { join } from 'path'
import { existsSync, accessSync, constants } from 'fs'

// Get Electron executable path
function getElectronPath(): string | undefined {
  if (process.platform === 'win32') {
    return join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe')
  } else if (process.platform === 'darwin') {
    return join(process.cwd(), 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron')
  } else {
    return join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron')
  }
}

test('app launches and shows a window', async () => {
  const electronPath = getElectronPath()
  
  // Verify Electron executable exists and is accessible
  if (electronPath && !existsSync(electronPath)) {
    throw new Error(`Electron executable not found at: ${electronPath}\n` +
      `Current working directory: ${process.cwd()}\n` +
      `Platform: ${process.platform}\n` +
      `DISPLAY: ${process.env.DISPLAY || 'not set'}`)
  }
  
  if (electronPath) {
    try {
      accessSync(electronPath, constants.F_OK | constants.X_OK)
    } catch (err) {
      throw new Error(`Electron executable is not accessible or not executable: ${electronPath}\n` +
        `Error: ${err}`)
    }
  }

  const launchOptions: Parameters<typeof electron.launch>[0] = {
    args: [join(process.cwd(), 'dist', 'main', 'index.js')]
  }
  
  // Only specify executablePath if we have a valid path
  if (electronPath) {
    launchOptions.executablePath = electronPath
  }
  
  const app = await electron.launch(launchOptions)

  try {
    const page = await app.firstWindow()
    await expect(page).toHaveTitle(/RealPomo/i)

    // Basic UI sanity: timer display exists.
    await expect(page.locator('.timer-time')).toHaveText(/\d\d:\d\d/)
  } finally {
    await app.close()
  }
})
