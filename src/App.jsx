import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Scene from './components/Scene.jsx'
import LoginModal from './components/LoginModal.jsx'

export default function App() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])
  const close = useCallback(() => setOpen(false), [])

  return (
    <div className="sky">
      <div className="nebula" aria-hidden="true" />
      <Scene onReady={handleReady} />
      <div className={`loader ${ready ? 'done' : ''}`} aria-hidden="true">
        <span />
      </div>

      <header className="nav">
        <span />
        {user ? (
          <div className="session">
            <span className="who">Signed in as {user.username}</span>
            <button className="btn ghost" onClick={() => setUser(null)}>Sign out</button>
          </div>
        ) : (
          <button className="btn" onClick={() => setOpen(true)}>Sign in</button>
        )}
      </header>

      <footer className="caption">
        <h1>{user ? `Good evening, ${user.username}.` : 'One small planet, a lot of sky.'}</h1>
      </footer>

      <AnimatePresence>
        {open && (
          <LoginModal
            onClose={close}
            onSuccess={(u) => {
              setUser(u)
              setOpen(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
