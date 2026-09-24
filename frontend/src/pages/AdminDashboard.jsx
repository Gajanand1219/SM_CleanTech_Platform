import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import StatCard from '../components/StatCard'
import '../styles/AdminDashboard.css'

export default function AdminDashboard() {
  const [data, setData] = useState({ stats: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/admin/dashboard')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  const stats = Object.entries(data.stats || {})

  return (
    <PanelLayout role="admin" title="Platform Administration">
      <div className="admin-dash">

        {/* STATS GRID */}
        <div className="admin-dash__stats">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-skeleton" />
            ))
          ) : stats.length > 0 ? (
            stats.map(([k, v], i) => (
              <div
                key={k}
                className="stat-wrap"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <StatCard
                  label={k.replaceAll('_', ' ')}
                  value={v}
                />
              </div>
            ))
          ) : (
            <div className="admin-dash__empty">No stats available yet.</div>
          )}
        </div>

        {/* CONTROL CENTER */}
        <div className="panel-card admin-dash__control">
          <div className="card-head">
            <div>
              <span className="eyebrow">Enquiry governance</span>
              <h2>Admin control center</h2>
              <p className="muted">
                Registration uses email OTP. Technical enquiries are private
                until you approve them. Approval then creates matching vendor
                suggestions and sends notifications.
              </p>
            </div>

            <Link className="primary small" to="/admin/enquiries">
              Review Enquiries
              <span>→</span>
            </Link>
          </div>

          {/* WORKFLOW TIMELINE */}
          <div className="workflow-strip">
            {[
              { n: '01', t: 'Buyer submits', i: '📝' },
              { n: '02', t: 'Admin reviews', i: '👀' },
              { n: '03', t: 'Admin approves', i: '✅' },
              { n: '04', t: 'Vendors matched', i: '🎯' },
              { n: '05', t: 'Vendor quotes', i: '💰' },
              { n: '06', t: 'Buyer accepts', i: '🤝' },
              { n: '07', t: 'Contacts unlock', i: '🔓' },
            ].map((step, i) => (
              <div
                key={step.n}
                className="workflow-step"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="workflow-step__icon">{step.i}</div>
                <div className="workflow-step__num">{step.n}</div>
                <div className="workflow-step__text">{step.t}</div>
              </div>
            ))}
          </div>

          <div className="notice">
            <span className="notice-icon">ℹ️</span>
            <div>
              <b>Workflow:</b> Buyer submits → Admin reviews → Admin approves →
              matching vendors receive the masked dossier → Vendor quotes → Buyer
              accepts → Vendor accepts → Two-way handshake → contacts unlock.
            </div>
          </div>
        </div>

      </div>
    </PanelLayout>
  )
}