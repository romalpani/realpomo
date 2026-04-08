export type ClockColor = {
  case: string
  knob: string
  sector: string
}

export const COLOR_PRESETS: ClockColor[] = [
  { case: '#FF6347', knob: '#FF7055', sector: '#CC4F38' }, // Tomato red (logo color, default)
  { case: '#7AB58E', knob: '#7BB68F', sector: '#1D5D3B' }, // Sage green
  { case: '#C9B99B', knob: '#D4C5A9', sector: '#8B6F47' }, // Warm beige
  { case: '#9DB4C0', knob: '#A8C0CC', sector: '#5A7A8A' }, // Soft blue
  { case: '#B0B0B0', knob: '#B8B8B8', sector: '#6B6B6B' }  // Muted gray
]
