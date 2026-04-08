import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import type { ClockColor } from '@realpomo/core'

type TimeSetterProps = {
  onSetMinutes: (minutes: number) => void
  isRunning: boolean
  color: ClockColor
}

const PRESET_MINUTES = [5, 10, 15, 20, 25, 30, 45, 60]

export default function TimeSetter({
  onSetMinutes,
  isRunning,
  color
}: TimeSetterProps) {
  if (isRunning) return null

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Set Timer</Text>
      <View style={styles.presets}>
        {PRESET_MINUTES.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.preset, { borderColor: color.case }]}
            onPress={() => onSetMinutes(m)}
            activeOpacity={0.7}
            accessibilityLabel={`Set ${m} minutes`}
            accessibilityRole="button"
          >
            <Text style={[styles.presetText, { color: color.sector }]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 32
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    fontWeight: '500'
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20
  },
  preset: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600'
  }
})
