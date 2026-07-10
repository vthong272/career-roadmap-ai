import { useState } from 'react'
import { AlertCircle, BarChart3, GraduationCap, LogIn, Route, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { ApiClientError } from '../../api'
import { useAuth } from './auth-context'

export function AuthPanel() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function fillDemoAccount(kind: 'student' | 'counselor') {
    setMode('login')
    setName('')
    setEmail(kind === 'student' ? 'student@example.com' : 'counselor@example.com')
    setPassword(kind === 'student' ? 'Student@123' : 'Counselor@123')
    setError(null)
  }

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
        <div className="brand-block">
          <div className="brand-mark">
            <GraduationCap size={24} aria-hidden="true" />
            <span>Career Roadmap AI</span>
          </div>
          <p>Personalized career orientation for software engineering students</p>
        </div>
        <h1>Plan the role, close the skill gap, prove the portfolio.</h1>
        <p>
          A focused workspace for students to pick a target role, compare current skills, follow a generated learning roadmap,
          ask an AI mentor, and publish GitHub evidence.
        </p>
        <div className="auth-value-grid" aria-label="Platform highlights">
          <article>
            <BarChart3 size={18} aria-hidden="true" />
            <strong>Gap score</strong>
            <span>Compare required and current skills.</span>
          </article>
          <article>
            <Route size={18} aria-hidden="true" />
            <strong>Roadmap</strong>
            <span>Track learning nodes and resources.</span>
          </article>
          <article>
            <Sparkles size={18} aria-hidden="true" />
            <strong>AI mentor</strong>
            <span>Get weekly prioritization guidance.</span>
          </article>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div>
          <p className="eyebrow">Secure workspace</p>
          <h2 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create student account'}</h2>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Authentication mode">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <div className="demo-login-grid" aria-label="Demo accounts">
          <button type="button" onClick={() => fillDemoAccount('student')}>
            <UserRound size={17} aria-hidden="true" />
            <span>
              <strong>Student demo</strong>
              <small>student@example.com</small>
            </span>
          </button>
          <button type="button" onClick={() => fillDemoAccount('counselor')}>
            <ShieldCheck size={17} aria-hidden="true" />
            <span>
              <strong>Counselor/Admin</strong>
              <small>counselor@example.com</small>
            </span>
          </button>
        </div>

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

      </section>
    </main>
  )
}
