import { useEffect, useState } from 'react'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import '../styles/AdminEnquiries.css'

export default function AdminEnquiries() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('info')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)

    try {
      const r = await API.get('/admin/enquiries')
      setRows(r.data)
    } catch (err) {
      setMsg(
        err.response?.data?.detail ||
          'Unable to load enquiries.'
      )
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const open = async (id) => {
    setMsg('')

    try {
      const r = await API.get(`/admin/enquiries/${id}`)
      setSelected(r.data)

      setTimeout(() => {
        document.querySelector('.admin-review')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 50)
    } catch (err) {
      setMsg(
        err.response?.data?.detail ||
          'Unable to load enquiry details.'
      )
      setMsgType('error')
    }
  }

  const closeReview = () => {
    setSelected(null)
    setMsg('')
  }

  const deleteEnquiry = async (id, title) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete enquiry #${id} "${title}"?`
    )

    if (!confirmed) return

    setBusy(`delete-${id}`)
    setMsg('')

    try {
      await API.delete(`/admin/enquiries/${id}`)

      setMsg('✓ Enquiry deleted successfully.')
      setMsgType('success')

      if (selected?.id === id) {
        setSelected(null)
      }

      await load()
    } catch (err) {
      setMsg(
        err.response?.data?.detail ||
          'Unable to delete enquiry.'
      )
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
      matched: 'status--approved',
      quotation: 'status--quoted',
      accepted: 'status--quoted',
      closed: 'status--closed',
    }[s] || 'status--default')

  return (
    <PanelLayout role="admin" title="Enquiry Monitoring & Matching">
      <div className="admin-enq">

        {/* ================= LIST CARD ================= */}

        <div className="panel-card admin-enq__list">

          <div className="card-head">
            <div>
              <span className="eyebrow">
                Automatic enquiry workflow
              </span>

              <h2>Technical enquiries</h2>

              <p className="muted">
                Buyer enquiries are automatically approved and
                matched with suitable vendors based on their
                technical domain. Admin can monitor enquiries,
                matches and quotations from this panel.
              </p>
            </div>

            <div className="enq-counter">
              <span className="enq-counter__num">
                {rows.length}
              </span>

              <span className="enq-counter__label">
                Total
              </span>
            </div>
          </div>

          {/* ================= MESSAGE ================= */}

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
                {msgType === 'success'
                  ? '✓'
                  : msgType === 'error'
                  ? '!'
                  : 'ℹ'}
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

          {/* ================= TABLE ================= */}

          {loading ? (
            <div className="enq-skeletons">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="enq-skeleton"
                />
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
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                >

                  {/* ENQUIRY */}

                  <div className="enq-table__cell enq-table__cell--main">

                    <div className="enq-id">
                      #{r.id}
                    </div>

                    <div>
                      <strong>{r.title}</strong>

                      <span className="muted">
                        {r.buyer}
                      </span>
                    </div>

                  </div>

                  {/* DOMAIN */}

                  <div className="enq-table__cell">
                    <span className="enq-domain">
                      {r.domain}
                    </span>
                  </div>

                  {/* STATUS */}

                  <div className="enq-table__cell">

                    <span
                      className={`status-pill ${statusClass(
                        r.status
                      )}`}
                    >
                      <span className="status-pill__dot" />

                      {r.status}
                    </span>

                  </div>

                  {/* ACTIVITY */}

                  <div className="enq-table__cell">

                    <span className="enq-activity">
                      <b>{r.matches}</b> matches ·{' '}
                      <b>{r.quotations}</b> quotes
                    </span>

                  </div>

                  {/* ACTIONS */}

                  <div className="enq-table__cell enq-table__cell--action">

                    <button
                      className="btn-review"
                      onClick={() => open(r.id)}
                    >
                      <span>View</span>

                      <span className="btn-review__arrow">
                        →
                      </span>
                    </button>

                    <button
                      type="button"
                      className="btn-delete"
                      title="Delete enquiry"
                      disabled={
                        busy === `delete-${r.id}`
                      }
                      onClick={() =>
                        deleteEnquiry(
                          r.id,
                          r.title
                        )
                      }
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
            <div className="enq-empty">

              <div className="enq-empty__icon">
                📭
              </div>

              <h3>No enquiries submitted yet</h3>

              <p className="muted">
                Enquiries will appear here once buyers
                submit them.
              </p>

            </div>
          )}

        </div>

        {/* ================= DETAILS / MONITORING PANEL ================= */}

        {selected && (
          <div className="panel-card admin-review">

            <div className="card-head">

              <div>

                <span className="eyebrow">
                  Enquiry #{selected.id}
                </span>

                <h2>{selected.title}</h2>

                <p className="muted">
                  {selected.domain} ·{' '}
                  {selected.problem} · Buyer:{' '}
                  {selected.buyer}
                </p>

              </div>

              <div className="admin-review__head-right">

                <span
                  className={`status-pill ${statusClass(
                    selected.status
                  )}`}
                >
                  <span className="status-pill__dot" />

                  {selected.status}
                </span>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReview}
                  aria-label="Close enquiry"
                >
                  ×
                </button>

              </div>

            </div>

            {/* ================= TECHNICAL DOSSIER ================= */}

            <div className="admin-review__section">

              <div className="admin-review__section-title">

                <span className="admin-review__section-icon">
                  📄
                </span>

                Technical Dossier

              </div>

              <pre className="dossier">
                {selected.dossier ||
                  'No dossier data available.'}
              </pre>

            </div>

            {/* ================= MATCHING ================= */}

            {selected.matches?.length > 0 && (
              <div className="admin-review__section">

                <div className="admin-review__section-title">

                  <span className="admin-review__section-icon">
                    🎯
                  </span>

                  Automatic Matching Suggestions

                  <span className="badge-count">
                    {selected.matches.length}
                  </span>

                </div>

                <div className="match-list">

                  {selected.matches.map((m, i) => (
                    <div
                      key={i}
                      className="match-item"
                      style={{
                        animationDelay: `${i * 0.05}s`,
                      }}
                    >

                      <div className="match-item__vendor">

                        <div className="match-item__avatar">
                          {m.vendor
                            ?.charAt(0)
                            ?.toUpperCase() || 'V'}
                        </div>

                        <div>

                          <strong>
                            {m.vendor}
                          </strong>

                          <span className="match-item__score">
                            <b>
                              {Math.round(
                                m.score
                              )}
                              %
                            </b>{' '}
                            match
                          </span>

                        </div>

                      </div>

                      <span
                        className={`match-item__notified ${
                          m.notified
                            ? 'is-notified'
                            : ''
                        }`}
                      >
                        {m.notified
                          ? '✓ Notified'
                          : '⏳ Pending'}
                      </span>

                    </div>
                  ))}

                </div>

              </div>
            )}

            {/* ================= NO MATCH ================= */}

            {(!selected.matches ||
              selected.matches.length === 0) && (
              <div className="admin-review__section">

                <div className="admin-review__section-title">

                  <span className="admin-review__section-icon">
                    🔎
                  </span>

                  Automatic Matching

                </div>

                <p className="muted">
                  No matching vendors were found for
                  this enquiry yet.
                </p>

              </div>
            )}

            {/* ================= WORKFLOW INFO ================= */}

            <div className="admin-review__section">

              <div className="admin-review__section-title">

                <span className="admin-review__section-icon">
                  ⚡
                </span>

                Workflow Status

              </div>

              <div className="workflow-info">

                <p>
                  ✓ Enquiry is automatically approved
                </p>

                <p>
                  ✓ Domain-based vendor matching is
                  automatic
                </p>

                <p>
                  ✓ Matching vendors can view the
                  enquiry immediately
                </p>

                <p>
                  ✓ Vendors can submit quotations
                </p>

                <p>
                  ✓ Buyer and vendor continue through
                  the mutual handshake process
                </p>

              </div>

            </div>

          </div>
        )}

      </div>
    </PanelLayout>
  )
}
