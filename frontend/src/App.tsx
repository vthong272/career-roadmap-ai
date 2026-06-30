import { Activity, BookOpen, Bot, Github, GraduationCap, LineChart, Route, ShieldCheck, UserRound } from 'lucide-react'
import './index.css'

function App() {
  const modules = [
    { icon: UserRound, label: 'Student profile', status: 'Workspace ready' },
    { icon: Route, label: 'Skill gap and roadmap', status: 'Next milestone' },
    { icon: Bot, label: 'AI mentor', status: 'Service layer planned' },
    { icon: Github, label: 'GitHub portfolio', status: 'Integration planned' },
    { icon: LineChart, label: 'Market pulse', status: 'Seed data planned' },
    { icon: ShieldCheck, label: 'Counselor admin', status: 'Role-gated area planned' },
  ]

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Product navigation">
        <div className="brand-mark">
          <GraduationCap size={22} aria-hidden="true" />
          <span>Career Roadmap AI</span>
        </div>
        <nav className="nav-list">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <a href={`#${module.label.toLowerCase().replaceAll(' ', '-')}`} key={module.label}>
                <Icon size={18} aria-hidden="true" />
                <span>{module.label}</span>
              </a>
            )
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">SU26SWP02 MVP</p>
            <h1>Personalized career orientation dashboard</h1>
          </div>
          <div className="status-pill">
            <Activity size={16} aria-hidden="true" />
            <span>Initial setup verified next</span>
          </div>
        </header>

        <section className="summary-grid" aria-label="Implementation status">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <article className="module-card" id={module.label.toLowerCase().replaceAll(' ', '-')} key={module.label}>
                <Icon size={22} aria-hidden="true" />
                <h2>{module.label}</h2>
                <p>{module.status}</p>
              </article>
            )
          })}
        </section>

        <section className="activity-panel" aria-labelledby="roadmap-title">
          <div>
            <BookOpen size={22} aria-hidden="true" />
            <h2 id="roadmap-title">Build milestones</h2>
          </div>
          <ol>
            <li>Backend schema and seed data</li>
            <li>Authentication and student profile</li>
            <li>Skill gap, roadmap, AI mentor, portfolio, market pulse, and admin modules</li>
          </ol>
        </section>
      </section>
    </main>
  )
}

export default App
