import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

/* =========================================================
   ERROR MESSAGE
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
        return 'Invalid request'
      })
      .join(', ')
  }

  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string')
    return error.response.data.message
  if (typeof error?.message === 'string') return error.message

  return 'Login failed. Please try again.'
}

/* =========================================================
   CAPTCHA GENERATOR — 6 chars
   ========================================================= */

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return out
}

/* =========================================================
   LOGIN PAGE
   ========================================================= */

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /* ================= CAPTCHA STATE ================= */

  const [captchaText, setCaptchaText] = useState(() => generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaError, setCaptchaError] = useState('')

  /* ================= REGISTER POPUP STATE ================= */

  const [showRegisterChoice, setShowRegisterChoice] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  /* ================= REFRESH CAPTCHA ================= */

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptcha())
    setCaptchaInput('')
    setCaptchaError('')
  }

  /* ================= GO TO REGISTER ================= */

  const goToRegister = (type) => {
    setShowRegisterChoice(false)
    navigate(`/register/${type}`)
  }

  /* ================= SUBMIT ================= */

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setCaptchaError('')

    /* ---- CAPTCHA VALIDATION ---- */

    if (!captchaInput.trim()) {
      setCaptchaError('Please enter the captcha code.')
      return
    }

    if (captchaInput.trim().toUpperCase() !== captchaText.toUpperCase()) {
      setCaptchaError('Incorrect captcha. Please try again.')
      refreshCaptcha()
      return
    }

    /* ---- LOGIN ---- */

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
      refreshCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg login-bg--one" />
      <div className="login-bg login-bg--two" />

      {/* ================= TOP BAR ================= */}

      <div className="login-topbar">
        <div className="login-brand">
          <div className="login-brand-logo">
            <img src="/logo2.jpeg" alt="SM Clean Tech" />
          </div>
          <div>
            <strong>SM Clean Tech</strong>
            <span>Engineering Solutions</span>
          </div>
        </div>

        <button
          type="button"
          className="back-home"
          onClick={() => navigate('/')}
        >
          <span>←</span>
          Back
        </button>
      </div>

      {/* ================= MAIN ================= */}

      <main className="login-main">
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
            {/* EMAIL */}

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

            {/* PASSWORD */}

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

            {/* CAPTCHA */}

            <div className="field-group captcha-group">
              <label>
                <span className="field-icon">🛡️</span>
                Captcha Verification
              </label>

              <div className="captcha-row">
                <div className="captcha-box">
                  <span className="captcha-text">{captchaText}</span>
                  <button
                    type="button"
                    className="captcha-refresh"
                    onClick={refreshCaptcha}
                    aria-label="Refresh captcha"
                    title="Refresh captcha"
                  >
                    ↻
                  </button>
                </div>

                <input
                  type="text"
                  className="captcha-input"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value.toUpperCase())
                    setCaptchaError('')
                  }}
                  placeholder="Enter code"
                  maxLength={6}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              {captchaError && (
                <div className="captcha-error">{captchaError}</div>
              )}
            </div>

            {/* REMEMBER */}

            <div className="login-row">
              <label className="remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>

            {/* ERROR */}

            {error && (
              <div className="login-message login-message--error">
                <span className="message-icon">!</span>
                <span>{error}</span>
                <button type="button" onClick={() => setError('')}>
                  ×
                </button>
              </div>
            )}

            {/* SUBMIT */}

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

            {/* FOOTER */}

            <div className="login-footer">
              <span>New to SM Clean Tech?</span>
              <button
                type="button"
                onClick={() => setShowRegisterChoice(true)}
              >
                Create account
              </button>
            </div>

            <div className="secure-note">
              🔒 Your information is protected and securely processed.
            </div>
          </form>

          {/* DEMO BOX */}

          <div className="demo-box">
            <span className="demo-dot" />
            <div>
              <strong>Demo Admin</strong>
              <span>admin@smcleantech.com · Admin@12345</span>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
         REGISTER CHOICE POPUP
         ========================================================= */}

      {showRegisterChoice && (
        <div
          className="register-modal-overlay"
          onClick={() => setShowRegisterChoice(false)}
        >
          <div
            className="register-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="register-modal__close"
              onClick={() => setShowRegisterChoice(false)}
              aria-label="Close"
            >
              ×
            </button>

            <span className="register-modal__label">JOIN THE NETWORK</span>
            <h2>Create your account</h2>
            <p>Choose how you want to register</p>

            <div className="register-modal__options">
              {/* BUYER */}

              <button
                type="button"
                className="register-option register-option--buyer"
                onClick={() => goToRegister('buyer')}
              >
                <div className="register-option__icon">🏢</div>

                <div className="register-option__text">
                  <strong>Register as Buyer</strong>
                  <span>Post industrial requirements</span>
                </div>

                <div className="register-option__arrow">→</div>
              </button>

              {/* VENDOR */}

              <button
                type="button"
                className="register-option register-option--vendor"
                onClick={() => goToRegister('vendor')}
              >
                <div className="register-option__icon">⚙️</div>

                <div className="register-option__text">
                  <strong>Register as Vendor</strong>
                  <span>Offer EPC & CleanTech solutions</span>
                </div>

                <div className="register-option__arrow">→</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
