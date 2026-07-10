import { CheckCircle2, LogOut, Route, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { navItems, type PageKey } from '../app/navigation'
import { useAuth } from '../features/auth/auth-context'

export function Layout({ renderPage }: { renderPage: (page: PageKey, navigateTo: (page: PageKey) => void) => ReactNode }) {
  const { user, logout } = useAuth()
  const [activePage, setActivePage] = useState<PageKey>('profile')
  const activeItem = navItems.find((item) => item.key === activePage) ?? navItems[0]
  const activeIndex = navItems.findIndex((item) => item.key === activePage)

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Product navigation">
        <div className="brand-block">
          <div className="brand-mark">
            <Route size={22} aria-hidden="true" />
            <span>Career Roadmap AI</span>
          </div>
          <p>Student career intelligence workspace</p>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                className={activePage === item.key ? 'active' : ''}
                type="button"
                onClick={() => setActivePage(item.key)}
                key={item.key}
              >
                <span className="nav-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-insight">
          <Sparkles size={18} aria-hidden="true" />
          <div>
            <strong>Demo flow</strong>
            <span>
              {user?.role === 'COUNSELOR_ADMIN'
                ? 'Review student progress, then update roles, skills, nodes, or resources.'
                : 'Profile -> Skill Gap -> Roadmap -> AI Mentor -> Portfolio -> Counselor/Admin.'}
            </span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">SU26SWP02 Career Platform</p>
            <h1>{activeItem.label}</h1>
            <p className="topbar-copy">{activeItem.description} for software engineering students.</p>
          </div>
          <div className="account-box">
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.role === 'COUNSELOR_ADMIN' ? 'Counselor/Admin' : 'Student'}</span>
            </div>
            <button type="button" className="icon-button" onClick={logout} aria-label="Logout">
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        <section className="flow-strip" aria-label="Demo flow progress">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isDone = index < activeIndex
            return (
              <button
                type="button"
                className={activePage === item.key ? 'active' : ''}
                onClick={() => setActivePage(item.key)}
                key={item.key}
              >
                {isDone ? <CheckCircle2 size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                <span>{item.label}</span>
              </button>
            )
          })}
        </section>
        {renderPage(activePage, setActivePage)}
      </section>
    </main>
  )
}
