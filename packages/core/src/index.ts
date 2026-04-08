export { clamp } from './math'
export { pad2, formatTimerTime } from './time'
export { createTimerEngine } from './timer'
export type { ClockColor } from './colors'
export { COLOR_PRESETS } from './colors'
export type { ClockworkState } from './clockwork'
export {
  createClockworkState,
  pointerToAngle,
  startDrag,
  updateDrag,
  snapOnRelease,
  startSettle,
  updateSettle,
  endDrag,
  angleToSeconds,
  secondsToAngle,
  snapToDetent,
  snapToDetentForCountdown
} from './clockwork'
