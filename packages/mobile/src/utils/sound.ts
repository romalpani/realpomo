/**
 * Sound utilities for mobile.
 *
 * Uses expo-haptics for tactile feedback on minute ticks and a simple
 * oscillator-style chime for timer completion.  The Web Audio API is
 * not available in React Native, so we fall back to the Expo Audio API
 * when full audio is needed.  For now, haptic feedback gives immediate,
 * low-latency feedback for dial interactions while the chime is kept
 * simple.
 */

// Lazily loaded so this module can be imported on web/test environments
// where expo-haptics is unavailable.
let Haptics: typeof import('expo-haptics') | null = null

async function loadHaptics() {
  if (!Haptics) {
    try {
      Haptics = await import('expo-haptics')
    } catch {
      // expo-haptics not available (e.g. web)
    }
  }
  return Haptics
}

export async function playSetTick(): Promise<void> {
  const h = await loadHaptics()
  if (h) {
    await h.impactAsync(h.ImpactFeedbackStyle.Light)
  }
}

export async function playDoneHaptic(): Promise<void> {
  const h = await loadHaptics()
  if (h) {
    await h.notificationAsync(h.NotificationFeedbackType.Success)
  }
}
