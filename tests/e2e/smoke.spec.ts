import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'

test('app launches and shows a window', async () => {
  const app = await electron.launch({
    args: ['dist/main/index.js']
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
