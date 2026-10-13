import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import '../styles/BuyerDashboard.css'

const STATUS_GROUPS = {
  current: ['APPROVED', 'MATCHED', 'QUOTATION', 'SUBMITTED'],
  closed: ['CLOSED'],
}

const PAGE_INFO = {
  current: {
    title: 'Current Enquiries',
    description: 'Track your ongoing enquiries and vendor matching.',
  },
  quotes: {
    title: 'View Quotes',
    description: 'Enquiries that have received quotations.',
  },
  accepted: {
    title: 'Accepted Enquiries',
    description:
      'Enquiries where you accepted a quotation or completed the handshake.',
  },
  rejected: {
    title: 'Rejected Enquiries',
    description: 'Enquiries containing quotations rejected by you.',
  },
  closed: {
    title: 'Closed Enquiries',
    description: 'Review your closed enquiries.',
  },
  history: {
    title: 'Enquiry History',
    description: 'Review your previous enquiries.',
  },
}

const normalizeStatus = (value) =>
  String(value || '').toUpperCase().split('.').pop()

const statusClass = (status = '') => {
  const s = String(status).toLowerCase()

  if (['accepted', 'closed'].includes(s)) {
    return 'bd-status success'
  }

  if (['matched', 'quotation', 'quoted'].includes(s)) {
    return 'bd-status info'
  }

  if (['rejected', 'cancelled'].includes(s)) {
    return 'bd-status danger'
  }

  if (['approved', 'submitted', 'pending'].includes(s)) {
    return 'bd-status warning'
  }

  return 'bd-status'
}

const label = (value = '') =>
  String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

