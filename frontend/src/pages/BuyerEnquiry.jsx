import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import '../styles/BuyerEnquiry.css'

export default function BuyerEnquiry() {
  const { id } = useParams()
  const [enquiry, setEnquiry] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('info')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await API.get(`/buyer/enquiries/${id}`)
      setEnquiry(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const accept = async (quotationId) => {
    setBusy(true)
    setMsg('')
    try {
      const r = await API.post('/buyer/handshake', {
        quotation_id: quotationId,
        accept: true,
      })
      setMsg(
        r.data.mutual
          ? '✓ Two-way handshake completed. Contact details are now unlocked.'
          : '✓ Your acceptance is recorded. Waiting for the vendor to accept the connection.'
      )
      setMsgType('success')
      await load()
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Unable to accept quotation.')
      setMsgType('error')
    } finally {
      setBusy(false)
    }
  }

  const reject = async (quotationId) => {
    setBusy(true)
    setMsg('')
    try {
      await API.post('/buyer/handshake', {
        quotation_id: quotationId,
        accept: false,
      })
      setMsg('✓ Quotation rejected. The vendor has been notified.')
      setMsgType('success')
      await load()
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Unable to reject quotation.')
      setMsgType('error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <PanelLayout role="buyer" title="Enquiry">
        <div className="be-loading">
          <div className="be-loading__spinner" />
          <span>Loading enquiry…</span>
        </div>
      </PanelLayout>
    )
  }

  if (!enquiry) {
    return (
      <PanelLayout role="buyer" title="Enquiry">
        <div className="panel-card be-error">
          <div className="be-error__icon">⚠️</div>
          <h3>Enquiry not found</h3>
          <p className="muted">The enquiry you're looking for doesn't exist or you don't have access.</p>
          <Link to="/buyer" className="btn btn--primary">
            ← Back to Dashboard
          </Link>
        </div>
      </PanelLayout>
    )
  }

  const isWaiting = enquiry.status === 'submitted'
  const isRejected = enquiry.status === 'rejected'
  const mutual = enquiry.handshake.status === 'mutual'

  const statusMeta = {
    submitted: { label: 'Submitted', cls: 'be-status--submitted', icon: '📝' },
    approved:  { label: 'Approved',  cls: 'be-status--approved',  icon: '✅' },
    rejected:  { label: 'Rejected',  cls: 'be-status--rejected',  icon: '❌' },
    quoted:    { label: 'Quoted',    cls: 'be-status--quoted',    icon: '💰' },
    closed:    { label: 'Closed',    cls: 'be-status--closed',    icon: '🔒' },
  }[enquiry.status] || { label: enquiry.status, cls: 'be-status--default', icon: '•' }

  return (
    <PanelLayout role="buyer" title={`Enquiry #${enquiry.id}`}>
      <div className="be">

        {/* Back link */}
        <Link to="/buyer" className="be-back">
          <span>←</span> Back to My Enquiries
        </Link>

        {/* ============ HEADER CARD ============ */}
        <div className="panel-card be-header">
          <div className="be-header__top">
            <div className="be-header__id">
              <span>Enquiry</span>
              <strong>#{enquiry.id}</strong>
            </div>

            <div className="be-header__status">
              <span className={`be-status ${statusMeta.cls}`}>
                <span className="be-status__icon">{statusMeta.icon}</span>
                <span className="be-status__dot" />
                {statusMeta.label}
              </span>
            </div>
          </div>

          <div className="be-header__main">
            <div className="be-header__domain">
              <span className="be-domain-chip">{enquiry.domain}</span>
            </div>
            <h2 className="be-header__title">{enquiry.title}</h2>
            <p className="be-header__problem">
              <span className="be-header__problem-label">Problem:</span> {enquiry.problem}
            </p>
          </div>
        </div>

        {/* ============ STATE BANNERS ============ */}
        {isWaiting && (
          <div className="be-banner be-banner--waiting">
            <div className="be-banner__icon">⏳</div>
            <div>
              <strong>Waiting for Admin approval</strong>
              <span>Your enquiry is private and vendors have not been notified yet.</span>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="be-banner be-banner--error">
            <div className="be-banner__icon">⚠️</div>
            <div>
              <strong>This enquiry was rejected</strong>
              <span>Review your CRM history or submit a revised enquiry.</span>
            </div>
          </div>
        )}

        {!isWaiting && !isRejected && (
          <div className="be-banner be-banner--approved">
            <div className="be-banner__icon">✅</div>
            <div>
              <strong>Admin approved — matching is active</strong>
              <span>Matched vendors can view the masked technical dossier.</span>
            </div>
          </div>
        )}

        {/* ============ DOSSIER CARD ============ */}
        <div className="panel-card be-dossier">
          <div className="be-section-head">
            <div className="be-section-head__icon">📄</div>
            <div>
              <h3>Technical Dossier</h3>
              <p className="muted">Submitted requirements & structured answers</p>
            </div>
          </div>
          <pre className="dossier">{enquiry.dossier}</pre>
        </div>

        {/* ============ MATCHES ============ */}
        {enquiry.matches?.length > 0 && (
          <div className="panel-card be-matches">
            <div className="be-section-head">
              <div className="be-section-head__icon be-section-head__icon--pink">🎯</div>
              <div>
                <h3>
                  Matching Vendors
                  <span className="be-count">{enquiry.matches.length}</span>
                </h3>
                <p className="muted">
                  Vendor identity remains masked until two-way handshake completion.
                </p>
              </div>
            </div>

            <div className="be-match-grid">
              {enquiry.matches.map((m, i) => (
                <div
                  key={m.id}
                  className="be-match"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="be-match__avatar">
                    {m.vendor_name?.charAt(0)?.toUpperCase() || 'V'}
                  </div>
                  <div className="be-match__info">
                    <strong>{m.vendor_name}</strong>
                    <span className="be-match__score">
                      <b>{Math.round(m.score)}%</b> match
                    </span>
                  </div>
                  <span className="be-match__tag">Approved</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ QUOTATIONS ============ */}
        <div className="panel-card be-quotes">
          <div className="be-section-head">
            <div className="be-section-head__icon be-section-head__icon--orange">💰</div>
            <div>
              <h3>
                Quotations
                {enquiry.quotations.length > 0 && (
                  <span className="be-count">{enquiry.quotations.length}</span>
                )}
              </h3>
              <p className="muted">Technical & commercial proposals from matched vendors</p>
            </div>
          </div>

          {enquiry.quotations.length ? (
            <div className="be-quote-list">
              {enquiry.quotations.map((q, i) => {
                const qStatus =
                  q.status === 'accepted'
                    ? { cls: 'is-accepted', label: 'Accepted', icon: '✓' }
                    : q.status === 'rejected'
                    ? { cls: 'is-rejected', label: 'Rejected', icon: '✕' }
                    : mutual
                    ? { cls: 'is-handshake', label: 'Handshake done', icon: '🤝' }
                    : { cls: 'is-pending', label: 'Awaiting decision', icon: '⏳' }

                return (
                  <div
                    key={q.id}
                    className={`be-quote ${qStatus.cls}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="be-quote__top">
                      <div className="be-quote__vendor">
                        <div className="be-quote__avatar">
                          {q.vendor_company?.charAt(0)?.toUpperCase() || 'V'}
                        </div>
                        <div>
                          <strong>{q.vendor_company}</strong>
                          <span className="be-quote__tech">{q.technology}</span>
                        </div>
                      </div>

                      <span className={`be-quote__status ${qStatus.cls}`}>
                        {qStatus.icon} {qStatus.label}
                      </span>
                    </div>

                    <div className="be-quote__stats">
                      <div className="be-quote__stat">
                        <span className="be-quote__stat-label">CAPEX</span>
                        <span className="be-quote__stat-value">
                          ₹{Number(q.capex).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="be-quote__stat">
                        <span className="be-quote__stat-label">OPEX</span>
                        <span className="be-quote__stat-value">
                          {q.opex ? `₹${Number(q.opex).toLocaleString('en-IN')}` : '—'}
                        </span>
                      </div>

                      <div className="be-quote__stat">
                        <span className="be-quote__stat-label">Timeline</span>
                        <span className="be-quote__stat-value">
                          {q.implementation_time || '—'}
                        </span>
                      </div>
                    </div>

                    {(q.warranty || q.amc) && (
                      <div className="be-quote__meta">
                        {q.warranty && (
                          <span className="be-quote__meta-pill">
                            🛡️ Warranty: {q.warranty}
                          </span>
                        )}
                        {q.amc && (
                          <span className="be-quote__meta-pill">
                            🔧 AMC: {q.amc}
                          </span>
                        )}
                      </div>
                    )}

                    {q.notes && (
                      <p className="be-quote__notes">{q.notes}</p>
                    )}

                    {/* Actions */}
                    <div className="be-quote__actions">
                      {q.status === 'accepted' ? (
                        <span className="be-quote__done is-success">
                          ✓ Accepted
                        </span>
                      ) : q.status === 'rejected' ? (
                        <span className="be-quote__done is-muted">
                          Rejected
                        </span>
                      ) : mutual ? (
                        <span className="be-quote__done is-success">
                          🤝 Handshake completed
                        </span>
                      ) : (
                        <>
                          <button
                            className="btn btn--primary"
                            disabled={busy || enquiry.handshake.buyer_accepted}
                            onClick={() => accept(q.id)}
                          >
                            {busy ? (
                              <>
                                <span className="spinner" />
                                Processing…
                              </>
                            ) : (
                              <>✓ Accept Quotation</>
                            )}
                          </button>

                          <button
                            className="btn btn--danger"
                            disabled={busy}
                            onClick={() => reject(q.id)}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="be-empty">
              <div className="be-empty__icon">💬</div>
              <h4>No quotations yet</h4>
              <p className="muted">
                {isWaiting
                  ? 'Quotations will become available after admin approval and vendor matching.'
                  : 'Waiting for matched vendors to submit quotations.'}
              </p>
            </div>
          )}
        </div>

        {/* ============ HANDSHAKE PENDING ============ */}
        {enquiry.handshake.buyer_accepted && !mutual && (
          <div className="be-banner be-banner--waiting">
            <div className="be-banner__icon">⏳</div>
            <div>
              <strong>You accepted the quotation</strong>
              <span>
                The vendor must now accept the connection to complete the
                two-way handshake.
              </span>
            </div>
          </div>
        )}

        {/* ============ UNLOCKED CONTACTS ============ */}
        {mutual && enquiry.unlocked_contact && (
          <div className="be-unlocked">
            <div className="be-unlocked__glow" />
            <div className="be-unlocked__head">
              <div className="be-unlocked__icon">🔓</div>
              <div>
                <h3>Contact Details Unlocked</h3>
                <p>Both parties accepted the connection. Direct contact is now available.</p>
              </div>
            </div>

            <div className="be-unlocked__contacts">
              <div className="be-unlocked__contact">
                <div className="be-unlocked__contact-avatar">
                  {enquiry.unlocked_contact.vendor_name?.charAt(0)?.toUpperCase() || 'V'}
                </div>
                <div className="be-unlocked__contact-info">
                  <span className="be-unlocked__contact-label">Vendor</span>
                  <strong>{enquiry.unlocked_contact.vendor_name}</strong>
                </div>
              </div>

              <div className="be-unlocked__contact">
                <div className="be-unlocked__contact-icon">✉️</div>
                <div className="be-unlocked__contact-info">
                  <span className="be-unlocked__contact-label">Email</span>
                  <a
                    href={`mailto:${enquiry.unlocked_contact.vendor_email}`}
                    className="be-unlocked__contact-link"
                  >
                    {enquiry.unlocked_contact.vendor_email}
                  </a>
                </div>
              </div>

              <div className="be-unlocked__contact">
                <div className="be-unlocked__contact-icon">📱</div>
                <div className="be-unlocked__contact-info">
                  <span className="be-unlocked__contact-label">Phone</span>
                  <a
                    href={`tel:${enquiry.unlocked_contact.vendor_phone}`}
                    className="be-unlocked__contact-link"
                  >
                    {enquiry.unlocked_contact.vendor_phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ MESSAGE ============ */}
        {msg && (
          <div
            className={`message ${
              msgType === 'error' ? 'message--error' : 'message--success'
            }`}
          >
            <span className="message__icon">
              {msgType === 'error' ? '!' : '✓'}
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
      </div>
    </PanelLayout>
  )
}