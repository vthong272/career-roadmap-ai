import { useEffect, useState } from 'react'
import { AlertCircle, Github } from 'lucide-react'
import { apiRequest, ApiClientError } from '../../api'
import type { GitHubPortfolio } from '../../types'
import { RepositoryGrid } from './PortfolioPage'

export function PublicPortfolioPage({ username }: { username: string }) {
  const [portfolio, setPortfolio] = useState<GitHubPortfolio | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRequest<{ portfolio: GitHubPortfolio }>(`/portfolio/public/${username}`)
      .then((payload) => setPortfolio(payload.portfolio))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Portfolio not found'))
  }, [username])

  if (error) {
    return (
      <main className="public-page">
        <section className="panel state-panel">
          <AlertCircle size={24} aria-hidden="true" />
          <h1>Portfolio unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    )
  }

  if (!portfolio) {
    return <main className="loading-screen">Loading portfolio...</main>
  }

  return (
    <main className="public-page">
      <section className="public-profile">
        {portfolio.avatarUrl && <img src={portfolio.avatarUrl} alt={`${portfolio.username} avatar`} />}
        <div>
          <p className="eyebrow">Software engineering e-portfolio</p>
          <h1>{portfolio.user?.name ?? portfolio.displayName ?? portfolio.username}</h1>
          <p>{portfolio.user?.profile?.headline ?? portfolio.bio ?? 'Project portfolio'}</p>
          <div className="node-meta">
            {portfolio.user?.profile?.targetRole && <span>{portfolio.user.profile.targetRole.title}</span>}
            {portfolio.user?.profile?.university && <span>{portfolio.user.profile.university}</span>}
            {portfolio.user?.profile?.major && <span>{portfolio.user.profile.major}</span>}
          </div>
          <a className="primary-button public-link" href={portfolio.htmlUrl} target="_blank" rel="noreferrer">
            <Github size={18} aria-hidden="true" />
            GitHub profile
          </a>
        </div>
      </section>
      <RepositoryGrid portfolio={portfolio} />
    </main>
  )
}
