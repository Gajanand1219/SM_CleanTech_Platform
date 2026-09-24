import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import './RegistrationForm.css'

const buyerFields = [
  ['full_name', 'Contact person', 'text'],
  ['email', 'Email', 'email'],
  ['phone', 'Phone', 'tel'],
  ['password', 'Password', 'password'],
  ['company_name', 'Company name', 'text'],
  ['industry', 'Industry', 'text'],
  ['registered_address', 'Registered address', 'text'],
  ['plant_location', 'Plant location', 'text'],
  ['gst_number', 'GST number', 'text'],
  ['website', 'Website', 'url'],
  ['head_office_contact', 'Head office contact', 'tel'],
  ['ehs_contact', 'EHS/EHS head contact', 'tel'],
]

const vendorFields = [
  ['full_name', 'Contact person', 'text'],
  ['email', 'Email', 'email'],
  ['phone', 'Phone', 'tel'],
  ['password', 'Password', 'password'],
  ['company_name', 'Company name', 'text'],
  ['industry_type', 'Industry type', 'text'],
  ['address', 'Address', 'text'],
  ['area_of_work', 'Area of work', 'text'],
  ['experience_years', 'Experience (years)', 'number'],
  ['capacity', 'Capacity', 'text'],
  ['specialization', 'Specialization', 'text'],
  ['gst_number', 'GST number', 'text'],
  ['msme_number', 'MSME number', 'text'],
  ['website', 'Website', 'url'],
]

const domains = [
  'Water & Wastewater Treatment',
  'Solid & Hazardous Waste',
  'Solar & Renewables',
  'Carbon & ESG',
  'SPCB Consents & Air Pollution',
]

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
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  if (typeof error?.message === 'string') return error.message

  return 'Registration failed. Please check your details.'
}

export default function RegistrationForm({ type }) {
  const isBuyer = type === 'buyer'
  const fields = isBuyer ? buyerFields : vendorFields

  const [form, setForm] = useState({})
  const [selected, setSelected] = useState([])
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')
  const [loading, setLoading] = useState(false)

  const nav = useNavigate()

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

  const validateForm = () => {
    const requiredFields = ['full_name', 'email', 'phone', 'password', 'company_name']

    if (!isBuyer) {
      requiredFields.push(
        'industry_type', 'address', 'area_of_work', 'experience_years', 'specialization'
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

    // if (form.gst_number?.trim()) {
    //   const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
    //   if (!gstRegex.test(form.gst_number.trim().toUpperCase()))
    //     return 'Please enter a valid GST number.'
    // }

    if (form.website?.trim()) {
      try { new URL(form.website.trim()) }
      catch { return 'Please enter a valid website URL, e.g. https://example.com' }
    }

    return null
  }

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

      setMsg(response.data?.message || 'Registration successful. Please verify your email.')
      setMsgType('success')

      setTimeout(() => {
        nav(`/verify-email?email=${encodeURIComponent(form.email.trim())}`)
      }, 1200)
    } catch (error) {
      setMsg(getErrorMessage(error))
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (key) => {
    const icons = {
      full_name: '👤', email: '✉️', phone: '📱', password: '🔐',
      company_name: '🏢', industry: '🏭', industry_type: '🏭',
      registered_address: '📍', address: '📍', plant_location: '🏗️',
      gst_number: '🧾', website: '🌐', head_office_contact: '☎️',
      ehs_contact: '🛡️', area_of_work: '⚙️', experience_years: '📊',
      capacity: '⚡', specialization: '🎯', msme_number: '📄',
    }
    return icons[key] || '•'
  }

  const renderField = ([key, label, kind = 'text']) => (
    <div
      className={`field-group ${
        key === 'registered_address' ||
        key === 'plant_location' ||
        key === 'address'
          ? 'field-group--wide'
          : ''
      }`}
      key={key}
    >
      <label>
        <span className="field-icon">{getIcon(key)}</span>
        {label}
      </label>

      <input
        type={kind}
        min={key === 'experience_years' ? 0 : undefined}
        max={key === 'experience_years' ? 100 : undefined}
        step={key === 'experience_years' ? 1 : undefined}
        value={form[key] ?? ''}
        onChange={(e) => updateField(key, e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  )

  return (
    <div
      className={`registration-page ${
        isBuyer ? 'registration-page--buyer' : 'registration-page--vendor'
      }`}
    >
      <div className="registration-bg registration-bg--one" />
      <div className="registration-bg registration-bg--two" />

      {/* Top bar */}
      <div className="registration-topbar">
        

        <div className="registration-brand">
          <div className="registration-brand-logo">
            <img src="/logo.jpeg" alt="SM Clean Tech" />
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

      {/* Main grid: LEFT = form, RIGHT = info */}
      <main className="registration-main">

        {/* LEFT — FORM CARD (with inner scroll) */}
        <section className="registration-card">
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
            <div className="form-section-title">
              <span>01</span>
              Account Information
            </div>

            <div className="registration-grid">
              {fields.slice(0, 4).map(renderField)}
            </div>

            <div className="form-section-title">
              <span>02</span>
              Business Information
            </div>

            <div className="registration-grid">
              {fields.slice(4).map(renderField)}
            </div>

            {!isBuyer && (
              <div className="domain-section">
                <div className="form-section-title">
                  <span>03</span>
                  CleanTech Domains
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
                        className={`domain-card ${active ? 'domain-card--active' : ''}`}
                        onClick={() => toggleDomain(domain)}
                      >
                        <span className="domain-check">{active ? '✓' : '+'}</span>
                        <span>{domain}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

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
                <button type="button" onClick={() => { setMsg(''); setMsgType('') }}>
                  ×
                </button>
              </div>
            )}

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

        {/* RIGHT — INFO PANEL (fixed, no scroll) */}
        <aside className="registration-intro">
          <div className="intro-badge">
            <span className="intro-dot" />
            {isBuyer ? 'Buyer Network' : 'Provider Network'}
          </div>

          <h1>
            {isBuyer ? (
              <>
                Connect your <span>industrial needs</span> with trusted solutions.
              </>
            ) : (
              <>
                Grow your <span>CleanTech business</span> with new opportunities.
              </>
            )}
          </h1>

          <p>
            {isBuyer
              ? 'Create your buyer account and connect with qualified CleanTech solution providers.'
              : 'Create your provider account and showcase your CleanTech capabilities.'}
          </p>

          {/* MIDDLE — LOGO */}
          <div className="intro-logo">
            <div className="intro-logo__halo" />
            <div className="intro-logo__frame">
              <img src="/logo.jpeg" alt="SM Clean Tech" />
            </div>
          </div>

          {/* BOTTOM — FEATURES */}
          <div className="intro-features">
            <div className="intro-feature">
              <div className="feature-icon">✓</div>
              <div>
                <strong>Verified Network</strong>
                <span>Relevant businesses only</span>
              </div>
            </div>

            <div className="intro-feature">
              <div className="feature-icon">⚡</div>
              <div>
                <strong>Fast Connections</strong>
                <span>Quick opportunity matching</span>
              </div>
            </div>

            <div className="intro-feature">
              <div className="feature-icon">🔒</div>
              <div>
                <strong>Secure Account</strong>
                <span>Email verification</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}