import { useEffect, useRef, useState } from 'react'

// Demo-only credentials. Replace `authenticate` with a real API call.
const DEMO_USER = 'sokha'
const DEMO_PASS = 'stars2026'

function authenticate(username, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username.trim().toLowerCase() === DEMO_USER && password === DEMO_PASS) {
        resolve({ username: DEMO_USER })
      } else {
        reject(new Error('That username and password do not match.'))
      }
    }, 900)
  })
}

export default function LoginModal({ onClose, onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const userRef = useRef(null)

  useEffect(() => {
    userRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !loading && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!username.trim()) next.username = 'Enter your username.'
    if (!password) next.password = 'Enter your password.'
    else if (password.length < 6) next.password = 'Passwords have at least 6 characters.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      onSuccess(await authenticate(username, password))
    } catch (err) {
      setFormError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <form className="panel" onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button type="button" className="close" onClick={onClose} aria-label="Close" disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        <p className="eyebrow">Welcome back</p>
        <h2 id="login-title">Sign in to your sky</h2>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            ref={userRef}
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-err' : undefined}
            disabled={loading}
          />
          {errors.username && <span id="username-err" className="err">{errors.username}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="pw">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-err' : undefined}
              disabled={loading}
            />
            <button type="button" className="toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <span id="password-err" className="err">{errors.password}</span>}
        </div>

        {formError && <div className="form-err" role="alert">{formError}</div>}

        <button type="submit" className="submit" disabled={loading}>
          {loading ? <span className="shimmer-label">Checking the stars</span> : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
