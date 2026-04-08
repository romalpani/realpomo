import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import type { ClockColor } from '@realpomo/core'

type TimerControlsProps = {
  isRunning: boolean
  remainingSeconds: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
  color: ClockColor
}

export default function TimerControls({
  isRunning,
  remainingSeconds,
  onStart,
  onPause,
  onReset,
  color
}: TimerControlsProps) {
  const canStart = remainingSeconds > 0 && !isRunning
  const canPause = isRunning

  return (
    <View style={styles.container}>
      {canPause ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: color.sector }]}
          onPress={onPause}
          activeOpacity={0.7}
          accessibilityLabel="Pause timer"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Pause</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: canStart ? color.sector : '#cccccc',
              opacity: canStart ? 1 : 0.5
            }
          ]}
          onPress={canStart ? onStart : undefined}
          disabled={!canStart}
          activeOpacity={0.7}
          accessibilityLabel="Start timer"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      )}

      {(remainingSeconds > 0 || isRunning) && (
        <TouchableOpacity
          style={[styles.resetButton]}
          onPress={onReset}
          activeOpacity={0.7}
          accessibilityLabel="Reset timer"
          accessibilityRole="button"
        >
          <Text style={[styles.resetText, { color: color.sector }]}>Reset</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    minWidth: 120,
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600'
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500'
  }
})
