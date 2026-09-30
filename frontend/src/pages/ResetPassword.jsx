import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../services/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!token) {
      setError('Invalid or missing password reset link.')
      return
    }

    if (!password) {
      setError('Please enter your new password.')
      return
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError(
        'Password must contain at least one uppercase letter.'
      )
      return
    }

    if (!/[a-z]/.test(password)) {
      setError(
        'Password must contain at least one lowercase letter.'
      )
      return
    }

    if (!/[0-9]/.test(password)) {
      setError(
        'Password must contain at least one number.'
      )
      return
    }

    if (!confirmPassword) {
      setError('Please confirm your new password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await API.post(
        '/auth/reset-password',
        {
          token,
          password,
        }
      )

      setSuccess(
        response.data?.message ||
        'Password reset successfully.'
      )

      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (error) {
      setError(
        error?.response?.data?.detail ||
        'Unable to reset password. The link may have expired.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        background:
          'radial-gradient(circle at 10% 10%, rgba(34,197,94,.12), transparent 30%), radial-gradient(circle at 90% 90%, rgba(14,165,233,.08), transparent 30%), #f8fafc',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '450px',
          background: '#ffffff',
          border: '1px solid rgba(15,23,42,.08)',
          borderRadius: '24px',
          padding: '34px',
          boxSizing: 'border-box',
          boxShadow:
            '0 25px 70px rgba(15,23,42,.10)',
        }}
      >

        {/* LOGO / ICON */}

        <div
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '17px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg,#15803d,#22c55e)',
            color: '#ffffff',
            fontSize: '26px',
            marginBottom: '20px',
            boxShadow:
              '0 10px 25px rgba(22,163,74,.20)',
          }}
        >
          🔐
        </div>

        <div
          style={{
            color: '#16a34a',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.14em',
            marginBottom: '8px',
          }}
        >
          SM CLEAN TECH
        </div>

        <h1
          style={{
            margin: '0 0 8px',
            color: '#0f172a',
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
        >
          Reset Password
        </h1>

        <p
          style={{
            margin: '0 0 28px',
            color: '#64748b',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          Create a new secure password for your account.
        </p>

        <form onSubmit={handleSubmit}>

          {/* NEW PASSWORD */}

          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              New Password
            </label>

            <div
              style={{
                position: 'relative',
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 48px 0 14px',
                  border: '1px solid #dbe2ea',
                  borderRadius: '11px',
                  outline: 'none',
                  color: '#0f172a',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '17px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}

          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              Confirm Password
            </label>

            <div
              style={{
                position: 'relative',
              }}
            >
              <input
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 48px 0 14px',
                  border: '1px solid #dbe2ea',
                  borderRadius: '11px',
                  outline: 'none',
                  color: '#0f172a',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '17px',
                }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* PASSWORD RULES */}

          <div
            style={{
              padding: '13px',
              marginBottom: '18px',
              borderRadius: '11px',
              background: '#f8fafc',
              border: '1px solid #eef2f7',
              color: '#64748b',
              fontSize: '11px',
              lineHeight: 1.7,
            }}
          >
            Password must contain:
            <br />
            • At least 8 characters
            <br />
            • One uppercase letter
            <br />
            • One lowercase letter
            <br />
            • One number
          </div>

          {/* ERROR */}

          {error && (
            <div
              style={{
                padding: '11px 13px',
                marginBottom: '16px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div
              style={{
                padding: '11px 13px',
                marginBottom: '16px',
                borderRadius: '10px',
                background: '#ecfdf5',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {success}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '49px',
              border: 'none',
              borderRadius: '12px',
              background:
                'linear-gradient(135deg,#15803d,#22c55e)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow:
                '0 10px 24px rgba(22,163,74,.20)',
            }}
          >
            {loading
              ? 'Updating Password...'
              : 'Reset Password'}
          </button>

        </form>

        {/* BACK TO LOGIN */}

        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            marginTop: '16px',
            border: 'none',
            background: 'transparent',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← Back to Login
        </button>

      </div>
    </div>
  )
}