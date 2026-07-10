import { Suspense, lazy } from 'react'
import { AuthPanel } from './features/auth/AuthPanel'
import { AuthProvider } from './features/auth/AuthContext'
import { useAuth } from './features/auth/auth-context'
import { ProfilePage } from './features/profile/ProfilePage'
import { Layout } from './components/Layout'
import { pageLabels, type PageKey } from './app/navigation'
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

function Workspace() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <main className="loading-screen">Loading workspace...</main>
  }

  if (!user) {
    return <AuthPanel />
  }

  function renderPage(page: PageKey, navigateTo: (page: PageKey) => void) {
    if (page === 'profile') {
      return <ProfilePage onContinue={() => navigateTo('gap')} />
    }
    if (page === 'gap') {
      return (
        <Suspense fallback={<section className="panel">Loading skill gap...</section>}>
          <SkillGapPage onContinue={() => navigateTo('roadmap')} />
        </Suspense>
      )
    }
    if (page === 'roadmap') {
      return (
        <Suspense fallback={<section className="panel">Loading roadmap...</section>}>
          <RoadmapPage onContinue={() => navigateTo('mentor')} />
        </Suspense>
      )
    }
    if (page === 'mentor') {
      return (
        <Suspense fallback={<section className="panel">Loading mentor...</section>}>
          <MentorPage onContinue={() => navigateTo('portfolio')} />
        </Suspense>
      )
    }
    if (page === 'portfolio') {
      return (
        <Suspense fallback={<section className="panel">Loading portfolio...</section>}>
          <PortfolioPage onContinue={() => navigateTo('market')} />
        </Suspense>
      )
    }
    if (page === 'market') {
      return (
        <Suspense fallback={<section className="panel">Loading market pulse...</section>}>
          <MarketPulsePage onContinue={() => navigateTo('admin')} />
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
