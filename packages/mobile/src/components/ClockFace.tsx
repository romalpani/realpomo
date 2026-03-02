import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Line, Path, G, Text as SvgText } from 'react-native-svg'
import {
  formatTimerTime,
  secondsToAngle,
  snapToDetentForCountdown
} from '@realpomo/core'
import type { ClockColor } from '@realpomo/core'

type ClockFaceProps = {
  remainingSeconds: number
  maxSeconds: number
  color: ClockColor
  size: number
}

const TICK_COUNT = 60

export default function ClockFace({
  remainingSeconds,
  maxSeconds,
  color,
  size
}: ClockFaceProps) {
  const cx = 50
  const cy = 50
  const radius = 42
  const tickOuterR = 42
  const tickInnerMajor = 37
  const tickInnerMinor = 39.5

  // Calculate hand angle
  const rawAngle = secondsToAngle(remainingSeconds, maxSeconds)
  const handAngle = snapToDetentForCountdown(rawAngle)

  // Hand endpoint
  const handLength = 30
  const hx = cx + handLength * Math.sin(handAngle)
  const hy = cy - handLength * Math.cos(handAngle)

  // Sector arc (filled pie from 12 o'clock to hand)
  const sectorPath = remainingSeconds > 0 ? buildSectorPath(cx, cy, radius, handAngle) : ''

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Clock case background */}
      <View
        style={[
          styles.clockCase,
          { backgroundColor: color.case, borderRadius: size / 2 }
        ]}
      />

      <Svg width={size} height={size} viewBox="0 0 100 100" style={styles.svg}>
        {/* Clock face */}
        <Circle cx={cx} cy={cy} r={radius} fill="#FFFFFF" />

        {/* Sector (filled time remaining) */}
        {remainingSeconds > 0 && (
          <Path d={sectorPath} fill={color.sector} opacity={0.85} />
        )}

        {/* Tick marks */}
        <G>
          {Array.from({ length: TICK_COUNT }, (_, i) => {
            const angle = (i * 2 * Math.PI) / TICK_COUNT
            const isMajor = i % 5 === 0
            const innerR = isMajor ? tickInnerMajor : tickInnerMinor
            const x1 = cx + innerR * Math.sin(angle)
            const y1 = cy - innerR * Math.cos(angle)
            const x2 = cx + tickOuterR * Math.sin(angle)
            const y2 = cy - tickOuterR * Math.cos(angle)
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#000000"
                strokeWidth={isMajor ? 0.8 : 0.4}
                strokeLinecap="round"
              />
            )
          })}
        </G>

        {/* Clock hand */}
        {remainingSeconds > 0 && (
          <>
            <Line
              x1={cx}
              y1={cy}
              x2={hx}
              y2={hy}
              stroke="#333333"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
            {/* Center knob */}
            <Circle cx={cx} cy={cy} r={3} fill={color.knob} />
          </>
        )}

        {/* Center knob when idle */}
        {remainingSeconds === 0 && (
          <Circle cx={cx} cy={cy} r={3} fill={color.knob} />
        )}

        {/* Time text */}
        <SvgText
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          fontSize="6"
          fill="#333333"
          fontWeight="600"
        >
          {formatTimerTime(remainingSeconds)}
        </SvgText>
      </Svg>
    </View>
  )
}

function buildSectorPath(
  cx: number,
  cy: number,
  r: number,
  endAngle: number
): string {
  // Arc from 12 o'clock (0 rad) to endAngle
  const startX = cx
  const startY = cy - r
  const endX = cx + r * Math.sin(endAngle)
  const endY = cy - r * Math.cos(endAngle)
  const largeArc = endAngle > Math.PI ? 1 : 0

  return [
    `M ${cx} ${cy}`,
    `L ${startX} ${startY}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`,
    'Z'
  ].join(' ')
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clockCase: {
    position: 'absolute',
    width: '108%',
    height: '108%',
    top: '-4%',
    left: '-4%'
  },
  svg: {
    position: 'absolute'
  }
})
