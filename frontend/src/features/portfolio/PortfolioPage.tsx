import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, ExternalLink, Github, RefreshCw, Share2, Star } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { GitHubPortfolio } from '../../types'
import { useAuth } from '../auth/auth-context'

export function PortfolioPage({ onContinue }: { onContinue?: () => void }) {
  const { request } = useAuth()
  const [portfolio, setPortfolio] = useState<GitHubPortfolio | null>(null)
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    request<{ portfolio: GitHubPortfolio | null }>('/portfolio/me')
      .then((payload) => {
        setPortfolio(payload.portfolio)
        setUsername(payload.portfolio?.username ?? '')
      })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Could not load portfolio'))
  }, [request])

  const shareUrl = useMemo(() => {
    if (!portfolio) return ''
    return `${window.location.origin}/portfolio/${portfolio.username}`
  }, [portfolio])

  async function syncPortfolio() {
    setError(null)
    setIsSyncing(true)
    try {
      const payload = await request<{ portfolio: GitHubPortfolio }>('/portfolio/sync', {
        method: 'POST',
        body: JSON.stringify({ username }),
      })
      setPortfolio(payload.portfolio)
      setUsername(payload.portfolio.username)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not sync GitHub portfolio')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <section className="page-stack" aria-labelledby="portfolio-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">GitHub portfolio</p>
          <h1 id="portfolio-title">Repository sync and share page</h1>
          <p>Sync public repositories, review generated summaries, and share an evidence page for counselors or recruiters.</p>
        </div>
      </header>

      {error && (
        <p className="form-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </p>
      )}

      <section className="sync-panel">
        <label>
          GitHub username
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="octocat" />
        </label>
        <button className="primary-button" type="button" onClick={() => void syncPortfolio()} disabled={isSyncing || !username.trim()}>
          <RefreshCw size={18} aria-hidden="true" />
          {isSyncing ? 'Syncing...' : 'Sync repositories'}
        </button>
      </section>

      {portfolio ? (
        <>
          <section className="portfolio-hero">
            {portfolio.avatarUrl && <img src={portfolio.avatarUrl} alt={`${portfolio.username} avatar`} />}
            <div>
              <h2>{portfolio.displayName ?? portfolio.username}</h2>
              <p>{portfolio.bio ?? 'Public GitHub portfolio synced for career presentation.'}</p>
              <div className="metric-inline" aria-label="Portfolio metrics">
                <span>{portfolio.repos.length} repositories</span>
                <span>{portfolio.repos.reduce((total, repo) => total + repo.stars, 0)} stars</span>
                <span>Synced {new Date(portfolio.syncedAt).toLocaleDateString()}</span>
              </div>
              <div className="resource-list">
                <a href={portfolio.htmlUrl} target="_blank" rel="noreferrer">
                  <Github size={15} aria-hidden="true" />
                  GitHub profile
                </a>
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  <Share2 size={15} aria-hidden="true" />
                  Share page
                </a>
              </div>
            </div>
          </section>

          <RepositoryGrid portfolio={portfolio} />
        </>
      ) : (
        <section className="panel state-panel">
          <Github size={24} aria-hidden="true" />
          <h2>No portfolio synced</h2>
          <p>Enter a GitHub username to fetch public repositories and generate portfolio summaries.</p>
        </section>
      )}

      <section className="demo-action-bar" aria-label="Portfolio demo actions">
        <span>After syncing evidence, compare your target role against live job-market demand.</span>
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue to Market Pulse
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
    </section>
  )
}

export function RepositoryGrid({ portfolio }: { portfolio: GitHubPortfolio }) {
  return (
    <section className="repo-grid" aria-label="Synced repositories">
      {portfolio.repos.map((repo) => (
        <article className="repo-card" key={repo.id}>
          <div className="repo-heading">
            <h3>{repo.name}</h3>
            <span>
              <Star size={15} aria-hidden="true" />
              {repo.stars}
            </span>
          </div>
          <p>{repo.description ?? 'No GitHub description provided.'}</p>
          <p>{repo.readmeSummary ?? 'README summary unavailable.'}</p>
          <div className="repo-footer">
            <span>{repo.language ?? 'Mixed'}</span>
            <a href={repo.url} target="_blank" rel="noreferrer" aria-label={`Open ${repo.name} on GitHub`}>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        </article>
      ))}
    </section>
  )
}
