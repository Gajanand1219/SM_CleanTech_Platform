import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import API from '../services/api'
import '../styles/BuyerDashboard.css'

/* =========================================================
   DOMAIN DATA (matches HTML prototype)
   ========================================================= */

const DOMAINS = [
  {
    n: 'Water and wastewater',
    i: '💧',
    cats: [
      { n: 'Water treatment (WTP)', s: ['Raw water treatment', 'DM and RO plant', 'Softener and filters'] },
      { n: 'Effluent treatment (ETP)', s: ['Textile effluent', 'Pharma effluent', 'Food processing effluent'] },
      { n: 'Sewage treatment (STP)', s: ['Up to 50 KLD', '50 to 200 KLD', 'Above 200 KLD'] },
      { n: 'Zero liquid discharge (ZLD)', s: ['New ZLD plant', 'ZLD upgrade', 'Evaporator and dryer'] },
    ],
  },
  {
    n: 'Solid and hazardous waste',
    i: '🗑️',
    cats: [
      { n: 'Hazardous waste disposal', s: ['Collection and transport', 'Incineration', 'Co-processing'] },
      { n: 'Solid waste management', s: ['Segregation', 'Composting', 'Recycling'] },
      { n: 'Authorisation and audit', s: ['Hazardous waste authorisation', 'Waste audit', 'Records and returns'] },
    ],
  },
  {
    n: 'SPCB and air pollution',
    i: '💨',
    cats: [
      { n: 'Consent and compliance', s: ['Consent to establish', 'Consent to operate', 'Renewal and amendment'] },
      { n: 'Air pollution control', s: ['Dust collector', 'Scrubber', 'Stack monitoring'] },
      { n: 'Environmental reports', s: ['Environmental statement (Form V)', 'Environmental audit', 'Compliance report'] },
    ],
  },
  {
    n: 'Carbon and ESG',
    i: '🌿',
    cats: [
      { n: 'Carbon footprint', s: ['GHG inventory', 'Carbon audit', 'Reduction roadmap'] },
      { n: 'ESG reporting', s: ['BRSR', 'ESG gap study', 'Sustainability report'] },
      { n: 'Energy and efficiency', s: ['Energy audit', 'Efficiency retrofit', 'Carbon credits'] },
    ],
  },
  {
    n: 'Solar and renewable energy',
    i: '☀️',
    cats: [
      { n: 'Rooftop solar', s: ['Up to 100 kW', '100 kW to 1 MW', 'Above 1 MW'] },
      { n: 'Open access and captive', s: ['Captive solar', 'Open access PPA', 'Wheeling'] },
      { n: 'Storage and hybrid', s: ['Battery storage', 'Solar plus wind hybrid', 'Biogas'] },
    ],
  },
]

/* =========================================================
   MENU ITEMS (matches HTML prototype)
   ========================================================= */

const MENU = [
  { id: 'create', l: 'Create enquiry', i: '➕', d: 'Start a new enquiry in one of the 5 domains', to: '/buyer/enquiries/new' },
  { id: 'current', l: 'Current enquiry', i: '📋', d: 'Enquiries in progress and quotes received', to: '/buyer/enquiries?view=current', countKey: 'current' },
  { id: 'quote', l: 'View quote', i: '📄', d: 'Compare quotes, then accept or reject', to: '/buyer/enquiries?view=quotes', countKey: 'quotes' },
  { id: 'accepted', l: 'Accepted', i: '✅', d: 'Accepted quotes with vendor details', to: '/buyer/enquiries?view=accepted', countKey: 'accepted' },
  { id: 'rejected', l: 'Rejected', i: '❌', d: 'Quotes you rejected', to: '/buyer/enquiries?view=rejected', countKey: 'rejected' },
  { id: 'closed', l: 'Closed', i: '🔒', d: 'Update the final outcome of an enquiry', to: '/buyer/enquiries?view=closed', countKey: 'closed' },
  { id: 'history', l: 'History', i: '🕒', d: 'Record of all closed enquiries', to: '/buyer/enquiries?view=history', countKey: 'history' },
]

const STATUS_GROUPS = {
  current: ['APPROVED', 'MATCHED', 'QUOTATION', 'SUBMITTED'],
  closed: ['CLOSED'],
}

const PAGE_INFO = {
  current: { title: 'Current Enquiries', description: 'Enquiries in progress and quotes received.' },
  quotes: { title: 'View Quotes', description: 'Enquiries that have received quotations.' },
  accepted: { title: 'Accepted Enquiries', description: 'Enquiries where you accepted a quotation or completed the handshake.' },
  rejected: { title: 'Rejected Enquiries', description: 'Enquiries containing quotations rejected by you.' },
  closed: { title: 'Closed Enquiries', description: 'Review your closed enquiries.' },
  history: { title: 'Enquiry History', description: 'Review your previous enquiries.' },
}

