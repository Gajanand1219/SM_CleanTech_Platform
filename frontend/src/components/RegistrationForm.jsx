import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import './RegistrationForm.css'

/* =========================================================
   FIELD DEFINITIONS
   Format: [key, label, type, required]
   ========================================================= */

const buyerFields = [
  ['full_name', 'Full name', 'text', true],
  ['email', 'Business Email', 'email', true],
  ['phone', 'Phone', 'tel', true],
  ['password', 'Password', 'password', true],
  ['company_name', 'Company name', 'text', true],
  ['director_email', 'Director Email', 'email', true],
  ['industry', 'Industry', 'text', true],
  ['gst_number', 'GST number', 'text', false],
  ['website', 'Website', 'url', true],
  ['head_office_contact', 'Head office contact', 'tel', false],
  ['ehs_contact', 'EHS/EHS head contact', 'tel', false],
  ['registered_address', 'Registered address', 'text', true],
  ['plant_location', 'Plant location', 'text', true],
]

const vendorFields = [
  // BUSINESS INFORMATION FIRST
  ['company_name', 'Company name', 'text', true],
  ['industry_type', 'Industry type', 'text', true],
  ['area_of_work', 'Geographical Territories', 'text', true],
  ['experience_years', 'Experience (years)', 'number', true],
  ['capacity', 'Capacity', 'text', false],
  ['specialization', 'Specialization', 'text', true],
  ['gst_number', 'GST number', 'text', false],
  ['msme_number', 'MSME number', 'text', false],
  ['website', 'Website', 'url', true],
  ['contact_2', 'Contact NO', 'tel', true],
  ['director_email', 'Director Email', 'email', true],
  ['address', 'Address', 'text', true],


  // ACCOUNT INFORMATION SECOND
  ['full_name', 'Full name', 'text', true],
  ['email', 'Business Email', 'email', true],
  ['phone', 'Mobile Number', 'tel', true],
  ['password', 'Password', 'password', true],
]

const domains = [
  'Water & Wastewater Treatment',
  'Solid & Hazardous Waste',
  'Solar & Renewables',
  'Carbon & ESG',
  'SPCB Consents & Air Pollution'
]

/* =========================================================
   ERROR HELPER
   ========================================================= */

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item?.msg) {
          const location = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== 'body').join(' → ')
            : ''
          return location ? `${location}: ${item.msg}` : item.msg
        }
        return 'Invalid registration data'
      })
      .join(', ')
  }

  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string')
    return error.response.data.message
  if (typeof error?.message === 'string') return error.message

  return 'Registration failed. Please check your details.'
}

/* =========================================================
   REGISTRATION FORM
   ========================================================= */

