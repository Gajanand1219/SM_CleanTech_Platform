import '../styles/panel.css'

export default function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">
        {label}
      </span>
      <span className="stat-card__value">
        {value}
      </span>
    </div>
  )
}
