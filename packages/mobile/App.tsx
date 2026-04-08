import React, { useCallback } from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import ClockFace from './src/components/ClockFace'
import TimerControls from './src/components/TimerControls'
import TimeSetter from './src/components/TimeSetter'
import ColorPicker from './src/components/ColorPicker'
import { useTimer } from './src/hooks/useTimer'
import { useColorPicker } from './src/hooks/useColorPicker'
import { playDoneHaptic } from './src/utils/sound'

const MAX_SECONDS = 60 * 60 // 1 hour max, same as desktop

export default function App() {
  const timer = useTimer()
  const { color, setColor } = useColorPicker()

  const handleSetMinutes = useCallback(
    (minutes: number) => {
      timer.setSeconds(minutes * 60)
    },
    [timer]
  )

  const handleReset = useCallback(() => {
    timer.reset(0)
  }, [timer])

  const handleStart = useCallback(() => {
    timer.start()
  }, [timer])

  const handlePause = useCallback(() => {
    timer.pause()
  }, [timer])

  // Check if timer just completed (for haptic feedback)
  const prevRunningRef = React.useRef(false)
  React.useEffect(() => {
    if (prevRunningRef.current && !timer.isRunning && timer.remainingSeconds === 0) {
      playDoneHaptic().catch(() => {
        // Ignore haptic errors
      })
    }
    prevRunningRef.current = timer.isRunning
  }, [timer.isRunning, timer.remainingSeconds])

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.clockContainer}>
          <ClockFace
            remainingSeconds={timer.remainingSeconds}
            maxSeconds={MAX_SECONDS}
            color={color}
            size={280}
          />
        </View>

        <TimerControls
          isRunning={timer.isRunning}
          remainingSeconds={timer.remainingSeconds}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          color={color}
        />

        <TimeSetter
          onSetMinutes={handleSetMinutes}
          isRunning={timer.isRunning}
          color={color}
        />

        <ColorPicker selectedColor={color} onColorChange={setColor} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  clockContainer: {
    marginBottom: 8
  }
})