export default function BuyerDashboard() {
  const [data, setData] = useState({
    stats: {},
    enquiries: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()

  const requestedView = (
    searchParams.get('view') || ''
  ).toLowerCase()

  const view =
    requestedView === 'quote' ? 'quotes' : requestedView

  const isListingView = Boolean(view)
  const pageInfo = PAGE_INFO[view]

  useEffect(() => {
    let alive = true

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const { data: result } = await API.get('/buyer/dashboard')

        const summaries = Array.isArray(result?.enquiries)
          ? result.enquiries
          : []

        // Dashboard summary does not contain individual quotation statuses.
        // Fetch enquiry details to read quotation status and handshake data.
        const detailedEnquiries = await Promise.all(
          summaries.map(async (enquiry) => {
            try {
              const { data: detail } = await API.get(
                `/buyer/enquiries/${enquiry.id}`
              )

              const quotations = Array.isArray(detail?.quotations)
                ? detail.quotations
                : []

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
                  Boolean(handshake.buyer_accepted) ||
                  acceptedQuotations.length > 0,
                vendorAccepted: Boolean(handshake.vendor_accepted),
                mutualHandshake:
                  normalizeStatus(handshake.status) === 'MUTUAL' ||
                  Boolean(handshake.contact_unlocked),
              }
            } catch (detailError) {
              console.error(
                `Unable to load enquiry #${enquiry.id}:`,
                detailError
              )

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

        setData({
          stats: result?.stats || {},
          enquiries: detailedEnquiries,
        })
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

    loadDashboard()

    return () => {
      alive = false
    }
  }, [])

  const enquiries = data.enquiries

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const status = normalizeStatus(enquiry.status)

    switch (view) {
      case 'current':
        return STATUS_GROUPS.current.includes(status)

      case 'quotes':
        return Number(enquiry.quotations || 0) > 0

      case 'accepted':
        // Include buyer-accepted quotations and mutual handshakes.
        return (
          enquiry.buyerAccepted ||
          enquiry.mutualHandshake ||
          enquiry.acceptedQuotations.length > 0
        )

      case 'rejected':
        // Rejection belongs to the quotation, not the enquiry status.
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

  const stats = Object.entries(data.stats)

  const heading = pageInfo || {
    title: 'All Enquiries',
    description: 'Review all your enquiries and their progress.',
  }

  return (
    <PanelLayout
      role="buyer"
      title={isListingView ? heading.title : 'Buyer Dashboard'}
    >
      <div className="buyer-dashboard">
        {isListingView ? (
          <section className="bd-section">
            <div className="bd-heading">
              <div>
                <span className="bd-eyebrow">
                  BUYER WORKSPACE
                </span>
                <h3>{heading.title}</h3>
                <p>{heading.description}</p>
              </div>

              <Link
                className="bd-link"
                to="/buyer/enquiries/new"
              >
                + Create enquiry
              </Link>
            </div>

            {error ? (
              <div className="bd-error" role="alert">
                {error}
              </div>
            ) : loading ? (
              <div className="bd-loading">
                Loading enquiries...
              </div>
            ) : filteredEnquiries.length > 0 ? (
              <div className="bd-table">
                <div className="bd-row bd-row-head">
                  <span>Enquiry</span>
                  <span>Domain</span>
                  <span>Status</span>
                  <span>Activity</span>
                  <span />
                </div>

                {filteredEnquiries.map((enquiry) => (
                  <Link
                    className="bd-row"
                    to={`/buyer/enquiries/${enquiry.id}`}
                    key={enquiry.id}
                  >
                    <span className="bd-enquiry">
                      <b>#{enquiry.id}</b>
                      <span>
                        <strong>
                          {enquiry.title ||
                            `Enquiry #${enquiry.id}`}
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

                    <span className="bd-activity">
                      {enquiry.matches ?? 0} matches ·{' '}
                      {enquiry.quotations ?? 0} quotes
                    </span>

                    <span className="bd-arrow">↗</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bd-empty">
                <div>▤</div>
                <h4>No {heading.title.toLowerCase()} found</h4>
                <p>
                  No enquiries match this category right now.
                </p>

                {(view === 'quotes' || view === 'accepted' ||
                  view === 'rejected') && (
                  <Link
                    className="bd-btn bd-btn-primary"
                    to="/buyer/enquiries"
                  >
                    View all enquiries
                  </Link>
                )}

                {view === 'current' && (
                  <Link
                    className="bd-btn bd-btn-primary"
                    to="/buyer/enquiries/new"
                  >
                    + Create enquiry
                  </Link>
                )}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="bd-hero">
              <div>
                <span className="bd-eyebrow">
                  SM CLEANTECH · BUYER WORKSPACE
                </span>

                <h2>Good to see you again.</h2>

                <p>
                  Track technical enquiries, review vendor
                  quotations, and manage your CleanTech projects
                  in one place.
                </p>

                <div className="bd-actions">
                  <Link
                    className="bd-btn bd-btn-primary"
                    to="/buyer/enquiries/new"
                  >
                    + Create new enquiry
                  </Link>

                  <Link
                    className="bd-btn bd-btn-ghost"
                    to="/buyer/enquiries?view=current"
                  >
                    View current enquiries →
                  </Link>
                </div>
              </div>

              <div className="bd-hero-art" aria-hidden="true">
                <div className="bd-orbit one" />
                <div className="bd-orbit two" />
                <div className="bd-leaf">✦</div>

                <div className="bd-float-card">
                  <b>✓</b>
                  <span>
                    <strong>Smarter matching</strong>
                    <small>Requirements to solutions</small>
                  </span>
                </div>
              </div>
            </section>

            <section className="bd-section">
              <div className="bd-heading">
                <div>
                  <span className="bd-eyebrow">AT A GLANCE</span>
                  <h3>Enquiry overview</h3>
                </div>

                <span className="bd-live">
                  <i /> Live account data
                </span>
              </div>

              {error ? (
                <div className="bd-error">{error}</div>
              ) : loading ? (
                <div className="bd-loading">
                  Loading dashboard...
                </div>
              ) : stats.length ? (
                <div className="bd-stats">
                  {stats.map(([key, value], index) => {
                    const tones = [
                      'green',
                      'teal',
                      'blue',
                      'purple',
                    ]

                    const icons = ['▤', '◷', '◎', '₹']

                    return (
                      <article className="bd-stat" key={key}>
                        <div
                          className={`bd-stat-icon ${
                            tones[index % tones.length]
                          }`}
                        >
                          {icons[index % icons.length]}
                        </div>

                        <span className="bd-stat-label">
                          {label(key)}
                        </span>

                        <strong>{value ?? 0}</strong>
                        <small>From your account</small>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="bd-note">
                  Account statistics will appear here when available.
                </div>
              )}
            </section>

            <section className="bd-section">
              <div className="bd-heading">
                <div>
                  <span className="bd-eyebrow">YOUR ACTIVITY</span>
                  <h3>My enquiries</h3>
                  <p>
                    Review matching progress and quotations.
                  </p>
                </div>

                <Link
                  className="bd-link"
                  to="/buyer/enquiries"
                >
                  All enquiries →
                </Link>
              </div>

              {error ? (
                <div className="bd-error">{error}</div>
              ) : loading ? (
                <div className="bd-loading">
                  Loading your enquiries...
                </div>
              ) : enquiries.length ? (
                <div className="bd-table">
                  <div className="bd-row bd-row-head">
                    <span>Enquiry</span>
                    <span>Domain</span>
                    <span>Status</span>
                    <span>Activity</span>
                    <span />
                  </div>

                  {enquiries.map((enquiry) => (
                    <Link
                      className="bd-row"
                      to={`/buyer/enquiries/${enquiry.id}`}
                      key={enquiry.id}
                    >
                      <span className="bd-enquiry">
                        <b>#{enquiry.id}</b>
                        <span>
                          <strong>
                            {enquiry.title ||
                              `Enquiry #${enquiry.id}`}
                          </strong>
                          <small>Open enquiry details</small>
                        </span>
                      </span>

                      <span>{enquiry.domain || '—'}</span>

                      <span>
                        <i className={statusClass(enquiry.status)}>
                          {label(enquiry.status || 'unknown')}
                        </i>
                      </span>

                      <span className="bd-activity">
                        {enquiry.matches ?? 0} matches ·{' '}
                        {enquiry.quotations ?? 0} quotes
                      </span>

                      <span className="bd-arrow">↗</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bd-empty">
                  <h4>No enquiries yet</h4>
                  <p>
                    Start with your first technical requirement.
                  </p>
                  <Link
                    className="bd-btn bd-btn-primary"
                    to="/buyer/enquiries/new"
                  >
                    + Create your first enquiry
                  </Link>
                </div>
              )}
            </section>

            <section className="bd-workflow">
              <div>
                <span className="bd-eyebrow">HOW IT WORKS</span>
                <h3>From requirement to solution</h3>
                <p>
                  A clear process from enquiry to direct contact.
                </p>
              </div>

              <div className="bd-steps">
                {[
                  ['01', 'Create enquiry', 'Share your technical requirement.'],
                  ['02', 'Vendor matching', 'Relevant vendors are matched.'],
                  ['03', 'Review quotations', 'Compare technical and commercial offers.'],
                  ['04', 'Two-way handshake', 'Accept to unlock contact details.'],
                ].map(([number, title, description]) => (
                  <div key={number}>
                    <b>{number}</b>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PanelLayout>
  )
}
