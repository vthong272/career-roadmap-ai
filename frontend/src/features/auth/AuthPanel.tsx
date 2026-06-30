import { useState } from 'react'
import { AlertCircle, GraduationCap, LogIn } from 'lucide-react'
import { ApiClientError } from '../../api'
import { useAuth } from './AuthContext'

export function AuthPanel() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('Software Engineering Student')
  const [email, setEmail] = useState('student@example.com')
  const [password, setPassword] = useState('Student@123')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit() {
    setError(null)
    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-intro">
        <div className="brand-mark">
          <GraduationCap size={24} aria-hidden="true" />
          <span>Career Roadmap AI</span>
        </div>
        <h1>Career orientation workspace for software engineering students</h1>
        <p>
          Select a target role, compare current skills, plan learning work, and turn projects into a shareable portfolio.
        </p>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="segmented-control" role="tablist" aria-label="Authentication mode">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <h2 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create student account'}</h2>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          {mode === 'register' && (
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={mode === 'register' ? 8 : 1}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              {error}
            </p>
          )}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <LogIn size={18} aria-hidden="true" />
            {isSubmitting ? 'Submitting...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="demo-actions">
          <button
            type="button"
            onClick={() => {
              setEmail('student@example.com')
              setPassword('Student@123')
            }}
          >
            Student demo
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('counselor@example.com')
              setPassword('Counselor@123')
            }}
          >
            Admin demo
          </button>
        </div>
      </section>
    </main>
  )
}
