import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/PanelLayout.css'

/**
 * Shared dashboard shell:
 *  - Left: vertical sidebar with nav links (role-based)
 *  - Right: top bar (title + user) + content area
 *
 * Props:
 *  - role: 'admin' | 'buyer' | 'vendor'
 *  - title: page title shown top-right
 *  - children: page content
 */

const MENUS = {
  admin: [
    { to: '/admin',          label: 'Dashboard',     icon: '📊', end: true },
    { to: '/admin/enquiries', label: 'Enquiries',    icon: '📋' },
    { to: '/admin/registrations', label: 'Participants', icon: '👥' },
  ],
 buyer: [
  { to: '/buyer',                   label: 'Dashboard',    icon: '📊', end: true },
  { to: '/buyer/enquiries/new',     label: 'New Enquiry',  icon: '➕' },
  { to: '/buyer/enquiries',         label: 'My Enquiries', icon: '📋' },  // खाली route add कर
  { to: '/buyer/crm',               label: 'CRM History',  icon: '🗂️' },
],
  vendor: [
  { to: '/vendor',             label: 'Dashboard',     icon: '📊', end: true },
  { to: '/vendor/enquiries',   label: 'Leads & Quotes', icon: '📋' },
  { to: '/vendor/crm',         label: 'CRM History',    icon: '🗂️' },  // ✅ नवीन
],
}

const ROLE_LABEL = {
  admin: 'Administrator',
  buyer: 'Buyer',
  vendor: 'Vendor',
}

const ROLE_ACCENT = {
  admin: 'var(--accent)',
  buyer: 'var(--accent)',
  vendor: 'var(--vendor-accent)',
}

export default function PanelLayout({ role = 'admin', title = 'Dashboard', children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const items = MENUS[role] || MENUS.admin
  const roleLabel = ROLE_LABEL[role] || role
  const initial = (user?.name || user?.email || roleLabel).charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className={`panel-shell panel-shell--${role}`}>
      {/* ================= SIDEBAR ================= */}
      <aside className="panel-sidebar">
        {/* Brand */}
        <div className="panel-sidebar__brand">
          <div className="panel-sidebar__logo">
            <img src="/logo.jpeg" alt="SM Clean Tech" />
          </div>
          <div>
            <strong>SM Clean Tech</strong>
            <span>Engineering Solutions</span>
          </div>
        </div>

        {/* Role badge */}
        <div className="panel-sidebar__role">
          <span className="panel-sidebar__role-dot" />
          {roleLabel} Panel
        </div>

        {/* Nav links */}
        <nav className="panel-sidebar__nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `panel-sidebar__link ${isActive ? 'is-active' : ''}`
              }
            >
              <span className="panel-sidebar__link-icon">{item.icon}</span>
              <span className="panel-sidebar__link-label">{item.label}</span>
              <span className="panel-sidebar__link-glow" />
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="panel-sidebar__user">
          <div
            className={`panel-sidebar__avatar panel-sidebar__avatar--${role}`}
          >
            {initial}
          </div>
          <div className="panel-sidebar__user-info">
            <strong>{user?.name || roleLabel}</strong>
            <span>{user?.email || '—'}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          className="panel-sidebar__logout"
          onClick={handleLogout}
        >
          <span>⏻</span>
          Logout
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="panel-body">
        {/* Top bar */}
        <header className="panel-topbar">
          <div className="panel-topbar__left">
            <h1 className="panel-topbar__title">{title}</h1>
            <span className="panel-topbar__sub">
              Welcome back, {user?.name || roleLabel}
            </span>
          </div>

          <div className="panel-topbar__right">
            <div className="panel-topbar__chip">
              <span className="panel-topbar__chip-dot" />
              {roleLabel}
            </div>

            <div
              className={`panel-topbar__avatar panel-topbar__avatar--${role}`}
              title={user?.email}
            >
              {initial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="panel-content">
          {children}
        </main>
      </div>
    </div>
  )
}