import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { join } from 'path'

// Get Electron executable path
function getElectronPath(): string {
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
  const app = await electron.launch({
    executablePath: electronPath,
    args: [join(process.cwd(), 'dist', 'main', 'index.js')]
  })

  try {
    const page = await app.firstWindow()
    await expect(page).toHaveTitle(/RealPomo/i)

    // Basic UI sanity: timer display exists.
    await expect(page.locator('.timer-time')).toHaveText(/\d\d:\d\d/)
  } finally {
    await app.close()
  }
})
