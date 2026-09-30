import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PanelLayout from '../components/PanelLayout'
import '../styles/ProfilePage.css'

export default function ProfilePage() {
  const { user } = useAuth()

  const role = user?.role || 'buyer'

  const [form, setForm] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  useEffect(() => {
    setForm({
      full_name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
  }, [user])

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <PanelLayout role={role} title="My Profile">
      <div className="profile-page">

        {/* HEADER */}
        <div className="profile-header">
          <div>
            <span className="profile-kicker">ACCOUNT SETTINGS</span>
            <h2>My Profile</h2>
            <p>
              View and update your account information.
            </p>
          </div>

          <div className={`profile-avatar profile-avatar--${role}`}>
            {(form.full_name || form.email || role)
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="profile-card">

          {/* ACCOUNT INFORMATION */}
          <div className="profile-section-title">
            <span>01</span>
            Account Information
          </div>

          <div className="profile-grid">

            {/* FULL NAME */}
            <div className="profile-field">
              <label>
                <span>👤</span>
                Full name
              </label>

              <input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  updateField('full_name', e.target.value)
                }
                placeholder="Enter full name"
              />
            </div>

            {/* EMAIL - READ ONLY */}
            <div className="profile-field">
              <label>
                <span>✉️</span>
                Business Email
              </label>

              <input
                type="email"
                value={form.email}
                disabled
                className="profile-input-disabled"
              />

              <small>
                Email address cannot be changed.
              </small>
            </div>

            {/* PHONE */}
            <div className="profile-field">
              <label>
                <span>📱</span>
                Mobile Number
              </label>

              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  updateField('phone', e.target.value)
                }
                placeholder="Enter mobile number"
              />
            </div>

          </div>

          {/* SECURITY */}
          <div className="profile-section-title">
            <span>02</span>
            Security
          </div>

          <div className="profile-security-note">
            <span>🔐</span>

            <div>
              <strong>Password</strong>
              <p>
                Your password is hidden for security reasons.
                Password changes can be handled separately.
              </p>
            </div>
          </div>

          {/* UPDATE BUTTON */}
          <div className="profile-actions">
            <button
              type="button"
              className="profile-update-btn"
            >
              Update Profile
              <span>→</span>
            </button>
          </div>

        </div>
      </div>
    </PanelLayout>
  )
}
