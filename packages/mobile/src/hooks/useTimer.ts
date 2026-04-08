import { useState, useRef, useCallback, useEffect } from 'react'
import { createTimerEngine } from '@realpomo/core'
import { AppState } from 'react-native'

type TimerState = {
  remainingSeconds: number
  isRunning: boolean
}

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    remainingSeconds: 0,
    isRunning: false
  })

  const engineRef = useRef(
    createTimerEngine({
      initialSeconds: 0,
      onTick: ({ remainingSeconds }) => {
        setState((prev) => ({ ...prev, remainingSeconds }))
      },
      onDone: () => {
        setState((prev) => ({ ...prev, isRunning: false, remainingSeconds: 0 }))
      }
    })
  )

  // Handle app state changes (background/foreground) for timer accuracy
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // When returning to foreground, the timer engine uses wall-clock
        // timing internally, so just trigger a UI refresh
        const engine = engineRef.current
        setState((prev) => ({
          ...prev,
          remainingSeconds: engine.getRemainingSeconds(),
          isRunning: engine.isRunning()
        }))
      }
    })
    return () => subscription.remove()
  }, [])

  const start = useCallback(() => {
    engineRef.current.start()
    setState((prev) => ({ ...prev, isRunning: true }))
  }, [])

  const pause = useCallback(() => {
    engineRef.current.pause()
    setState((prev) => ({
      ...prev,
      isRunning: false,
      remainingSeconds: engineRef.current.getRemainingSeconds()
    }))
  }, [])

  const setSeconds = useCallback((seconds: number) => {
    engineRef.current.setRemainingSeconds(seconds)
    setState((prev) => ({
      ...prev,
      remainingSeconds: engineRef.current.getRemainingSeconds()
    }))
  }, [])

  const reset = useCallback((seconds: number) => {
    engineRef.current.reset(seconds)
    setState({
      remainingSeconds: seconds,
      isRunning: false
    })
  }, [])

  return {
    remainingSeconds: state.remainingSeconds,
    isRunning: state.isRunning,
    start,
    pause,
    setSeconds,
    reset,
    getSeconds: () => engineRef.current.getRemainingSeconds()
  }
}
