import { clamp } from './math'

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatTimerTime(seconds: number): string {
  const s = clamp(Math.round(seconds), 0, 60 * 60)
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`
}
