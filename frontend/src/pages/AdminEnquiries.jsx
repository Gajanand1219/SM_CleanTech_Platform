import { useEffect, useState } from 'react'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import '../styles/AdminEnquiries.css'

export default function AdminEnquiries() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('info')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await API.get('/admin/enquiries')
      setRows(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const open = async (id) => {
    setMsg('')
    const r = await API.get(`/admin/enquiries/${id}`)
    setSelected(r.data)
    setNote('')
    // Smooth scroll to review section
    setTimeout(() => {
      document.querySelector('.admin-review')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
  }

  const closeReview = () => {
    setSelected(null)
    setNote('')
    setMsg('')
  }

  const approval = async (status) => {
    if (!selected) return

    setBusy(selected.id)
    setMsg('')

    try {
      const r = await API.post(`/admin/enquiries/${selected.id}/approval`, {
        status,
        note,
      })

      setMsg(
        status === 'approved'
          ? `✓ Approved. ${r.data.matched_vendors} matching vendor suggestion(s) created and notified.`
          : '✓ Enquiry rejected and buyer notified.'
      )
      setMsgType('success')

      setSelected(null)
      await load()
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Unable to update enquiry.')
      setMsgType('error')
    } finally {
      setBusy(null)
    }
  }

  const statusClass = (s) =>
    ({
      submitted: 'status--submitted',
      approved: 'status--approved',
      rejected: 'status--rejected',
      quoted: 'status--quoted',
      closed: 'status--closed',
    }[s] || 'status--default')

  return (
    <PanelLayout role="admin" title="Enquiry Approval & Matching">
      <div className="admin-enq">

        {/* ============ LIST CARD ============ */}
        <div className="panel-card admin-enq__list">
          <div className="card-head">
            <div>
              <span className="eyebrow">Admin controlled workflow</span>
              <h2>Technical enquiries</h2>
              <p className="muted">
                Buyer submissions stay private and are not sent to vendors until
                you approve them. Approval creates up to 10 matching vendor suggestions.
              </p>
            </div>

            <div className="enq-counter">
              <span className="enq-counter__num">{rows.length}</span>
              <span className="enq-counter__label">Total</span>
            </div>
          </div>

          {msg && (
            <div
              className={`message ${
                msgType === 'success'
                  ? 'message--success'
                  : msgType === 'error'
                  ? 'message--error'
                  : 'message--info'
              }`}
            >
              <span className="message__icon">
                {msgType === 'success' ? '✓' : msgType === 'error' ? '!' : 'ℹ'}
              </span>
              <span>{msg}</span>
              <button
                type="button"
                onClick={() => setMsg('')}
                className="message__close"
              >
                ×
              </button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="enq-skeletons">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="enq-skeleton" />
              ))}
            </div>
          ) : rows.length > 0 ? (
            <div className="enq-table">
              <div className="enq-table__head">
                <span>Enquiry</span>
                <span>Domain</span>
                <span>Status</span>
                <span>Activity</span>
                <span></span>
              </div>

              {rows.map((r, i) => (
                <div
                  className="enq-table__row"
                  key={r.id}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="enq-table__cell enq-table__cell--main">
                    <div className="enq-id">#{r.id}</div>
                    <div>
                      <strong>{r.title}</strong>
                      <span className="muted">{r.buyer}</span>
                    </div>
                  </div>

                  <div className="enq-table__cell">
                    <span className="enq-domain">{r.domain}</span>
                  </div>

                  <div className="enq-table__cell">
                    <span className={`status-pill ${statusClass(r.status)}`}>
                      <span className="status-pill__dot" />
                      {r.status}
                    </span>
                  </div>

                  <div className="enq-table__cell">
                    <span className="enq-activity">
                      <b>{r.matches}</b> matches · <b>{r.quotations}</b> quotes
                    </span>
                  </div>

                  <div className="enq-table__cell enq-table__cell--action">
                    <button
                      className="btn-review"
                      onClick={() => open(r.id)}
                    >
                      <span>Review</span>
                      <span className="btn-review__arrow">→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="enq-empty">
              <div className="enq-empty__icon">📭</div>
              <h3>No enquiries submitted yet</h3>
              <p className="muted">Enquiries will appear here once buyers submit them.</p>
            </div>
          )}
        </div>

        {/* ============ REVIEW PANEL ============ */}
        {selected && (
          <div className="panel-card admin-review">
            <div className="card-head">
              <div>
                <span className="eyebrow">Review #{selected.id}</span>
                <h2>{selected.title}</h2>
                <p className="muted">
                  {selected.domain} · {selected.problem} · Buyer: {selected.buyer}
                </p>
              </div>

              <div className="admin-review__head-right">
                <span className={`status-pill ${statusClass(selected.status)}`}>
                  <span className="status-pill__dot" />
                  {selected.status}
                </span>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReview}
                  aria-label="Close review"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Dossier */}
            <div className="admin-review__section">
              <div className="admin-review__section-title">
                <span className="admin-review__section-icon">📄</span>
                Technical Dossier
              </div>
              <pre className="dossier">
                {selected.dossier || 'No dossier data available.'}
              </pre>
            </div>

            {/* Existing matches */}
            {selected.matches?.length > 0 && (
              <div className="admin-review__section">
                <div className="admin-review__section-title">
                  <span className="admin-review__section-icon">🎯</span>
                  Existing Matching Suggestions
                  <span className="badge-count">{selected.matches.length}</span>
                </div>

                <div className="match-list">
                  {selected.matches.map((m, i) => (
                    <div
                      key={i}
                      className="match-item"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="match-item__vendor">
                        <div className="match-item__avatar">
                          {m.vendor?.charAt(0)?.toUpperCase() || 'V'}
                        </div>
                        <div>
                          <strong>{m.vendor}</strong>
                          <span className="match-item__score">
                            <b>{Math.round(m.score)}%</b> match
                          </span>
                        </div>
                      </div>

                      <span
                        className={`match-item__notified ${
                          m.notified ? 'is-notified' : ''
                        }`}
                      >
                        {m.notified ? '✓ Notified' : '⏳ Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {selected.status === 'submitted' && (
              <div className="admin-review__actions">
                <div className="field-group">
                  <label>
                    <span className="field-icon">📝</span>
                    Admin note / rejection reason
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note about this decision…"
                    rows={3}
                  />
                </div>

                <div className="admin-review__buttons">
                  <button
                    className="btn btn--primary btn--lg"
                    disabled={busy === selected.id}
                    onClick={() => approval('approved')}
                  >
                    {busy === selected.id ? (
                      <>
                        <span className="spinner" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        Approve &amp; Match Vendors
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn--danger btn--lg"
                    disabled={busy === selected.id}
                    onClick={() => approval('rejected')}
                  >
                    <span>✕</span>
                    Reject Enquiry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PanelLayout>
  )
}