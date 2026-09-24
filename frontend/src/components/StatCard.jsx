import '../styles/panel.css'

/**
 * StatCard — Colorful auto-themed stat card
 * Automatically picks a color based on the label keyword.
 */
const COLOR_MAP = [
  { match: ['pending', 'awaiting', 'waiting'], color: '#fbbf24' },     // yellow
  { match: ['approved', 'verified', 'active'], color: '#4ade80' },     // green
  { match: ['rejected', 'blocked', 'failed'], color: '#f87171' },      // red
  { match: ['buyer'], color: '#38bdf8' },                              // blue
  { match: ['vendor', 'provider'], color: '#a78bfa' },                 // purple
  { match: ['enquir', 'request'], color: '#fb923c' },                  // orange
  { match: ['quot', 'proposal'], color: '#22d3ee' },                   // cyan
  { match: ['match'], color: '#f472b6' },                              // pink
  { match: ['user', 'account', 'participant'], color: '#818cf8' },     // indigo
  { match: ['total', 'all'], color: '#00d4aa' },                       // teal
]

function pickColor(label = '') {
  const lower = label.toLowerCase()
  for (const { match, color } of COLOR_MAP) {
    if (match.some((m) => lower.includes(m))) return color
  }
  return '#00d4aa'
}

export default function StatCard({ label, value }) {
  const color = pickColor(label)

  return (
    <div
      className="stat"
      style={{ '--stat-color': color }}
    >
      <div className="stat__glow" />
      <div className="stat__top">
        <div className="stat-value">{value ?? '—'}</div>
        <span className="stat__dot" />
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}