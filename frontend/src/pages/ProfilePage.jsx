import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PanelLayout from '../components/PanelLayout'
import API from '../services/api'
import '../styles/ProfilePage.css'

export default function ProfilePage() {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const role = profile?.role || user?.role || 'buyer'

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/auth/profile')

      const data = response.data

      setProfile(data)
      setForm(data)

    } catch (err) {
      console.error('Profile load error:', err)

      setError(
        err?.response?.data?.detail ||
        'Unable to load profile.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // UPDATE FIELD
  // ============================================================

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <PanelLayout
        role={user?.role || 'buyer'}
        title="My Profile"
      >
        <div className="profile-page">
          <div className="profile-card">
            <div className="profile-loading">
              Loading profile...
            </div>
          </div>
        </div>
      </PanelLayout>
    )
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <PanelLayout
        role={user?.role || 'buyer'}
        title="My Profile"
      >
        <div className="profile-page">
          <div className="profile-card">
            <div className="profile-error">
              <strong>Unable to load profile</strong>

              <p>{error}</p>

              <button
                type="button"
                className="profile-update-btn"
                onClick={loadProfile}
              >
                Try Again
                <span>↻</span>
              </button>
            </div>
          </div>
        </div>
      </PanelLayout>
    )
  }

  // ============================================================
  // INITIAL
  // ============================================================

  const initial = (
    form?.full_name ||
    form?.email ||
    role
  )
    .charAt(0)
    .toUpperCase()

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <PanelLayout
      role={role}
      title="My Profile"
    >
      <div className="profile-page">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="profile-header">

          <div>
            <span className="profile-kicker">
              ACCOUNT SETTINGS
            </span>

            <h2>
              My Profile
            </h2>

            <p>
              View and update your account information.
            </p>
          </div>

          <div
            className={`profile-avatar profile-avatar--${role}`}
          >
            {initial}
          </div>

        </div>


        {/* =====================================================
            PROFILE CARD
        ====================================================== */}

        <div className="profile-card">


          {/* ===================================================
              ACCOUNT INFORMATION
          ==================================================== */}

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
                value={form.full_name || ''}
                onChange={(e) =>
                  updateField(
                    'full_name',
                    e.target.value
                  )
                }
                placeholder="Enter full name"
              />

            </div>


            {/* BUSINESS EMAIL */}

            <div className="profile-field">

              <label>
                <span>✉️</span>
                Business Email
              </label>

              <input
                type="email"
                value={form.email || ''}
                disabled
                className="profile-input-disabled"
              />

              <small>
                Email address cannot be changed.
              </small>

            </div>


            {/* MOBILE NUMBER */}

            <div className="profile-field">

              <label>
                <span>📱</span>
                Mobile Number
              </label>

              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) =>
                  updateField(
                    'phone',
                    e.target.value
                  )
                }
                placeholder="Enter mobile number"
              />

            </div>

          </div>


          {/* ===================================================
              BUYER INFORMATION
          ==================================================== */}

          {role === 'buyer' && (
            <>
              <div className="profile-section-title">
                <span>02</span>
                Business Information
              </div>

              <div className="profile-grid">

                {/* COMPANY NAME */}

                <div className="profile-field">
                  <label>
                    <span>🏢</span>
                    Company Name
                  </label>

                  <input
                    type="text"
                    value={form.company_name || ''}
                    onChange={(e) =>
                      updateField(
                        'company_name',
                        e.target.value
                      )
                    }
                    placeholder="Enter company name"
                  />
                </div>


                {/* DIRECTOR EMAIL */}

                <div className="profile-field">
                  <label>
                    <span>✉️</span>
                    Director Email
                  </label>

                  <input
                    type="email"
                    value={form.director_email || ''}
                    onChange={(e) =>
                      updateField(
                        'director_email',
                        e.target.value
                      )
                    }
                    placeholder="Enter director email"
                  />
                </div>


                {/* INDUSTRY */}

                <div className="profile-field">
                  <label>
                    <span>🏭</span>
                    Industry
                  </label>

                  <input
                    type="text"
                    value={form.industry || ''}
                    onChange={(e) =>
                      updateField(
                        'industry',
                        e.target.value
                      )
                    }
                    placeholder="Enter industry"
                  />
                </div>


                {/* GST */}

                <div className="profile-field">
                  <label>
                    <span>📄</span>
                    GST Number
                  </label>

                  <input
                    type="text"
                    value={form.gst_number || ''}
                    onChange={(e) =>
                      updateField(
                        'gst_number',
                        e.target.value
                      )
                    }
                    placeholder="Enter GST number"
                  />
                </div>


                {/* WEBSITE */}

                <div className="profile-field">
                  <label>
                    <span>🌐</span>
                    Website
                  </label>

                  <input
                    type="url"
                    value={form.website || ''}
                    onChange={(e) =>
                      updateField(
                        'website',
                        e.target.value
                      )
                    }
                    placeholder="https://example.com"
                  />
                </div>


                {/* HEAD OFFICE CONTACT */}

                <div className="profile-field">
                  <label>
                    <span>☎️</span>
                    Head Office Contact
                  </label>

                  <input
                    type="tel"
                    value={
                      form.head_office_contact || ''
                    }
                    onChange={(e) =>
                      updateField(
                        'head_office_contact',
                        e.target.value
                      )
                    }
                    placeholder="Enter contact number"
                  />
                </div>


                {/* EHS CONTACT */}

                <div className="profile-field">
                  <label>
                    <span>🦺</span>
                    EHS Contact
                  </label>

                  <input
                    type="tel"
                    value={form.ehs_contact || ''}
                    onChange={(e) =>
                      updateField(
                        'ehs_contact',
                        e.target.value
                      )
                    }
                    placeholder="Enter EHS contact"
                  />
                </div>


                {/* REGISTERED ADDRESS */}

                <div className="profile-field">
                  <label>
                    <span>📍</span>
                    Registered Address
                  </label>

                  <input
                    type="text"
                    value={
                      form.registered_address || ''
                    }
                    onChange={(e) =>
                      updateField(
                        'registered_address',
                        e.target.value
                      )
                    }
                    placeholder="Enter registered address"
                  />
                </div>


                {/* PLANT LOCATION */}

                <div className="profile-field">
                  <label>
                    <span>🏭</span>
                    Plant Location
                  </label>

                  <input
                    type="text"
                    value={
                      form.plant_location || ''
                    }
                    onChange={(e) =>
                      updateField(
                        'plant_location',
                        e.target.value
                      )
                    }
                    placeholder="Enter plant location"
                  />
                </div>

              </div>
            </>
          )}


          {/* ===================================================
              VENDOR INFORMATION
          ==================================================== */}

          {role === 'vendor' && (
            <>
              <div className="profile-section-title">
                <span>02</span>
                Business Information
              </div>

              <div className="profile-grid">

                {/* COMPANY NAME */}

                <div className="profile-field">
                  <label>
                    <span>🏢</span>
                    Company Name
                  </label>

                  <input
                    type="text"
                    value={form.company_name || ''}
                    onChange={(e) =>
                      updateField(
                        'company_name',
                        e.target.value
                      )
                    }
                    placeholder="Enter company name"
                  />
                </div>


                {/* INDUSTRY TYPE */}

                <div className="profile-field">
                  <label>
                    <span>🏭</span>
                    Industry Type
                  </label>

                  <input
                    type="text"
                    value={form.industry_type || ''}
                    onChange={(e) =>
                      updateField(
                        'industry_type',
                        e.target.value
                      )
                    }
                    placeholder="Enter industry type"
                  />
                </div>


                {/* INDUSTRY VERTICALS */}

                <div className="profile-field">
                  <label>
                    <span>📌</span>
                    Industry Verticals
                  </label>

                  <input
                    type="text"
                    value={
                      form.industry_verticals || ''
                    }
                    onChange={(e) =>
                      updateField(
                        'industry_verticals',
                        e.target.value
                      )
                    }
                    placeholder="Enter industry verticals"
                  />
                </div>


                {/* ADDRESS */}

                <div className="profile-field">
                  <label>
                    <span>📍</span>
                    Address
                  </label>

                  <input
                    type="text"
                    value={form.address || ''}
                    onChange={(e) =>
                      updateField(
                        'address',
                        e.target.value
                      )
                    }
                    placeholder="Enter address"
                  />
                </div>


                {/* GEOGRAPHICAL TERRITORIES */}

                <div className="profile-field">
                  <label>
                    <span>🗺️</span>
                    Geographical Territories
                  </label>

                  <input
                    type="text"
                    value={
                      form.area_of_work || ''
                    }
                    onChange={(e) =>
                      updateField(
                        'area_of_work',
                        e.target.value
                      )
                    }
                    placeholder="Enter geographical territories"
                  />
                </div>


                {/* EXPERIENCE */}

                <div className="profile-field">
                  <label>
                    <span>📅</span>
                    Experience (years)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.experience_years ?? ''
                    }
                    onChange={(e) =>
                      updateField(
                        'experience_years',
                        e.target.value
                      )
                    }
                    placeholder="Enter experience"
                  />
                </div>


                {/* CAPACITY */}

                <div className="profile-field">
                  <label>
                    <span>⚙️</span>
                    Capacity
                  </label>

                  <input
                    type="text"
                    value={form.capacity || ''}
                    onChange={(e) =>
                      updateField(
                        'capacity',
                        e.target.value
                      )
                    }
                    placeholder="Enter capacity"
                  />
                </div>


                {/* SPECIALIZATION */}

                <div className="profile-field">
                  <label>
                    <span>🎯</span>
                    Specialization
                  </label>

                  <input
                    type="text"
                    value={
                      form.specialization || ''
                    }
                    onChange={(e) =>
                      updateField(
                        'specialization',
                        e.target.value
                      )
                    }
                    placeholder="Enter specialization"
                  />
                </div>


                {/* GST */}

                <div className="profile-field">
                  <label>
                    <span>📄</span>
                    GST Number
                  </label>

                  <input
                    type="text"
                    value={form.gst_number || ''}
                    onChange={(e) =>
                      updateField(
                        'gst_number',
                        e.target.value
                      )
                    }
                    placeholder="Enter GST number"
                  />
                </div>


                {/* MSME */}

                <div className="profile-field">
                  <label>
                    <span>📑</span>
                    MSME Number
                  </label>

                  <input
                    type="text"
                    value={form.msme_number || ''}
                    onChange={(e) =>
                      updateField(
                        'msme_number',
                        e.target.value
                      )
                    }
                    placeholder="Enter MSME number"
                  />
                </div>


                {/* WEBSITE */}

                <div className="profile-field">
                  <label>
                    <span>🌐</span>
                    Website
                  </label>

                  <input
                    type="url"
                    value={form.website || ''}
                    onChange={(e) =>
                      updateField(
                        'website',
                        e.target.value
                      )
                    }
                    placeholder="https://example.com"
                  />
                </div>


                {/* CONTACT 2 */}

                <div className="profile-field">
                  <label>
                    <span>📱</span>
                    Contact No
                  </label>

                  <input
                    type="tel"
                    value={form.contact_2 || ''}
                    onChange={(e) =>
                      updateField(
                        'contact_2',
                        e.target.value
                      )
                    }
                    placeholder="Enter contact number"
                  />
                </div>


                {/* DIRECTOR EMAIL */}

                <div className="profile-field">
                  <label>
                    <span>✉️</span>
                    Director Email
                  </label>

                  <input
                    type="email"
                    value={
                      form.director_email || ''
                    }
                    onChange={(e) =>
                      updateField(
                        'director_email',
                        e.target.value
                      )
                    }
                    placeholder="Enter director email"
                  />
                </div>

              </div>


              {/* =================================================
                  SERVICE DOMAINS
              ================================================== */}

              <div className="profile-section-title">
                <span>03</span>
                Service Domains
              </div>

              <div className="domain-list">

                {Array.isArray(form.domains) &&
                form.domains.length > 0 ? (
                  form.domains.map(
                    (domain, index) => (
                      <span
                        key={index}
                        className="domain-tag"
                      >
                        {domain}
                      </span>
                    )
                  )
                ) : (
                  <span>
                    No domains selected
                  </span>
                )}

              </div>

            </>
          )}


          {/* ===================================================
              SECURITY
          ==================================================== */}

          <div className="profile-section-title">
            <span>
              {role === 'vendor' ? '04' : '03'}
            </span>
            Security
          </div>


          <div className="profile-security-note">

            <span>🔐</span>

            <div>
              <strong>Password</strong>

              <p>
                Your password is hidden for security
                reasons. Password changes can be
                handled separately.
              </p>
            </div>

          </div>


          {/* ===================================================
              UPDATE BUTTON
          ==================================================== */}

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
