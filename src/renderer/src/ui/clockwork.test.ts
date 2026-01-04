import { describe, expect, it } from 'vitest'

import { snapToDetent, snapToDetentForCountdown, angleToSeconds, secondsToAngle } from './clockwork'

describe('clockwork snapping behavior', () => {
  const maxSeconds = 60 * 60 // 1 hour

  describe('snapToDetent (for setting time)', () => {
    it('snaps to nearest minute marker', () => {
      // 9 minutes 31 seconds -> should snap to 10 minutes (nearest)
      const seconds = 9 * 60 + 31
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetent(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      const snappedMinutes = Math.floor(snappedSeconds / 60)
      expect(snappedMinutes).toBe(10)
    })

    it('snaps to nearest minute marker (rounding down)', () => {
      // 9 minutes 29 seconds -> should snap to 9 minutes (nearest)
      const seconds = 9 * 60 + 29
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetent(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      const snappedMinutes = Math.floor(snappedSeconds / 60)
      expect(snappedMinutes).toBe(9)
    })

    it('snaps exact minute to same minute', () => {
      // Exactly 10 minutes -> should stay at 10 minutes
      const seconds = 10 * 60
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetent(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      const snappedMinutes = Math.floor(snappedSeconds / 60)
      expect(snappedMinutes).toBe(10)
    })
  })

  describe('snapToDetentForCountdown (for countdown display)', () => {
    it('keeps hand at 10 minutes when time is 9:31', () => {
      // 9 minutes 31 seconds -> should show 10 minutes during countdown
      const seconds = 9 * 60 + 31
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetentForCountdown(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      const snappedMinutes = Math.floor(snappedSeconds / 60)
      expect(snappedMinutes).toBe(10)
    })

    it('keeps hand at 10 minutes when time is 9:29', () => {
      // 9 minutes 29 seconds -> should STILL show 10 minutes during countdown
      const seconds = 9 * 60 + 29
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetentForCountdown(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      const snappedMinutes = Math.floor(snappedSeconds / 60)
      expect(snappedMinutes).toBe(10)
    })

    it('keeps hand at 10 minutes when time is 9:01', () => {
      // 9 minutes 1 second -> should STILL show 10 minutes during countdown
      const seconds = 9 * 60 + 1
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetentForCountdown(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      const snappedMinutes = Math.floor(snappedSeconds / 60)
      expect(snappedMinutes).toBe(10)
    })

    it('snaps to 9 minutes only when time is exactly 9:00', () => {
      // Exactly 9 minutes -> should snap to 9 minutes
      const seconds = 9 * 60
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetentForCountdown(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      const snappedMinutes = Math.floor(snappedSeconds / 60)
      expect(snappedMinutes).toBe(9)
    })

    it('handles edge case at 1 second remaining', () => {
      // 1 second -> should show 1 minute during countdown
      const seconds = 1
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetentForCountdown(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      const snappedMinutes = Math.floor(snappedSeconds / 60)
      expect(snappedMinutes).toBe(1)
    })

    it('handles 0 seconds', () => {
      // 0 seconds -> should show 0 minutes
      const seconds = 0
      const angle = secondsToAngle(seconds, maxSeconds)
      const snappedAngle = snapToDetentForCountdown(angle)
      const snappedSeconds = angleToSeconds(snappedAngle, maxSeconds)
      expect(snappedSeconds).toBe(0)
    })
  })
})
