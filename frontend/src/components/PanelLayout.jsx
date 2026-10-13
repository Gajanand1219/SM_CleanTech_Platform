import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'
import '../styles/PanelLayout.css'
import profileImage from '../Profile.png'

const MENUS = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '⌂', end: true },
    { to: '/admin/enquiries', label: 'Enquiries', icon: '☷' },
    { to: '/admin/registrations', label: 'Participants', icon: '♙' },
  ],

  buyer: [
    { to: '/buyer', label: 'Dashboard', icon: '⌂', end: true },
    { to: '/buyer/enquiries/new', label: '1. Create enquiry', icon: '+' },
    {
      to: '/buyer/enquiries',
      label: '2. Current enquiry',
      icon: '☷',
      countKey: 'current',
    },
    {
      to: '/buyer/enquiries',
      label: '3. View quote',
      icon: '▯',
      countKey: 'quotes',
    },
    {
      to: '/buyer/enquiries',
      label: '4. Accepted',
      icon: '✓',
      countKey: 'accepted',
    },
    {
      to: '/buyer/enquiries',
      label: '5. Rejected',
      icon: '×',
      countKey: 'rejected',
    },
    {
      to: '/buyer/enquiries',
      label: '6. Closed',
      icon: '♙',
      countKey: 'closed',
    },
    {
      to: '/buyer/enquiries',
      label: '7. History',
      icon: '◷',
      countKey: 'history',
    },
  ],

  vendor: [
    { to: '/vendor', label: 'Dashboard', icon: '⌂', end: true },
    { to: '/vendor/enquiries', label: 'Leads', icon: '☷' },
    { to: '/vendor/crm', label: 'CRM', icon: '▣' },
  ],
}

const ROLE_LABEL = {
  admin: 'Administrator',
  buyer: 'Buyer',
  vendor: 'Vendor',
}

export default function PanelLayout({
  role = 'admin',
  title = 'Dashboard',
  children,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [buyerCounts, setBuyerCounts] = useState({
    current: 0,
    quotes: 0,
    accepted: 0,
    rejected: 0,
    closed: 0,
    history: 0,
  })

  const items = MENUS[role] || MENUS.admin
  const roleLabel = ROLE_LABEL[role] || role

  const initial = (
    user?.name ||
    user?.email ||
    roleLabel
  ).charAt(0).toUpperCase()

  useEffect(() => {
    if (role !== 'buyer') return

    let active = true

    API.get('/buyer/dashboard')
      .then(({ data }) => {
        if (!active) return

        const stats = data?.stats || {}
        const enquiries = Array.isArray(data?.enquiries)
          ? data.enquiries
          : []

        const getStat = (...keys) => {
          const key = Object.keys(stats).find((item) =>
            keys.includes(item.toLowerCase())
          )

          return key !== undefined
            ? Number(stats[key]) || 0
            : null
        }

        const countByStatus = (...statuses) =>
          enquiries.filter((enquiry) =>
            statuses.includes(
              String(enquiry.status || '').toUpperCase()
            )
          ).length

        setBuyerCounts({
          current:
            getStat(
              'open_enquiries',
              'current_enquiries',
              'current',
              'open'
            ) ??
            countByStatus('APPROVED', 'MATCHED', 'QUOTATION'),

          quotes:
            getStat(
              'quotations',
              'quotes',
              'total_quotations'
            ) ?? 0,

          accepted:
            getStat(
              'accepted',
              'accepted_quotes',
              'accepted_quotations'
            ) ?? 0,

          rejected:
            getStat(
              'rejected',
              'rejected_quotes',
              'rejected_quotations'
            ) ?? 0,

          closed:
            getStat(
              'closed',
              'closed_enquiries'
            ) ?? countByStatus('CLOSED'),

          history:
            getStat(
              'history',
              'history_enquiries'
            ) ?? 0,
        })
      })
      .catch((error) => {
        console.error(
          'Unable to load buyer sidebar counts:',
          error
        )
      })

    return () => {
      active = false
    }
  }, [role])

  const closeMobile = () => {
    setMobileOpen(false)
  }

  const handleLogout = () => {
    closeMobile()
    logout()
    navigate('/')
  }

  return (
    <div className={`panel-shell panel-shell--${role}`}>
      {mobileOpen && (
        <button
          type="button"
          className="panel-scrim"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      )}

{/* SIDEBAR */}
<aside className={`panel-sidebar ${mobileOpen ? 'is-open' : ''}`}>
  <NavLink
    to={role === 'admin' ? '/admin' : role === 'vendor' ? '/vendor' : '/buyer'}
    end


    
    onClick={closeMobile}
    className={({ isActive }) =>
      `sc-menu-item sc-dashboard ${isActive ? 'active' : ''}`
    }
  >
    <span className="sc-icon">⌂</span>
    <span className="sc-menu-text">Dashboard</span>
  </NavLink>

  <div className="sc-menu-divider" />

  <nav className="sc-menu">
    {items
      .filter((item) => !item.end && item.label !== 'Dashboard')
      .map((item) => (
        <NavLink
          key={item.label}
          to={
            item.countKey
              ? `${item.to}?view=${item.countKey}`
              : item.to
          }
          onClick={closeMobile}
          className={({ isActive }) =>
            `sc-menu-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="sc-icon">{item.icon}</span>
          <span className="sc-menu-text">{item.label}</span>

          {item.countKey && role === 'buyer' && (
            <span className="sc-count">
              {buyerCounts[item.countKey] ?? 0}
            </span>
          )}
        </NavLink>
      ))}
  </nav>

  <div className="panel-sidebar-bottom">
    <div className="panel-help">
      <b>✦ Need assistance?</b>
      <span>Manage your CleanTech workflow from one place.</span>
    </div>

    <div className="panel-user">
      <div className={`panel-user-avatar ${role}`}>{initial}</div>
      <div className="panel-user-info">
        <strong>{user?.name || roleLabel}</strong>
        <span>{user?.email || '—'}</span>
      </div>
    </div>

    <button
      type="button"
      className="panel-logout"
      onClick={handleLogout}
    >
      ↪ &nbsp; Sign out
    </button>
  </div>
</aside>

      {/* MAIN CONTENT */}
      <div className="panel-main">
        <header className="panel-topbar">
          <div className="panel-top-left">
            <button
              type="button"
              className="panel-menu-button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() =>
                setMobileOpen((previous) => !previous)
              }
            >
              ☰
            </button>

            <div>
              <span className="panel-breadcrumb">
                SM CLEANTECH / {roleLabel.toUpperCase()}
              </span>

              <h1>{title}</h1>
            </div>
          </div>

          <div className="panel-top-right">
            <span className="panel-secure">
              <i />
              Secure workspace
            </span>

            <span className="panel-divider" />

            <button
              type="button"
              className={`panel-profile panel-profile-${role}`}
              title="My Profile"
              aria-label="Open my profile"
              onClick={() => navigate('/profile')}
            >
              <span className="profile-avatar-animation">
                <span className="profile-avatar-ring" />

                <img
                  src={profileImage}
                  alt=""
                />
              </span>
            </button>
          </div>
        </header>

        <main className="panel-content">
          {children}
        </main>

        <footer className="panel-footer">
          <span>
            © {new Date().getFullYear()} SM CleanTech Engineering Solutions
          </span>

          <span>
            Diagnose. Match. Solution.
          </span>
        </footer>
      </div>
    </div>
  )
}
