import { useState, useCallback, useEffect } from 'react'
import { COLOR_PRESETS } from '@realpomo/core'
import type { ClockColor } from '@realpomo/core'

export { COLOR_PRESETS }
export type { ClockColor }

/**
 * Simple JSON file storage using expo-file-system would be ideal
 * for production, but for phase 2 we keep it in-memory only.
 * Persistence via AsyncStorage can be added as a follow-up.
 */

let cachedColor: ClockColor | null = null

export function useColorPicker(initialColor?: ClockColor) {
  const [color, setColorState] = useState<ClockColor>(
    cachedColor ?? initialColor ?? COLOR_PRESETS[0]
  )

  useEffect(() => {
    cachedColor = color
  }, [color])

  const setColor = useCallback((newColor: ClockColor) => {
    cachedColor = newColor
    setColorState(newColor)
  }, [])

  return { color, setColor }
}

