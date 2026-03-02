import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { COLOR_PRESETS } from '@realpomo/core'
import type { ClockColor } from '@realpomo/core'

type ColorPickerProps = {
  selectedColor: ClockColor
  onColorChange: (color: ClockColor) => void
}

export default function ColorPicker({
  selectedColor,
  onColorChange
}: ColorPickerProps) {
  return (
    <View style={styles.container}>
      {COLOR_PRESETS.map((color, index) => {
        const isSelected =
          color.case === selectedColor.case &&
          color.knob === selectedColor.knob &&
          color.sector === selectedColor.sector

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.swatch,
              { backgroundColor: color.case, borderColor: color.sector },
              isSelected && styles.selected
            ]}
            onPress={() => onColorChange(color)}
            activeOpacity={0.7}
            accessibilityLabel={`Color option ${index + 1}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2
  },
  selected: {
    borderWidth: 3,
    transform: [{ scale: 1.15 }]
  }
})
