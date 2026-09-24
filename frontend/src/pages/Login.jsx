import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
// import './Login.css'

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
        return 'Invalid request'
      })
      .join(', ')
  }

  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  if (typeof error?.message === 'string') return error.message

  return 'Login failed. Please try again.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login({
        email: email.trim(),
        password,
      })

      if (data.role === 'admin') navigate('/admin', { replace: true })
      else if (data.role === 'buyer') navigate('/buyer', { replace: true })
      else if (data.role === 'vendor') navigate('/vendor', { replace: true })
      else setError('Unknown user role.')
    } catch (err) {
      console.error('Login error:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg login-bg--one" />
      <div className="login-bg login-bg--two" />

      {/* Top bar */}
      <div className="login-topbar">
        <button type="button" className="back-home" onClick={() => navigate('/')}>
          <span>←</span>
          Back
        </button>

        <div className="login-brand">
          <div className="login-brand-logo">
            <img src="/logo.jpeg" alt="SM Clean Tech" />
          </div>
          <div>
            <strong>SM Clean Tech</strong>
            <span>Engineering Solutions</span>
          </div>
        </div>
      </div>

      {/* Main split */}
      <main className="login-main">

        {/* LEFT — FORM CARD */}
        <section className="login-card">
          <div className="login-card-header">
            <div>
              <span className="form-kicker">SECURE ACCESS</span>
              <h2>Welcome back</h2>
              <p>Sign in to access your dashboard.</p>
            </div>

            <div className="role-icon">🔐</div>
          </div>

          <form onSubmit={submit} className="modern-login-form" noValidate>
            <div className="field-group">
              <label>
                <span className="field-icon">✉️</span>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div className="field-group">
              <label>
                <span className="field-icon">🔐</span>
                Password
              </label>
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="login-row">
              <label className="remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              {/* <button type="button" className="forgot-btn">
                Forgot password?
              </button> */}
            </div>

            {error && (
              <div className="login-message login-message--error">
                <span className="message-icon">!</span>
                <span>{error}</span>
                <button type="button" onClick={() => setError('')}>×</button>
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <span>→</span>
                </>
              )}
            </button>

            <div className="login-footer">
              <span>New to SM Clean Tech?</span>
              <button type="button" onClick={() => navigate('/register/buyer')}>
                Create account
              </button>
            </div>

            <div className="secure-note">
              🔒 Your information is protected and securely processed.
            </div>
          </form>

          {/* Demo box — subtle */}
          <div className="demo-box">
            <span className="demo-dot" />
            <div>
              <strong>Demo Admin</strong>
              <span>admin@smcleantech.com · Admin@12345</span>
            </div>
          </div>
        </section>

        {/* RIGHT — INFO PANEL */}
        <aside className="login-intro">
          <div className="intro-badge">
            <span className="intro-dot" />
            Trusted CleanTech Network
          </div>

          <h1>
            Access your <span>industrial dashboard.</span>
          </h1>

          <p>
            Sign in to manage enquiries, quotations, vendor matches, and
            five-year project history — all in one secure place.
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
                <strong>Verified Access</strong>
                <span>Only approved accounts</span>
              </div>
            </div>

            <div className="intro-feature">
              <div className="feature-icon">🔒</div>
              <div>
                <strong>Masked Contacts</strong>
                <span>Privacy-first network</span>
              </div>
            </div>

            <div className="intro-feature">
              <div className="feature-icon">📊</div>
              <div>
                <strong>5-Year CRM</strong>
                <span>Full project history</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}