import { Bot, BriefcaseBusiness, Github, LineChart, LogOut, Route, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../features/auth/AuthContext'

type PageKey = 'profile' | 'gap' | 'roadmap' | 'mentor' | 'portfolio' | 'market' | 'admin'

const navItems: Array<{ key: PageKey; label: string; description: string; icon: typeof UserRound }> = [
  { key: 'profile', label: 'Profile', description: 'Career baseline', icon: UserRound },
  { key: 'gap', label: 'Skill Gap', description: 'Readiness score', icon: LineChart },
  { key: 'roadmap', label: 'Roadmap', description: 'Learning plan', icon: Route },
  { key: 'mentor', label: 'AI Mentor', description: 'Weekly guidance', icon: Bot },
  { key: 'portfolio', label: 'Portfolio', description: 'GitHub evidence', icon: Github },
  { key: 'market', label: 'Market Pulse', description: 'Hiring signals', icon: BriefcaseBusiness },
  { key: 'admin', label: 'Admin', description: 'Counselor tools', icon: ShieldCheck },
]

export function Layout({ renderPage }: { renderPage: (page: PageKey) => ReactNode }) {
  const { user, logout } = useAuth()
  const [activePage, setActivePage] = useState<PageKey>('profile')
  const activeItem = navItems.find((item) => item.key === activePage) ?? navItems[0]

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
            <strong>Next best action</strong>
            <span>Keep your profile and skill levels current before opening the mentor.</span>
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
        {renderPage(activePage)}
      </section>
    </main>
  )
}

export type { PageKey }
