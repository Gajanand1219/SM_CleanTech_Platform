import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import StatCard from '../components/StatCard'
import '../styles/AdminDashboard.css'

const WORKFLOW_STEPS = [
  { n: '01', t: 'Buyer submits', i: '📝' },
  { n: '02', t: 'Admin reviews', i: '👀' },
  { n: '03', t: 'Admin approves', i: '✅' },
  { n: '04', t: 'Vendors matched', i: '🎯' },
  { n: '05', t: 'Vendor quotes', i: '💰' },
  { n: '06', t: 'Buyer accepts', i: '🤝' },
  { n: '07', t: 'Contacts unlock', i: '🔓' },
]

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

        {/* ================= STATS ================= */}

        <section className="admin-dash__stats">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-skeleton" />
            ))
          ) : stats.length > 0 ? (
            stats.map(([k, v], i) => (
              <div
                key={k}
                className="stat-wrap"
                style={{ animationDelay: `${i * 0.05}s` }}
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
        </section>

        {/* ================= CONTROL CENTER ================= */}

        <section className="admin-dash__control">
          {/* Header */}
          <header className="admin-dash__head">
            <div className="admin-dash__head-text">
              <span className="admin-dash__eyebrow">
                ENQUIRY GOVERNANCE
              </span>
              <h2>Admin Control Center</h2>
              <p>
                Registration uses email OTP. Technical enquiries stay
                private until you approve them — approval then triggers
                vendor matching and notifications.
              </p>
            </div>

            <Link className="admin-dash__cta" to="/admin/enquiries">
              Review Enquiries
              <span>→</span>
            </Link>
          </header>

          {/* Workflow */}
          <div className="admin-dash__workflow">
            {WORKFLOW_STEPS.map((step, i) => (
              <div
                key={step.n}
                className="wf-step"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="wf-step__icon">{step.i}</div>
                <div className="wf-step__body">
                  <span className="wf-step__num">{step.n}</span>
                  <span className="wf-step__text">{step.t}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Notice */}
          <div className="admin-dash__notice">
            <span className="admin-dash__notice-icon">ℹ️</span>
            <p>
              <b>Flow:</b> Buyer submits → Admin reviews → Admin approves →
              matched vendors receive the masked dossier → Vendor quotes →
              Buyer accepts → Vendor accepts → Two-way handshake → contacts
              unlock.
            </p>
          </div>
        </section>

      </div>
    </PanelLayout>
  )
}
