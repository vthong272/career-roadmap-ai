import { Suspense, lazy } from 'react'
import { AuthPanel } from './features/auth/AuthPanel'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { ProfilePage } from './features/profile/ProfilePage'
import { Layout, type PageKey } from './components/Layout'
import './index.css'

const SkillGapPage = lazy(() => import('./features/gap/SkillGapPage').then((module) => ({ default: module.SkillGapPage })))
const RoadmapPage = lazy(() => import('./features/roadmap/RoadmapPage').then((module) => ({ default: module.RoadmapPage })))
const MentorPage = lazy(() => import('./features/mentor/MentorPage').then((module) => ({ default: module.MentorPage })))
const PortfolioPage = lazy(() => import('./features/portfolio/PortfolioPage').then((module) => ({ default: module.PortfolioPage })))
const PublicPortfolioPage = lazy(() =>
  import('./features/portfolio/PublicPortfolioPage').then((module) => ({ default: module.PublicPortfolioPage })),
)
const MarketPulsePage = lazy(() => import('./features/market/MarketPulsePage').then((module) => ({ default: module.MarketPulsePage })))
const AdminPage = lazy(() => import('./features/admin/AdminPage').then((module) => ({ default: module.AdminPage })))

const pageLabels: Record<PageKey, string> = {
  profile: 'Profile',
  gap: 'Skill Gap',
  roadmap: 'Roadmap',
  mentor: 'AI Mentor',
  portfolio: 'Portfolio',
  market: 'Market Pulse',
  admin: 'Admin',
}

function Workspace() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <main className="loading-screen">Loading workspace...</main>
  }

  if (!user) {
    return <AuthPanel />
  }

  function renderPage(page: PageKey) {
    if (page === 'profile') {
      return <ProfilePage />
    }
    if (page === 'gap') {
      return (
        <Suspense fallback={<section className="panel">Loading skill gap...</section>}>
          <SkillGapPage />
        </Suspense>
      )
    }
    if (page === 'roadmap') {
      return (
        <Suspense fallback={<section className="panel">Loading roadmap...</section>}>
          <RoadmapPage />
        </Suspense>
      )
    }
    if (page === 'mentor') {
      return (
        <Suspense fallback={<section className="panel">Loading mentor...</section>}>
          <MentorPage />
        </Suspense>
      )
    }
    if (page === 'portfolio') {
      return (
        <Suspense fallback={<section className="panel">Loading portfolio...</section>}>
          <PortfolioPage />
        </Suspense>
      )
    }
    if (page === 'market') {
      return (
        <Suspense fallback={<section className="panel">Loading market pulse...</section>}>
          <MarketPulsePage />
        </Suspense>
      )
    }
    if (page === 'admin') {
      return (
        <Suspense fallback={<section className="panel">Loading admin...</section>}>
          <AdminPage />
        </Suspense>
      )
    }

    return (
      <section className="panel">
        <p className="eyebrow">{pageLabels[page]}</p>
        <h2>{pageLabels[page]} module</h2>
        <p>This module is implemented in the next milestone commit.</p>
      </section>
    )
  }

  return <Layout renderPage={renderPage} />
}

function App() {
  const publicMatch = window.location.pathname.match(/^\/portfolio\/([^/]+)$/)
  if (publicMatch) {
    return (
      <Suspense fallback={<main className="loading-screen">Loading portfolio...</main>}>
        <PublicPortfolioPage username={decodeURIComponent(publicMatch[1])} />
      </Suspense>
    )
  }

  return (
    <AuthProvider>
      <Workspace />
    </AuthProvider>
  )
}

export default App
