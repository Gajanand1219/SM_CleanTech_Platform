import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import '../styles/VerifyEmail.css'

export default function VerifyEmail() {
  const [params] = useSearchParams()

  const [email, setEmail] = useState(params.get('email') || '')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  const nav = useNavigate()
  const { saveAuth } = useAuth()
  const inputsRef = useRef([])

  /* AUTO-FOCUS FIRST BOX */
  useEffect(() => {
    if (email) inputsRef.current[0]?.focus()
  }, [email])

  /* COUNTDOWN */
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const code = digits.join('')
  const isComplete = code.length === 6 && digits.every((d) => d !== '')

  /* HANDLE DIGIT INPUT */
  const handleDigit = (index, value) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    setError('')

    if (v && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  /* HANDLE KEY NAVIGATION */
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  /* HANDLE PASTE */
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((ch, i) => (next[i] = ch))
    setDigits(next)
    const focusIdx = Math.min(pasted.length, 5)
    inputsRef.current[focusIdx]?.focus()
  }

  /* SUBMIT */
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')

    if (!isComplete) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    setLoading(true)

    try {
      const { data } = await API.post('/auth/verify-email', {
        email,
        code
      })

      saveAuth(data)
      setMsg('Email verified successfully. Redirecting to dashboard…')
      setMsgType('success')

      setTimeout(() => {
        if (data.role === 'admin') nav('/admin')
        else if (data.role === 'buyer') nav('/buyer')
        else if (data.role === 'vendor') nav('/vendor')
      }, 900)
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Verification failed. Please try again.'
      )
      setDigits(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  /* RESEND */
  const resend = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    setError('')
    setMsg('')

    try {
      await API.post('/auth/resend-verification', { email })
      setMsg('A new OTP has been sent to your email.')
      setMsgType('success')
      setResendCooldown(60)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="ve-page">
      {/* Background orbs */}
      <div className="ve-bg ve-bg--one" />
      <div className="ve-bg ve-bg--two" />

      {/* ================= TOP BAR ================= */}

      <header className="ve-topbar">
        <div className="ve-brand">
          <div className="ve-brand__logo">
            <img src="/logo2.jpeg" alt="SM Clean Tech" />
          </div>
          <div>
            <strong>SM Clean Tech</strong>
            <span>Engineering Solutions</span>
          </div>
        </div>

        <button
          type="button"
          className="ve-back"
          onClick={() => nav('/')}
        >
          <span>←</span>
          Back
        </button>
      </header>

      {/* ================= MAIN — CENTERED FORM ================= */}

      <main className="ve-main">
        <section className="ve-card">
          <div className="ve-card__header">
            <div className="ve-card__icon">✉️</div>
            <div>
              <span className="ve-kicker">Email Verification</span>
              <h2>Check your inbox</h2>
              <p className="ve-card__sub">
                We sent a 6-digit code to your registered email.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="ve-form" noValidate>
            {/* EMAIL */}
            <div className="ve-field">
              <label>
                <span className="ve-field__icon">📧</span>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            {/* OTP */}
            <div className="ve-otp">
              <label className="ve-otp__label">
                <span className="ve-field__icon">🔐</span>
                Verification code
              </label>

              <div className="ve-otp__boxes" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={`ve-otp__box ${d ? 'is-filled' : ''}`}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <div className="ve-otp__meta">
                <span className="ve-otp__hint">
                  {isComplete ? '✓ Code ready' : `${code.length}/6 digits`}
                </span>

                <button
                  type="button"
                  className="ve-resend"
                  onClick={resend}
                  disabled={resendCooldown > 0 || resending}
                >
                  {resending
                    ? 'Sending…'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend code'}
                </button>
              </div>
            </div>

            {/* MESSAGES */}
            {msg && (
              <div className={`ve-msg ve-msg--${msgType}`}>
                <span className="ve-msg__icon">
                  {msgType === 'success' ? '✓' : '!'}
                </span>
                <span>{msg}</span>
              </div>
            )}

            {error && (
              <div className="ve-msg ve-msg--error">
                <span className="ve-msg__icon">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="ve-submit"
              disabled={loading || !isComplete}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Verifying…
                </>
              ) : (
                <>
                  <span>✓</span>
                  Verify &amp; Continue
                  <span className="ve-submit__arrow">→</span>
                </>
              )}
            </button>

            {/* FOOTER */}
            <div className="ve-footer">
              <span>Wrong email?</span>
              <button
                type="button"
                onClick={() => nav('/register/buyer')}
              >
                Register again
              </button>
            </div>

            <div className="ve-secure">
              🔒 Your information is protected and securely processed.
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
