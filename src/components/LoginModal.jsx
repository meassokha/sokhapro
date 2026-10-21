import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'

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
  const [success, setSuccess] = useState(null)
  const userRef = useRef(null)
  const controls = useAnimationControls()
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  })

  useEffect(() => {
    controls.start({ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } })
    userRef.current?.focus()
  }, [controls])

  // Let the checkmark play, then hand control back to the app.
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => onSuccessRef.current(success), 1800)
    return () => clearTimeout(t)
  }, [success])

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
    if (Object.keys(next).length) {
      controls.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } })
      return
    }
    setLoading(true)
    try {
      setSuccess(await authenticate(username, password))
    } catch (err) {
      setFormError(err.message)
      setLoading(false)
      controls.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } })
    }
  }

  return (
    <motion.div
      className="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onMouseDown={(e) => e.target === e.currentTarget && !loading && !success && onClose()}
    >
      <motion.form
        className="panel"
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        animate={controls}
        exit={{ opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.25 } }}
      >
        <span className="glass-sheen" aria-hidden="true" />
        <AnimatePresence mode="wait" initial={false}>
          {success ? (
            <motion.div
              key="success"
              className="success"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              role="status"
            >
              <div className="check-wrap">
                <motion.span
                  className="ring"
                  initial={{ scale: 0.6, opacity: 0.7 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.1, delay: 0.35, ease: 'easeOut' }}
                />
                <svg viewBox="0 0 52 52" width="84" height="84" fill="none">
                  <motion.circle
                    cx="26" cy="26" r="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  <motion.path
                    d="M15 27l8 8 14-16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.5, ease: 'easeOut' }}
                  />
                </svg>
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              >
                Welcome back, {success.username}
              </motion.h2>
              <motion.p
                className="hint"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              >
                Taking you to the stars…
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="form-body"
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
              transition={{ duration: 0.25 }}
            >
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

            <motion.button type="submit" className="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}>
              {loading ? <span className="shimmer-label">Checking the stars</span> : 'Sign in'}
            </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </motion.div>
  )
}
