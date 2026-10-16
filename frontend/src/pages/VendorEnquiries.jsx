import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import API from '../services/api'
import '../styles/BuyerDashboard.css'

const PAGE_INFO = {
  new: { title: 'New Enquiries', description: 'Enquiries sent to you, not yet opened.' },
  current: { title: 'Current Enquiries', description: 'Opened by you, quote not yet submitted.' },
  quoted: { title: 'Quoted', description: 'Quotes waiting for the buyer.' },
  accepted: { title: 'Accepted', description: 'Accepted quotes with buyer details.' },
  rejected: { title: 'Rejected', description: 'Rejected or auto-rejected quotes.' },
  win: { title: 'Win', description: 'Enquiries the buyer gave to you.' },
  loss: { title: 'Loss', description: 'Enquiries the buyer gave to someone else.' },
  history: { title: 'History', description: 'Win, Loss, Expired and Declined.' },
}

const initials = (name = '') => {
  const words = String(name).trim().split(/\s+/)
  return ((words[0] || '?').charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase()
}

const normStatus = (v) => String(v || '').toUpperCase().split('.').pop()

function matchTab(m, tab) {
  const enquiryStatus = normStatus(m.status)
  const quoteStatus = normStatus(m.quotation_status)
  const quoted = Boolean(m.quotation_exists)
  const closed = enquiryStatus === 'CLOSED'

  switch (tab) {
    case 'new':
    case 'current':
      return !quoted && !closed
    case 'quoted':
      return (
        quoted &&
        !closed &&
        quoteStatus !== 'ACCEPTED' &&
        quoteStatus !== 'REJECTED'
      )
    case 'accepted':
      return quoteStatus === 'ACCEPTED' || Boolean(m.buyer_accepted)
    case 'rejected':
      return quoteStatus === 'REJECTED'
    case 'win':
      return closed && String(m.outcome || '').toLowerCase() === 'win'
    case 'loss':
      return closed && String(m.outcome || '').toLowerCase() === 'loss'
    case 'history':
      return closed
    default:
      return true
  }
}

export default function VendorEnquiries() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const view = (searchParams.get('view') || 'new').toLowerCase()

  const [matches, setMatches] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const heading = PAGE_INFO[view] || PAGE_INFO.new

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [dashRes, profRes] = await Promise.allSettled([
          API.get('/vendor/dashboard'),
          API.get('/auth/me'),
        ])
        if (!alive) return

        if (dashRes.status === 'fulfilled') {
          const list = Array.isArray(dashRes.value.data?.matches)
            ? dashRes.value.data.matches
            : []
          setMatches(list)
        } else {
          setError('Unable to load enquiries.')
        }

        if (profRes.status === 'fulfilled') setProfile(profRes.value.data)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const filtered = matches.filter((m) => matchTab(m, view))

  const counts = {
    new: matches.filter((m) => matchTab(m, 'new')).length,
    current: matches.filter((m) => matchTab(m, 'current')).length,
    quoted: matches.filter((m) => matchTab(m, 'quoted')).length,
    accepted: matches.filter((m) => matchTab(m, 'accepted')).length,
    rejected: matches.filter((m) => matchTab(m, 'rejected')).length,
    win: matches.filter((m) => matchTab(m, 'win')).length,
    loss: matches.filter((m) => matchTab(m, 'loss')).length,
    history: matches.filter((m) => matchTab(m, 'history')).length,
  }

  const companyName =
    profile?.company_name || profile?.company || profile?.name || 'Your Company'
  const userInitials = initials(companyName)

  const MENU = [
    { id: 'new', l: 'New enquiry', i: '📥', to: '/vendor/enquiries?view=new', countKey: 'new' },
    { id: 'current', l: 'Current enquiry', i: '📝', to: '/vendor/enquiries?view=current', countKey: 'current' },
    { id: 'quoted', l: 'Quoted', i: '📤', to: '/vendor/enquiries?view=quoted', countKey: 'quoted' },
    { id: 'accepted', l: 'Accepted', i: '✅', to: '/vendor/enquiries?view=accepted', countKey: 'accepted' },
    { id: 'rejected', l: 'Rejected', i: '❌', to: '/vendor/enquiries?view=rejected', countKey: 'rejected' },
    { id: 'win', l: 'Win', i: '🏆', to: '/vendor/enquiries?view=win', countKey: 'win' },
    { id: 'loss', l: 'Loss', i: '📉', to: '/vendor/enquiries?view=loss', countKey: 'loss' },
    { id: 'history', l: 'History', i: '🕒', to: '/vendor/enquiries?view=history', countKey: 'history' },
  ]

  return (
    <div className="enviquo-dash">
      <aside className={`ev-side ${mobileOpen ? 'open' : ''}`}>
        <div className="ev-brand">
          <div className="ev-logo">
            <img src="/logo2.jpeg" alt="ENVIQUO" />
          </div>
          <div>
            <b>ENVIQUO</b>
            <small>by SM Techsphere Pvt Ltd</small>
          </div>
        </div>

        <nav className="ev-nav">
          <Link to="/vendor" className="ev-nav-item">
            <span>🏠</span> Dashboard
          </Link>
          <div className="ev-nav-sep" />
          {MENU.map((m) => (
            <Link
              key={m.id}
              to={m.to}
              className={`ev-nav-item ${view === m.id ? 'on' : ''}`}
            >
              <span>{m.i}</span>
              {m.l}
              <span className="ev-nav-count">{counts[m.countKey] ?? 0}</span>
            </Link>
          ))}
        </nav>

        <div className="ev-side-foot">
          <b>Diagnose. Match. Solution.</b>
          Vendor workspace
        </div>
      </aside>

      {mobileOpen && (
        <div className="ev-scrim" onClick={() => setMobileOpen(false)} />
      )}

      <div className="ev-main">
        <header className="ev-top">
          <button
            type="button"
            className="ev-ham"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            ☰
          </button>
          <span className="ev-top-title">{heading.title}</span>
          <span className="ev-sp" />
          <button
            type="button"
            className="ev-chip"
            onClick={() => navigate('/profile')}
          >
            <span className="ev-av">{userInitials}</span>
            <span className="ev-chip-name">{companyName}</span>
          </button>
        </header>

        <main className="ev-content">
          <section className="ev-section">
            <div className="ev-heading">
              <div>
                <span className="ev-eyebrow">VENDOR WORKSPACE</span>
                <h3>{heading.title}</h3>
                <p>{heading.description}</p>
              </div>
            </div>

            {error ? (
              <div className="ev-error">{error}</div>
            ) : loading ? (
              <div className="ev-loading">Loading enquiries...</div>
            ) : filtered.length ? (
              <div className="ev-table">
                <div className="ev-row ev-row-head">
                  <span>Enquiry</span>
                  <span>Domain</span>
                  <span>Score</span>
                  <span>Status</span>
                  <span />
                </div>
                {filtered.map((m) => {
                  const status = normStatus(m.status)
                  const quoteStatus = normStatus(m.quotation_status)

                  let badgeLabel = 'New'
                  let badgeCls = 'info'
                  if (quoteStatus === 'ACCEPTED') {
                    badgeLabel = 'Accepted'
                    badgeCls = 'success'
                  } else if (quoteStatus === 'REJECTED') {
                    badgeLabel = 'Rejected'
                    badgeCls = 'danger'
                  } else if (status === 'CLOSED') {
                    badgeLabel = 'Closed'
                    badgeCls = 'success'
                  } else if (m.quotation_exists) {
                    badgeLabel = 'Quoted'
                    badgeCls = 'info'
                  }

                  return (
                    <Link
                      className="ev-row"
                      to={`/vendor/enquiries/${m.id}`}
                      key={m.id}
                    >
                      <span className="ev-enq">
                        <b>#{m.id}</b>
                        <span>
                          <strong>{m.title || `Enquiry #${m.id}`}</strong>
                          <small>
                            {m.quotation_exists
                              ? 'Quotation submitted'
                              : 'New — awaiting your quote'}
                          </small>
                        </span>
                      </span>
                      <span>{m.domain || '—'}</span>
                      <span>{Math.round(m.score || 0)}%</span>
                      <span>
                        <i className={`bd-status ${badgeCls}`}>{badgeLabel}</i>
                      </span>
                      <span className="ev-arrow">↗</span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="ev-empty">
                <div>▤</div>
                <h4>No {heading.title.toLowerCase()} found</h4>
                <p>Nothing to show in this category right now.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}