export default function RegistrationForm({ type }) {
  const isBuyer = type === 'buyer'
  const fields = isBuyer ? buyerFields : vendorFields

  const [form, setForm] = useState({})
  const [selected, setSelected] = useState([])
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const nav = useNavigate()

  /* ================= UPDATE ================= */

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setMsg('')
    setMsgType('')
  }

  const toggleDomain = (domain) => {
    setSelected((prev) =>
      prev.includes(domain)
        ? prev.filter((item) => item !== domain)
        : [...prev, domain]
    )
    setMsg('')
    setMsgType('')
  }

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    const requiredFields = [
        'full_name',
        'email',
        'phone',
        'password',
        'company_name',
        'website'
      ]

    if (!isBuyer) {
      requiredFields.push(
        'industry_type',
        'address',
        'area_of_work',
        'experience_years',
        'specialization'
      )
    } else {
      requiredFields.push('industry', 'registered_address', 'plant_location')
    }

    for (const field of requiredFields) {
      if (!String(form[field] ?? '').trim()) {
        return `Please enter ${field.replaceAll('_', ' ')}.`
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) return 'Please enter a valid email address.'

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(form.phone.trim()))
      return 'Please enter a valid 10-digit Indian mobile number.'

    if (form.password.length < 8) return 'Password must contain at least 8 characters.'
    if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter.'
    if (!/[a-z]/.test(form.password)) return 'Password must contain at least one lowercase letter.'
    if (!/[0-9]/.test(form.password)) return 'Password must contain at least one number.'

    if (!isBuyer) {
      const experience = Number(form.experience_years)
      if (!Number.isFinite(experience) || experience < 0 || experience > 100)
        return 'Experience must be between 0 and 100 years.'
      if (selected.length === 0) return 'Please select at least one CleanTech domain.'
    }

    if (form.website?.trim()) {
      try {
        new URL(form.website.trim())
      } catch {
        return 'Please enter a valid website URL, e.g. https://example.com'
      }
    }

    return null
  }

  /* ================= SUBMIT ================= */

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setMsgType('')

    const validationError = validateForm()
    if (validationError) {
      setMsg(validationError)
      setMsgType('error')
      return
    }

    setLoading(true)

    try {
      const payload = { ...form }

      if (!isBuyer) {
        payload.experience_years = Number(form.experience_years)
        payload.domains = selected
      }

      const response = await API.post(`/auth/register/${type}`, payload)

      const successMessage =
        response.data?.message ||
        'Registration successful. Please verify your email.'

      setMsg(successMessage)
      setMsgType('success')

      /* SHOW SUCCESS POPUP */
      setShowSuccess(true)

      /* AUTO-REDIRECT AFTER 3 SEC */
      setTimeout(() => {
        nav(`/verify-email?email=${encodeURIComponent(form.email.trim())}`)
      }, 3000)
    } catch (error) {
      setMsg(getErrorMessage(error))
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  /* ================= ICONS ================= */

  const getIcon = (key) => {
    const icons = {
      full_name: '👤',
      email: '✉️',
      phone: '📱',
      password: '🔐',
      company_name: '🏢',
      industry: '🏭',
      industry_type: '🏭',
      registered_address: '📍',
      address: '📍',
      plant_location: '🏗️',
      gst_number: '🧾',
      website: '🌐',
      head_office_contact: '☎️',
      ehs_contact: '🛡️',
      area_of_work: '⚙️',
      experience_years: '📊',
      capacity: '⚡',
      specialization: '🎯',
      msme_number: '📄'
    }
    return icons[key] || '•'
  }

  /* ================= RENDER FIELD ================= */

  const renderField = ([key, label, kind = 'text', required = false]) => (
    <div
      className={`field-group ${
        key === 'registered_address' || key === 'plant_location' || key === 'address'
          ? 'field-group--wide'
          : ''
      }`}
      key={key}
    >
      <label>
        <span className="field-icon">{getIcon(key)}</span>
        {label}
        {required && <span className="required-star">*</span>}
      </label>

      <input
        type={kind}
        min={key === 'experience_years' ? 0 : undefined}
        max={key === 'experience_years' ? 100 : undefined}
        step={key === 'experience_years' ? 1 : undefined}
        value={form[key] ?? ''}
        onChange={(e) => updateField(key, e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        required={required}
      />
    </div>
  )

  /* ================= RENDER ================= */

  return (
    <div
      className={`registration-page ${
        isBuyer ? 'registration-page--buyer' : 'registration-page--vendor'
      }`}
    >
      <div className="registration-bg registration-bg--one" />
      <div className="registration-bg registration-bg--two" />

      {/* ================= TOP BAR ================= */}

      <div className="registration-topbar">
        <div className="registration-brand">
          <div className="registration-brand-logo">
            <img src="/logo2.jpeg" alt="SM Clean Tech" />
          </div>
          <div>
            <strong>SM Clean Tech</strong>
            <span>Engineering Solutions</span>
          </div>
        </div>

        <button type="button" className="back-home" onClick={() => nav('/')}>
          <span>←</span>
          Back
        </button>
      </div>

      {/* ================= MAIN — CENTERED FORM ================= */}

      <main className="registration-main registration-main--centered">
        <section className="registration-card">
          {/* HEADER */}
          <div className="registration-card-header">
            <div>
              <span className="form-kicker">
                {isBuyer ? 'BUYER REGISTRATION' : 'VENDOR REGISTRATION'}
              </span>
              <h2>Create your {isBuyer ? 'Buyer' : 'Vendor'} account</h2>
              <p>Fill in your business information to get started.</p>
            </div>

            <div className={`role-icon ${isBuyer ? 'role-icon--buyer' : 'role-icon--vendor'}`}>
              {isBuyer ? '🏢' : '🌱'}
            </div>
          </div>

          <form onSubmit={submit} className="modern-registration-form" noValidate>
            {/* =====================================================
                  BUYER REGISTRATION
                  01 Account Information
                  02 Business Information
              ===================================================== */}

              {isBuyer ? (
                <>
                  {/* SECTION 01 — ACCOUNT INFORMATION */}
                  <div className="form-section-title">
                    <span>01</span>
                    Account Information
                  </div>

                  <div className="registration-grid">
                    {buyerFields
                      .filter(([key]) =>
                        [
                          'full_name',
                          'email',
                          'phone',
                          'password'
                        ].includes(key)
                      )
                      .map(renderField)}
                  </div>

                  {/* SECTION 02 — BUSINESS INFORMATION */}
                  <div className="form-section-title">
                    <span>02</span>
                    Business Information
                  </div>

                  <div className="registration-grid">
                    {buyerFields
                      .filter(([key]) =>
                        [
                          'company_name',
                          'director_email',
                          'industry',
                          'registered_address',
                          'plant_location',
                          'gst_number',
                          'website',
                          'head_office_contact',
                          'ehs_contact'
                        ].includes(key)
                      )
                      .map(renderField)}
                  </div>
                </>
              ) : (
                <>
                  {/* =================================================
                      VENDOR REGISTRATION
                      01 Business Information
                      02 Account Information
                      03 CleanTech Domains
                  ================================================= */}

                  {/* SECTION 01 — BUSINESS INFORMATION */}
                  <div className="form-section-title">
                    <span>01</span>
                    Business Information
                  </div>

                  <div className="registration-grid">
                    {vendorFields
                      .filter(([key]) =>
                        [
                          'company_name',
                          'industry_type',
                          'address',
                          'area_of_work',
                          'experience_years',
                          'capacity',
                          'specialization',
                          'gst_number',
                          'msme_number',
                          'website',
                          'contact_2',
                          'director_email'
                        ].includes(key)
                      )
                      .map(renderField)}
                  </div>

                  {/* SECTION 02 — ACCOUNT INFORMATION */}
                  <div className="form-section-title">
                    <span>02</span>
                    Account Information
                  </div>

                  <div className="registration-grid">
                    {vendorFields
                      .filter(([key]) =>
                        [
                          'full_name',
                          'email',
                          'phone',
                          'password'
                        ].includes(key)
                      )
                      .map(renderField)}
                  </div><br></br>

                  {/* SECTION 03 — CLEANTECH DOMAINS */}
                  <div className="domain-section">
                    <div className="form-section-title">
                      <span>03</span>
                      CleanTech Domains
                      <span className="required-star">*</span>
                    </div>

                    <p className="domain-description">
                      Select the areas in which your company provides solutions.
                    </p>

                    <div className="domain-grid">
                      {domains.map((domain) => {
                        const active = selected.includes(domain)

                        return (
                          <button
                            type="button"
                            key={domain}
                            className={`domain-card ${
                              active ? 'domain-card--active' : ''
                            }`}
                            onClick={() => toggleDomain(domain)}
                          >
                            <span className="domain-check">
                              {active ? '✓' : '+'}
                            </span>

                            <span>{domain}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              <br />

            {/* MESSAGES */}
            {msg && (
              <div
                className={`registration-message ${
                  msgType === 'success'
                    ? 'registration-message--success'
                    : 'registration-message--error'
                }`}
              >
                <span className="message-icon">{msgType === 'success' ? '✓' : '!'}</span>
                <span>{msg}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMsg('')
                    setMsgType('')
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className={`registration-submit ${
                isBuyer ? 'registration-submit--buyer' : 'registration-submit--vendor'
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create {isBuyer ? 'Buyer' : 'Vendor'} Account
                  <span>→</span>
                </>
              )}
            </button>

            {/* FOOTER */}
            <div className="registration-footer">
              <span>Already have an account?</span>
              <button type="button" onClick={() => nav('/login')}>
                Login here
              </button>
            </div>

            <div className="secure-note">
              🔒 Your information is protected and securely processed.
            </div>
          </form>
        </section>
      </main>

      {/* ================= SUCCESS POPUP ================= */}

      {showSuccess && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-modal__icon">✓</div>

            <span className="success-modal__label">REGISTRATION COMPLETE</span>
            <h2>Account created successfully!</h2>

            <p className="success-modal__text">
              We've sent a verification email to
              <br />
              <strong>{form.email}</strong>
            </p>

            <p className="success-modal__hint">
              Redirecting you to verify your email...
            </p>

            <div className="success-modal__progress">
              <div className="success-modal__bar" />
            </div>

            <button
              type="button"
              className="success-modal__btn"
              onClick={() =>
                nav(`/verify-email?email=${encodeURIComponent(form.email.trim())}`)
              }
            >
              Verify Email Now
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
