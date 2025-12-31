import { describe, expect, it, vi } from 'vitest'

import { createTimerEngine } from './timer'

type StepScheduler = {
  requestAnimationFrame: (cb: (ts: number) => void) => number
  cancelAnimationFrame: (id: number) => void
  step: (ms: number) => void
}

function createStepScheduler(): StepScheduler {
  let ts = 0
  let nextId = 1
  const queue: Array<{ id: number; cb: (ts: number) => void }> = []

  return {
    requestAnimationFrame(cb) {
      const id = nextId++
      queue.push({ id, cb })
      return id
    },
    cancelAnimationFrame(id) {
      const idx = queue.findIndex((q) => q.id === id)
      if (idx >= 0) queue.splice(idx, 1)
    },
    step(ms) {
      ts += ms
      const item = queue.shift()
      if (item) item.cb(ts)
    }
  }
}

describe('createTimerEngine', () => {
  it('ticks only when seconds change and calls onDone at 0', () => {
    const scheduler = createStepScheduler()

    const ticks: number[] = []
    const onDone = vi.fn()

    const timer = createTimerEngine({
      initialSeconds: 2,
      scheduler,
      onTick: ({ remainingSeconds }) => ticks.push(remainingSeconds),
      onDone
    })

    timer.reset(2)
    expect(ticks).toEqual([2])

    timer.start()

    // First RAF establishes baseline timestamp (dt = 0).
    scheduler.step(16)
    scheduler.step(1000)
    expect(ticks).toEqual([2, 1])
    expect(onDone).not.toHaveBeenCalled()

    scheduler.step(1000)
    expect(ticks).toEqual([2, 1, 0])
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(timer.isRunning()).toBe(false)
  })

  it('pause stops future ticks', () => {
    const scheduler = createStepScheduler()

    const ticks: number[] = []
    const onDone = vi.fn()

    const timer = createTimerEngine({
      initialSeconds: 3,
      scheduler,
      onTick: ({ remainingSeconds }) => ticks.push(remainingSeconds),
      onDone
    })

    timer.reset(3)
    timer.start()

    // First RAF establishes baseline timestamp (dt = 0).
    scheduler.step(16)
    scheduler.step(1000)
    timer.pause()

    scheduler.step(1000)
    scheduler.step(1000)

    expect(ticks).toEqual([3, 2])
    expect(onDone).not.toHaveBeenCalled()
    expect(timer.isRunning()).toBe(false)
  })
})
