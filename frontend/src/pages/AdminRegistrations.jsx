import { useEffect, useState } from 'react'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import '../styles/AdminRegistrations.css'

export default function AdminRegistrations() {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await API.get('/admin/registrations')
      setRows(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const block = async (id) => {
    setMsg('')
    setBusy(id)

    try {
      await API.put(`/admin/registrations/${id}`, {
        status: 'blocked',
        note: 'Blocked by platform administrator.',
      })

      setMsg('Account blocked successfully.')
      setMsgType('success')
      await load()
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Unable to update account.')
      setMsgType('error')
    } finally {
      setBusy(null)
    }
  }

  const deleteAccount = async (id, role, name) => {
  const confirmed = window.confirm(
    `Are you sure you want to permanently delete ${role} "${name}"?`
  )

  if (!confirmed) return

  setMsg('')
  setBusy(`delete-${id}`)

  try {
    await API.delete(`/admin/registrations/${id}`)

    setMsg(
      `${role.charAt(0).toUpperCase() + role.slice(1)} account deleted successfully.`
    )
    setMsgType('success')

    await load()
  } catch (err) {
    setMsg(
      err.response?.data?.detail ||
      'Unable to delete account.'
    )
    setMsgType('error')
  } finally {
    setBusy(null)
  }
}


  const filtered = rows.filter((r) => {
    if (filter !== 'all' && r.role !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        (r.company_name || '').toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = {
    all: rows.length,
    buyer: rows.filter((r) => r.role === 'buyer').length,
    vendor: rows.filter((r) => r.role === 'vendor').length,
  }

  const statusClass = (s) =>
    ({
      active: 'reg-status--active',
      blocked: 'reg-status--blocked',
      pending: 'reg-status--pending',
    }[s] || 'reg-status--default')

  return (
    <PanelLayout role="admin" title="Registered Participants">
      <div className="admin-reg">

        {/* ============ MAIN CARD ============ */}
        <div className="panel-card admin-reg__card">
          <div className="card-head">
            <div>
              <span className="eyebrow">OTP-based onboarding</span>
              <h2>Buyer &amp; Vendor accounts</h2>
              <p className="muted">
                Registration does not require admin approval. Email OTP activates
                buyer/vendor accounts. Admin approval is reserved for technical
                enquiries.
              </p>
            </div>

            <div className="reg-summary">
              <div className="reg-summary__item">
                <span className="reg-summary__num">{counts.buyer}</span>
                <span className="reg-summary__label">Buyers</span>
              </div>
              <div className="reg-summary__divider" />
              <div className="reg-summary__item">
                <span className="reg-summary__num">{counts.vendor}</span>
                <span className="reg-summary__label">Vendors</span>
              </div>
            </div>
          </div>

          {/* Message */}
          {msg && (
            <div
              className={`message ${
                msgType === 'success'
                  ? 'message--success'
                  : 'message--error'
              }`}
            >
              <span className="message__icon">
                {msgType === 'success' ? '✓' : '!'}
              </span>
              <span>{msg}</span>
              <button
                type="button"
                className="message__close"
                onClick={() => setMsg('')}
              >
                ×
              </button>
            </div>
          )}

          {/* Filter bar */}
          <div className="reg-toolbar">
            <div className="reg-filters">
              {[
                { key: 'all', label: 'All', count: counts.all },
                { key: 'buyer', label: 'Buyers', count: counts.buyer },
                { key: 'vendor', label: 'Vendors', count: counts.vendor },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`reg-filter ${
                    filter === f.key ? 'reg-filter--active' : ''
                  }`}
                  onClick={() => setFilter(f.key)}
                >
                  <span>{f.label}</span>
                  <span className="reg-filter__count">{f.count}</span>
                </button>
              ))}
            </div>

            <div className="reg-search">
              <span className="reg-search__icon">🔍</span>
              <input
                type="text"
                placeholder="Search name, company or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="reg-skeletons">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="reg-skeleton" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="reg-table">
              <div className="reg-table__head">
                <span>Participant</span>
                <span>Role</span>
                <span>OTP</span>
                <span>Status</span>
                <span></span>
              </div>

              {filtered.map((r, i) => (
                <div
                  className="reg-table__row"
                  key={r.id}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Participant */}
                  <div className="reg-table__cell reg-table__cell--main">
                    <div
                      className={`reg-avatar reg-avatar--${r.role}`}
                    >
                      {(r.company_name || r.name || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="reg-info">
                      <strong>{r.company_name || r.name}</strong>
                      <span className="muted">{r.email}</span>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="reg-table__cell">
                    <span className={`role-pill role-pill--${r.role}`}>
                      {r.role === 'buyer' ? '🏢' : '🌱'} {r.role}
                    </span>
                  </div>

                  {/* OTP */}
                  <div className="reg-table__cell">
                    <span
                      className={`otp-pill ${
                        r.email_verified
                          ? 'otp-pill--verified'
                          : 'otp-pill--pending'
                      }`}
                    >
                      <span className="otp-pill__dot" />
                      {r.email_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="reg-table__cell">
                    <span
                      className={`reg-status ${statusClass(r.status)}`}
                    >
                      <span className="reg-status__dot" />
                      {r.status}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="reg-table__cell reg-table__cell--action">

                    {r.status !== 'blocked' ? (
                      <button
                        className="btn-block"
                        disabled={busy === r.id}
                        onClick={() => block(r.id)}
                        title="Block account"
                      >
                        {busy === r.id ? (
                          <>
                            <span className="spinner spinner--accent" />
                            Blocking…
                          </>
                        ) : (
                          <>
                            <span>⛔</span>
                            Block
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="reg-locked">
                        Locked
                      </span>
                    )}

                    {/* DELETE */}
                    <button
                      type="button"
                      className="btn-delete"
                      disabled={busy === `delete-${r.id}`}
                      onClick={() =>
                        deleteAccount(
                          r.id,
                          r.role,
                          r.company_name || r.name || r.email
                        )
                      }
                      title={`Delete ${r.role}`}
                    >
                      {busy === `delete-${r.id}` ? (
                        <span className="spinner" />
                      ) : (
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      )}
                    </button>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="reg-empty">
              <div className="reg-empty__icon">👥</div>
              <h3>
                {search || filter !== 'all'
                  ? 'No matching accounts'
                  : 'No buyer/vendor accounts yet'}
              </h3>
              <p className="muted">
                {search || filter !== 'all'
                  ? 'Try adjusting your search or filter.'
                  : 'Registered accounts will appear here once users complete OTP.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  )
}