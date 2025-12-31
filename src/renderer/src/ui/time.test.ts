import { describe, expect, it } from 'vitest'

import { formatTimerTime } from './time'

describe('formatTimerTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatTimerTime(0)).toBe('00:00')
    expect(formatTimerTime(5)).toBe('00:05')
    expect(formatTimerTime(65)).toBe('01:05')
    expect(formatTimerTime(25 * 60)).toBe('25:00')
  })

  it('clamps to 1 hour', () => {
    expect(formatTimerTime(60 * 60 + 12)).toBe('60:00')
  })
})
