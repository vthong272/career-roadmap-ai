import { Bot, Github, LineChart, LogOut, Route, ShieldCheck, UserRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../features/auth/AuthContext'

type PageKey = 'profile' | 'gap' | 'roadmap' | 'mentor' | 'portfolio' | 'market' | 'admin'

const navItems: Array<{ key: PageKey; label: string; icon: typeof UserRound }> = [
  { key: 'profile', label: 'Profile', icon: UserRound },
  { key: 'gap', label: 'Skill Gap', icon: LineChart },
  { key: 'roadmap', label: 'Roadmap', icon: Route },
  { key: 'mentor', label: 'AI Mentor', icon: Bot },
  { key: 'portfolio', label: 'Portfolio', icon: Github },
  { key: 'market', label: 'Market Pulse', icon: LineChart },
  { key: 'admin', label: 'Admin', icon: ShieldCheck },
]

export function Layout({ renderPage }: { renderPage: (page: PageKey) => ReactNode }) {
  const { user, logout } = useAuth()
  const [activePage, setActivePage] = useState<PageKey>('profile')

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Product navigation">
        <div className="brand-mark">
          <Route size={22} aria-hidden="true" />
          <span>Career Roadmap AI</span>
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
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">SU26SWP02 MVP</p>
            <h1>Personalized career roadmap platform</h1>
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
