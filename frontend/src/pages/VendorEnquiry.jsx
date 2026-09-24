import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import '../styles/VendorEnquiry.css'

function formatDeadline(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeRemaining(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { expired: true, text: 'Expired' }
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return { expired: false, text: `${days}d ${hours % 24}h left`, urgent: false }
  }
  return {
    expired: false,
    text: `${hours}h ${minutes}m left`,
    urgent: hours < 24,
  }
}

export default function VendorEnquiry() {
  const { id } = useParams()
  const [enquiry, setEnquiry] = useState(null)
  const [form, setForm] = useState({
    capex: '',
    opex: '',
    technology: '',
    implementation_time: '',
    warranty: '',
    amc: '',
    proposal_notes: '',
  })
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('info')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await API.get(`/vendor/enquiries/${id}`)
      setEnquiry(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const accept = async () => {
    setBusy(true)
    setMsg('')
    try {
      const r = await API.post('/vendor/handshake', {
        quotation_id: enquiry.quotation_id,
        accept: true,
      })
      setMsg(
        r.data.mutual
          ? '✓ Two-way handshake completed. Buyer contact is now unlocked.'
          : '✓ Vendor acceptance recorded. Waiting for buyer confirmation.'
      )
      setMsgType('success')
      await load()
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Handshake failed')
      setMsgType('error')
    } finally {
      setBusy(false)
    }
  }

  const rejectConnection = async () => {
    setBusy(true)
    setMsg('')
    try {
      await API.post('/vendor/handshake', {
        quotation_id: enquiry.quotation_id,
        accept: false,
      })
      setMsg('✓ Connection declined. Buyer has been notified.')
      setMsgType('success')
      await load()
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Unable to decline connection')
      setMsgType('error')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMsg('')

    try {
      const r = await API.post('/vendor/quotations', {
        ...form,
        enquiry_id: Number(id),
        capex: Number(form.capex),
        opex: form.opex ? Number(form.opex) : null,
      })
      setMsg(r.data.message || '✓ Quotation submitted successfully.')
      setMsgType('success')
      await load()
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Quotation failed')
      setMsgType('error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <PanelLayout role="vendor" title="Enquiry">
        <div className="ve-loading">
          <div className="ve-loading__spinner" />
          <span>Loading enquiry…</span>
        </div>
      </PanelLayout>
    )
  }

  if (!enquiry) {
    return (
      <PanelLayout role="vendor" title="Enquiry">
        <div className="panel-card ve-error">
          <div className="ve-error__icon">⚠️</div>
          <h3>Enquiry not found</h3>
          <p className="muted">This enquiry doesn't exist or you don't have access.</p>
          <Link to="/vendor" className="btn btn--primary">← Back to Dashboard</Link>
        </div>
      </PanelLayout>
    )
  }

  const canSubmitQuotation =
    !enquiry.quotation_exists && enquiry.quotation_window_open

  const buyerAccepted =
    enquiry.handshake.buyer_accepted && enquiry.quotation_id

  const mutual = enquiry.handshake.status === 'mutual'

  const timer = timeRemaining(enquiry.quotation_deadline)
  const matchScore = Math.round(enquiry.match_score)

  const statusMeta = {
    submitted: { label: 'Awaiting Approval', cls: 've-status--submitted', icon: '📝' },
    approved:  { label: 'Approved',          cls: 've-status--approved',  icon: '✅' },
    rejected:  { label: 'Rejected',          cls: 've-status--rejected',  icon: '❌' },
    quoted:    { label: 'Quoted',            cls: 've-status--quoted',    icon: '💰' },
    closed:    { label: 'Closed',            cls: 've-status--closed',    icon: '🔒' },
  }[enquiry.status] || { label: enquiry.status, cls: 've-status--default', icon: '•' }

  return (
    <PanelLayout role="vendor" title={`Matching Enquiry #${enquiry.id}`}>
      <div className="ve">

        {/* Back */}
        <Link to="/vendor" className="ve-back">
          <span>←</span> Back to Leads
        </Link>

        {/* ============ HEADER ============ */}
        <div className="panel-card ve-header">
          <div className="ve-header__top">
            <div className="ve-header__id">
              <span>Enquiry</span>
              <strong>#{enquiry.id}</strong>
            </div>
            <span className={`ve-status ${statusMeta.cls}`}>
              <span className="ve-status__icon">{statusMeta.icon}</span>
              <span className="ve-status__dot" />
              {statusMeta.label}
            </span>
          </div>

          <div className="ve-header__main">
            <span className="ve-domain-chip">{enquiry.domain}</span>
            <h2 className="ve-header__title">{enquiry.title}</h2>
            <p className="ve-header__problem">
              <span className="ve-header__problem-label">Problem:</span> {enquiry.problem}
            </p>
          </div>

          {/* Match score + deadline row */}
          <div className="ve-header__meta">
            <div className="ve-metric ve-metric--score">
              <div className="ve-metric__icon">🎯</div>
              <div>
                <span className="ve-metric__label">Match Score</span>
                <strong className="ve-metric__value">{matchScore}%</strong>
              </div>
              <div className="ve-metric__bar">
                <div
                  className="ve-metric__fill"
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>

            <div className={`ve-metric ve-metric--deadline ${timer?.urgent ? 'is-urgent' : ''} ${timer?.expired ? 'is-expired' : ''}`}>
              <div className="ve-metric__icon">⏰</div>
              <div>
                <span className="ve-metric__label">Quotation Deadline</span>
                <strong className="ve-metric__value">
                  {formatDeadline(enquiry.quotation_deadline)}
                </strong>
              </div>
              {timer && (
                <span className="ve-metric__badge">
                  {timer.text}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============ PRIVACY BANNER ============ */}
        <div className="ve-privacy">
          <div className="ve-privacy__icon">🔒</div>
          <div>
            <strong>Buyer identity is masked</strong>
            <span>
              Contact details unlock only after buyer and vendor both accept
              the same quotation connection.
            </span>
          </div>
        </div>

        {/* ============ DOSSIER ============ */}
        <div className="panel-card ve-dossier">
          <div className="ve-section-head">
            <div className="ve-section-head__icon">📄</div>
            <div>
              <h3>Technical Dossier</h3>
              <p className="muted">Structured requirements & answers from the buyer</p>
            </div>
          </div>
          <pre className="dossier">{enquiry.dossier}</pre>
        </div>

        {/* ============ QUOTATION FORM ============ */}
        {!enquiry.quotation_exists && (
          <div className="panel-card ve-form-card">
            <div className="ve-section-head">
              <div className="ve-section-head__icon ve-section-head__icon--orange">💰</div>
              <div>
                <h3>Submit Technical Quotation</h3>
                <p className="muted">
                  Provide technical & commercial details for buyer review
                </p>
              </div>
            </div>

            {!enquiry.quotation_window_open ? (
              <div className="ve-expired">
                <div className="ve-expired__icon">⏰</div>
                <div>
                  <strong>Quotation window has expired</strong>
                  <span>The 240-hour active window for this enquiry has closed.</span>
                </div>
              </div>
            ) : (
              <form className="ve-form" onSubmit={submit}>

                {/* Financials */}
                <div className="ve-form__section">
                  <div className="ve-form__section-title">
                    <span className="ve-form__section-num">01</span>
                    Commercials
                  </div>
                  <div className="ve-form__grid">
                    <div className="ve-field">
                      <label>
                        <span className="ve-field__icon">💵</span>
                        CAPEX (₹)
                        <span className="ve-field__req">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.capex}
                        onChange={(e) => setForm({ ...form, capex: e.target.value })}
                        placeholder="e.g. 1500000"
                        required
                      />
                    </div>

                    <div className="ve-field">
                      <label>
                        <span className="ve-field__icon">📊</span>
                        OPEX (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.opex}
                        onChange={(e) => setForm({ ...form, opex: e.target.value })}
                        placeholder="Optional annual OPEX"
                      />
                    </div>
                  </div>
                </div>

                {/* Technical */}
                <div className="ve-form__section">
                  <div className="ve-form__section-title">
                    <span className="ve-form__section-num">02</span>
                    Technical Details
                  </div>
                  <div className="ve-form__grid">
                    <div className="ve-field">
                      <label>
                        <span className="ve-field__icon">⚙️</span>
                        Technology
                        <span className="ve-field__req">*</span>
                      </label>
                      <input
                        value={form.technology}
                        onChange={(e) => setForm({ ...form, technology: e.target.value })}
                        placeholder="e.g. MBBR + UF + RO"
                        required
                      />
                    </div>

                    <div className="ve-field">
                      <label>
                        <span className="ve-field__icon">⏱️</span>
                        Implementation Time
                        <span className="ve-field__req">*</span>
                      </label>
                      <input
                        value={form.implementation_time}
                        onChange={(e) =>
                          setForm({ ...form, implementation_time: e.target.value })
                        }
                        placeholder="e.g. 4 months"
                        required
                      />
                    </div>

                    <div className="ve-field">
                      <label>
                        <span className="ve-field__icon">🛡️</span>
                        Warranty
                      </label>
                      <input
                        value={form.warranty}
                        onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                        placeholder="e.g. 24 months"
                      />
                    </div>

                    <div className="ve-field">
                      <label>
                        <span className="ve-field__icon">🔧</span>
                        AMC
                      </label>
                      <input
                        value={form.amc}
                        onChange={(e) => setForm({ ...form, amc: e.target.value })}
                        placeholder="e.g. 5 years CMC"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="ve-form__section">
                  <div className="ve-form__section-title">
                    <span className="ve-form__section-num">03</span>
                    Proposal Notes
                  </div>
                  <div className="ve-field">
                    <textarea
                      value={form.proposal_notes}
                      onChange={(e) =>
                        setForm({ ...form, proposal_notes: e.target.value })
                      }
                      placeholder="Any additional details about your solution, scope, or conditions…"
                      rows={4}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="ve-submit"
                  disabled={busy || !canSubmitQuotation}
                >
                  {busy ? (
                    <>
                      <span className="spinner" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      Submit Technical Quotation
                      <span className="ve-submit__arrow">→</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============ QUOTATION SUBMITTED — HANDSHAKE FLOW ============ */}
        {enquiry.quotation_exists && (
          <div className="panel-card ve-handshake">
            <div className="ve-section-head">
              <div className="ve-section-head__icon ve-section-head__icon--teal">🤝</div>
              <div>
                <h3>Quotation Status</h3>
                <p className="muted">Two-way handshake & contact unlock flow</p>
              </div>
            </div>

            {/* Progress timeline */}
            <div className="ve-timeline">
              {/* Step 1 — Quotation submitted */}
              <div className="ve-timeline__step is-done">
                <div className="ve-timeline__dot">✓</div>
                <div className="ve-timeline__body">
                  <strong>Quotation Submitted</strong>
                  <span>Your quotation has been sent to the buyer.</span>
                </div>
              </div>

              <div className={`ve-timeline__line ${buyerAccepted ? 'is-done' : ''}`} />

              {/* Step 2 — Buyer accepted */}
              <div className={`ve-timeline__step ${buyerAccepted ? 'is-done' : 'is-waiting'}`}>
                <div className="ve-timeline__dot">
                  {buyerAccepted ? '✓' : '2'}
                </div>
                <div className="ve-timeline__body">
                  <strong>Buyer Acceptance</strong>
                  <span>
                    {buyerAccepted
                      ? 'Buyer accepted your quotation.'
                      : 'Waiting for buyer to review your quotation.'}
                  </span>
                </div>
              </div>

              <div className={`ve-timeline__line ${mutual ? 'is-done' : ''}`} />

              {/* Step 3 — Vendor accepted */}
              <div className={`ve-timeline__step ${mutual ? 'is-done' : buyerAccepted ? 'is-active' : 'is-pending'}`}>
                <div className="ve-timeline__dot">
                  {mutual ? '✓' : '3'}
                </div>
                <div className="ve-timeline__body">
                  <strong>Your Acceptance</strong>
                  <span>
                    {mutual
                      ? 'You accepted the connection.'
                      : buyerAccepted
                      ? 'Confirm connection to complete handshake.'
                      : 'Available after buyer accepts.'}
                  </span>
                </div>
              </div>

              <div className={`ve-timeline__line ${mutual ? 'is-done' : ''}`} />

              {/* Step 4 — Mutual */}
              <div className={`ve-timeline__step ${mutual ? 'is-done' : 'is-pending'}`}>
                <div className="ve-timeline__dot">
                  {mutual ? '🔓' : '4'}
                </div>
                <div className="ve-timeline__body">
                  <strong>Contacts Unlocked</strong>
                  <span>
                    {mutual
                      ? 'Direct contact details are now available.'
                      : 'Available after mutual acceptance.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action — when buyer accepted */}
            {buyerAccepted && !mutual && (
              <div className="ve-action-card">
                <div className="ve-action-card__icon">🎉</div>
                <div className="ve-action-card__text">
                  <strong>Buyer accepted your quotation!</strong>
                  <span>Confirm the connection to unlock direct contact details.</span>
                </div>
                <div className="ve-action-card__buttons">
                  <button
                    className="btn btn--primary btn--lg"
                    disabled={busy}
                    onClick={accept}
                  >
                    {busy ? (
                      <>
                        <span className="spinner" />
                        Processing…
                      </>
                    ) : (
                      <>✓ Accept Connection</>
                    )}
                  </button>
                  <button
                    className="btn btn--danger btn--lg"
                    disabled={busy}
                    onClick={rejectConnection}
                  >
                    ✕ Decline
                  </button>
                </div>
              </div>
            )}

            {/* Waiting for buyer */}
            {enquiry.handshake.status === 'pending' && !enquiry.handshake.buyer_accepted && (
              <div className="ve-waiting">
                <div className="ve-waiting__icon">⏳</div>
                <div>
                  <strong>Waiting for buyer review</strong>
                  <span>You'll be notified when the buyer responds to your quotation.</span>
                </div>
              </div>
            )}

            {/* Mutual — buyer contacts unlocked */}
            {mutual && enquiry.buyer_contact && (
              <div className="ve-unlocked">
                <div className="ve-unlocked__glow" />
                <div className="ve-unlocked__head">
                  <div className="ve-unlocked__icon">🔓</div>
                  <div>
                    <h4>Buyer Contact Details Unlocked</h4>
                    <p>Both parties accepted the connection. Direct contact is now available.</p>
                  </div>
                </div>

                <div className="ve-unlocked__contacts">
                  <div className="ve-unlocked__contact">
                    <div className="ve-unlocked__avatar">
                      {enquiry.buyer_contact.company?.charAt(0)?.toUpperCase() || 'B'}
                    </div>
                    <div>
                      <span className="ve-unlocked__label">Company</span>
                      <strong>{enquiry.buyer_contact.company}</strong>
                    </div>
                  </div>

                  <div className="ve-unlocked__contact">
                    <div className="ve-unlocked__contact-icon">👤</div>
                    <div>
                      <span className="ve-unlocked__label">Contact Person</span>
                      <strong>{enquiry.buyer_contact.name}</strong>
                    </div>
                  </div>

                  <div className="ve-unlocked__contact">
                    <div className="ve-unlocked__contact-icon">✉️</div>
                    <div>
                      <span className="ve-unlocked__label">Email</span>
                      <a
                        href={`mailto:${enquiry.buyer_contact.email}`}
                        className="ve-unlocked__link"
                      >
                        {enquiry.buyer_contact.email}
                      </a>
                    </div>
                  </div>

                  <div className="ve-unlocked__contact">
                    <div className="ve-unlocked__contact-icon">📱</div>
                    <div>
                      <span className="ve-unlocked__label">Phone</span>
                      <a
                        href={`tel:${enquiry.buyer_contact.phone}`}
                        className="ve-unlocked__link"
                      >
                        {enquiry.buyer_contact.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message */}
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