/* =========================================================
   HELPERS
   ========================================================= */

const normalizeStatus = (value) =>
  String(value || '').toUpperCase().split('.').pop()

const statusClass = (status = '') => {
  const s = String(status).toLowerCase()
  if (['accepted', 'closed'].includes(s)) return 'bd-status success'
  if (['matched', 'quotation', 'quoted'].includes(s)) return 'bd-status info'
  if (['rejected', 'cancelled'].includes(s)) return 'bd-status danger'
  if (['approved', 'submitted', 'pending'].includes(s)) return 'bd-status warning'
  return 'bd-status'
}

const label = (value = '') =>
  String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

const initials = (name = '') => {
  const words = String(name).trim().split(/\s+/)
  return ((words[0] || '?').charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase()
}

/* =========================================================
   BUYER DASHBOARD
   ========================================================= */

export default function BuyerDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [data, setData] = useState({ stats: {}, enquiries: [] })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const requestedView = (searchParams.get('view') || '').toLowerCase()
  const view = requestedView === 'quote' ? 'quotes' : requestedView
  const isListingView = Boolean(view)
  const pageInfo = PAGE_INFO[view]

  /* ---------- Load dashboard + profile ---------- */

  useEffect(() => {
    let alive = true

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const { data: result } = await API.get('/buyer/dashboard')

        const summaries = Array.isArray(result?.enquiries) ? result.enquiries : []

        const detailedEnquiries = await Promise.all(
          summaries.map(async (enquiry) => {
            try {
              const { data: detail } = await API.get(`/buyer/enquiries/${enquiry.id}`)
              const quotations = Array.isArray(detail?.quotations) ? detail.quotations : []
              const handshake = detail?.handshake || {}

              const acceptedQuotations = quotations.filter(
                (q) => normalizeStatus(q.status) === 'ACCEPTED'
              )
              const rejectedQuotations = quotations.filter(
                (q) => normalizeStatus(q.status) === 'REJECTED'
              )

              return {
                ...enquiry,
                quotationsList: quotations,
                acceptedQuotations,
                rejectedQuotations,
                buyerAccepted:
                  Boolean(handshake.buyer_accepted) || acceptedQuotations.length > 0,
                vendorAccepted: Boolean(handshake.vendor_accepted),
                mutualHandshake:
                  normalizeStatus(handshake.status) === 'MUTUAL' ||
                  Boolean(handshake.contact_unlocked),
              }
            } catch (detailError) {
              console.error(`Unable to load enquiry #${enquiry.id}:`, detailError)
              return {
                ...enquiry,
                quotationsList: [],
                acceptedQuotations: [],
                rejectedQuotations: [],
                buyerAccepted: false,
                vendorAccepted: false,
                mutualHandshake: false,
              }
            }
          })
        )

        if (!alive) return
        setData({ stats: result?.stats || {}, enquiries: detailedEnquiries })
      } catch (err) {
        if (alive) {
          setError(
            err.response?.data?.detail ||
              'Unable to load enquiries. Please try again.'
          )
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    const loadProfile = async () => {
      try {
        const { data } = await API.get('/auth/me')
        if (alive) setProfile(data)
      } catch {
        /* profile is optional */
      }
    }

    loadDashboard()
    loadProfile()

    return () => {
      alive = false
    }
  }, [])

  const enquiries = data.enquiries

  /* ---------- Counts for sidebar + stats ---------- */

  const counts = {
    open: enquiries.filter((e) =>
      STATUS_GROUPS.current.includes(normalizeStatus(e.status))
    ).length,
    pend: enquiries.reduce((sum, e) => sum + e.quotationsList.filter((q) => normalizeStatus(q.status) === 'PENDING').length, 0),
    acc: enquiries.reduce((sum, e) => sum + e.acceptedQuotations.length, 0),
    rej: enquiries.reduce((sum, e) => sum + e.rejectedQuotations.length, 0),
    hist: enquiries.filter((e) => STATUS_GROUPS.closed.includes(normalizeStatus(e.status))).length,
  }

  const menuCounts = {
    current: counts.open,
    quotes: counts.pend,
    accepted: counts.acc,
    rejected: counts.rej,
    closed: counts.open,
    history: counts.hist,
  }

  /* ---------- Filter list by view ---------- */

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const status = normalizeStatus(enquiry.status)

    switch (view) {
      case 'current':
        return STATUS_GROUPS.current.includes(status)
      case 'quotes':
        return Number(enquiry.quotations || 0) > 0
      case 'accepted':
        return (
          enquiry.buyerAccepted ||
          enquiry.mutualHandshake ||
          enquiry.acceptedQuotations.length > 0
        )
      case 'rejected':
        return enquiry.rejectedQuotations.length > 0
      case 'closed':
        return STATUS_GROUPS.closed.includes(status)
      case 'history':
        return (
          ['CLOSED', 'ACCEPTED'].includes(status) ||
          enquiry.buyerAccepted ||
          enquiry.mutualHandshake ||
          enquiry.rejectedQuotations.length > 0
        )
      default:
        return true
    }
  })

  const heading = pageInfo || {
    title: 'All Enquiries',
    description: 'Review all your enquiries and their progress.',
  }

  /* ---------- Company / user info ---------- */

  const companyName =
    profile?.company_name ||
    profile?.company ||
    profile?.name ||
    'Your Company'

  const userEmail = profile?.email || ''
  const userInitials = initials(companyName)

  /* ---------- Render ---------- */

  return (
    <div className="enviquo-dash">
      {/* ================= SIDEBAR ================= */}

      <aside className={`ev-side ${mobileOpen ? 'open' : ''}`}>
        <div className="ev-brand">
          <div className="ev-logo">
            <svg width="42" height="42" viewBox="20 10 390 390" aria-hidden="true">
              <circle cx="180" cy="168" r="126.5" fill="none" stroke="#1e9bc9" strokeWidth="45" />
              <path d="M263 251C298 258 338 266 362 284C390 305 392 345 365 366C338 386 305 380 288 350C272 322 266 285 263 251Z" fill="#1fa971" />
              <path d="M180 135L204 168L180 201L156 168Z" fill="#62d6a8" />
            </svg>
          </div>
          <div>
            <b>ENVIQUO</b>
            <small>by SM Techsphere Pvt Ltd</small>
          </div>
        </div>

        <nav className="ev-nav">
          <Link
            to="/buyer"
            className={`ev-nav-item ${!isListingView ? 'on' : ''}`}
          >
            <span>🏠</span>
            Dashboard
          </Link>

          <div className="ev-nav-sep" />

          {MENU.map((m) => (
            <Link
              key={m.id}
              to={m.to}
              className={`ev-nav-item ${
                requestedView === m.id ? 'on' : ''
              }`}
            >
              <span>{m.i}</span>
              {m.l}
              {m.countKey != null && (
                <span className="ev-nav-count">
                  {menuCounts[m.countKey] ?? 0}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="ev-side-foot">
          <b>Diagnose. Match. Solution.</b>
          Buyer workspace
        </div>
      </aside>

      {mobileOpen && (
        <div className="ev-scrim" onClick={() => setMobileOpen(false)} />
      )}

      {/* ================= MAIN ================= */}

      <div className="ev-main">
        {/* TOPBAR */}
        <header className="ev-top">
          <button
            type="button"
            className="ev-ham"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            ☰
          </button>

          <span className="ev-top-title">
            {isListingView ? heading.title : 'Dashboard'}
          </span>

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

        {/* CONTENT */}
        <main className="ev-content">
          {isListingView ? (
            /* ---------- LISTING VIEW ---------- */
            <section className="ev-section">
              <div className="ev-heading">
                <div>
                  <span className="ev-eyebrow">BUYER WORKSPACE</span>
                  <h3>{heading.title}</h3>
                  <p>{heading.description}</p>
                </div>
                <Link className="ev-link" to="/buyer/enquiries/new">
                  + Create enquiry
                </Link>
              </div>

              {error ? (
                <div className="ev-error">{error}</div>
              ) : loading ? (
                <div className="ev-loading">Loading enquiries...</div>
              ) : filteredEnquiries.length > 0 ? (
                <div className="ev-table">
                  <div className="ev-row ev-row-head">
                    <span>Enquiry</span>
                    <span>Domain</span>
                    <span>Status</span>
                    <span>Activity</span>
                    <span />
                  </div>

                  {filteredEnquiries.map((enquiry) => (
                    <Link
                      className="ev-row"
                      to={`/buyer/enquiries/${enquiry.id}`}
                      key={enquiry.id}
                    >
                      <span className="ev-enq">
                        <b>#{enquiry.id}</b>
                        <span>
                          <strong>
                            {enquiry.title || `Enquiry #${enquiry.id}`}
                          </strong>
                          <small>
                            {view === 'accepted'
                              ? enquiry.mutualHandshake
                                ? 'Mutual handshake completed'
                                : 'Buyer accepted quotation'
                              : view === 'rejected'
                                ? `${enquiry.rejectedQuotations.length} rejected quotation(s)`
                                : 'Open enquiry details'}
                          </small>
                        </span>
                      </span>

                      <span>{enquiry.domain || '—'}</span>

                      <span>
                        <i className={statusClass(enquiry.status)}>
                          {label(enquiry.status || 'unknown')}
                        </i>
                      </span>

                      <span className="ev-activity">
                        {enquiry.matches ?? 0} matches · {enquiry.quotations ?? 0} quotes
                      </span>

                      <span className="ev-arrow">↗</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="ev-empty">
                  <div>▤</div>
                  <h4>No {heading.title.toLowerCase()} found</h4>
                  <p>No enquiries match this category right now.</p>
                  {(view === 'quotes' || view === 'accepted' || view === 'rejected') && (
                    <Link className="ev-btn ev-btn-pri" to="/buyer/enquiries">
                      View all enquiries
                    </Link>
                  )}
                  {view === 'current' && (
                    <Link className="ev-btn ev-btn-pri" to="/buyer/enquiries/new">
                      + Create enquiry
                    </Link>
                  )}
                </div>
              )}
            </section>
          ) : (
            /* ---------- DASHBOARD VIEW ---------- */
            <>
              {/* HERO */}
              <section className="ev-hero">
                <div className="ev-hero-mark" aria-hidden="true">
                  <svg width="300" height="300" viewBox="20 10 390 390">
                    <circle cx="180" cy="168" r="126.5" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="45" />
                    <path d="M263 251C298 258 338 266 362 284C390 305 392 345 365 366C338 386 305 380 288 350C272 322 266 285 263 251Z" fill="rgba(31,169,113,.3)" />
                    <path d="M180 135L204 168L180 201L156 168Z" fill="rgba(98,214,168,.4)" />
                  </svg>
                </div>

                <div className="ev-hero-body">
                  <p className="ev-hero-welcome">Welcome,</p>
                  <h1 className="ev-hero-company">{companyName}</h1>
                  <p className="ev-hero-to">
                    to <span className="ev-wm">ENVIQUO</span>
                  </p>
                  <p className="ev-hero-sub">
                    Raise an enquiry, compare vendor quotes and close the loop in one place.
                  </p>

                 <div className="ev-hero-actions">
  <Link
    className="ev-btn ev-btn-lite"
    to="/buyer/enquiries/new"
    style={{
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: '1px solid #2563eb',
    }}
  >
    + Create enquiry
  </Link>

  <Link
    className="ev-btn ev-btn-ghost"
    to="/buyer/enquiries?view=quotes"
    style={{
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: '1px solid #2563eb',
    }}
  >
    📄 View quotes
  </Link>
</div>
                </div>
              </section>

              {/* STATS */}
              <div className="ev-stats">
                <div className="ev-stat">
                  <b>{counts.open}</b>
                  <span>Open enquiries</span>
                </div>
                <div className="ev-stat">
                  <b>{counts.pend}</b>
                  <span>Quotes waiting for you</span>
                </div>
                <div className="ev-stat">
                  <b>{counts.acc}</b>
                  <span>Accepted quotes</span>
                </div>
                <div className="ev-stat">
                  <b>{counts.hist}</b>
                  <span>Closed enquiries</span>
                </div>
              </div>

              {/* DOMAIN SHORTCUTS */}
              <h2 className="ev-h2">Start an enquiry</h2>
              <div className="ev-dgrid">
                {DOMAINS.map((d, i) => (
                  <Link
                    key={i}
                    to={`/buyer/enquiries/new?domain=${i}`}
                    className="ev-dc"
                  >
                    <span className="ev-dc-ico">{d.i}</span>
                    <strong>{d.n}</strong>
                    <span className="ev-dc-hint">Start an enquiry</span>
                  </Link>
                ))}
              </div>

              {/* MENU TILES */}
              <h2 className="ev-h2">Your workspace</h2>
              <div className="ev-mgrid">
                {MENU.map((m) => (
                  <Link key={m.id} to={m.to} className="ev-mt">
                    <span className="ev-mt-ico">{m.i}</span>
                    <span>
                      <strong>{m.l}</strong>
                      <small>{m.d}</small>
                    </span>
                    {menuCounts[m.countKey] != null && (
                      <span className="ev-mt-count">
                        {menuCounts[m.countKey]}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}