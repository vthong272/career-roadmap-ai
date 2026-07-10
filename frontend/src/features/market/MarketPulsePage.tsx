import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertCircle, ArrowRight, BriefcaseBusiness, ExternalLink, RefreshCw, Route, TrendingUp } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { MarketPulse } from '../../types'
import { useAuth } from '../auth/auth-context'

export function MarketPulsePage({ onContinue }: { onContinue?: () => void }) {
  const { request } = useAuth()
  const [market, setMarket] = useState<MarketPulse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    request<{ market: MarketPulse }>('/market/trends')
      .then((payload) => setMarket(payload.market))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Could not load market trends'))
  }, [request])

  async function syncMarket() {
    setError(null)
    setIsSyncing(true)
    try {
      const payload = await request<{ market: MarketPulse }>('/market/sync', { method: 'POST' })
      setMarket(payload.market)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not refresh market jobs')
    } finally {
      setIsSyncing(false)
    }
  }

  if (error && !market) {
    return (
      <section className="panel state-panel">
        <AlertCircle size={24} aria-hidden="true" />
        <h2>Market pulse unavailable</h2>
        <p>{error}</p>
      </section>
    )
  }

  if (!market) {
    return <section className="panel">Loading market pulse...</section>
  }

  const chartData =
    market.roleTrends.length > 0
      ? market.roleTrends.map((trend) => ({ label: trend.skill, mentions: trend.mentions, jobCount: trend.jobCount }))
      : market.keywords.slice(0, 8).map((trend) => ({ label: trend.keyword, mentions: trend.mentions, jobCount: trend.jobCount }))

  return (
    <section className="page-stack" aria-labelledby="market-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Market pulse</p>
          <h1 id="market-title">Live hiring signals for your target role</h1>
          <p>Job posts are normalized by source, salary, company, and extracted skills so roadmap priorities reflect current demand.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => void syncMarket()} disabled={isSyncing}>
          <RefreshCw size={18} aria-hidden="true" />
          {isSyncing ? 'Refreshing...' : 'Refresh jobs'}
        </button>
      </header>

      {error && (
        <p className="form-error" role="status">
          {error}
        </p>
      )}

      <section className="metric-strip" aria-label="Market pulse summary">
        <article>
          <BriefcaseBusiness size={18} aria-hidden="true" />
          <div>
            <strong>{market.posts.length}</strong>
            <span>Job posts</span>
          </div>
        </article>
        <article>
          <TrendingUp size={18} aria-hidden="true" />
          <div>
            <strong>{market.roleTrends[0]?.skill ?? market.keywords[0]?.keyword ?? 'No signal'}</strong>
            <span>Top target-role skill</span>
          </div>
        </article>
        <article>
          <Route size={18} aria-hidden="true" />
          <div>
            <strong>{market.suggestions.length}</strong>
            <span>Roadmap suggestions</span>
          </div>
        </article>
      </section>

      <section className="chart-panel">
        <h2>Target-role skill demand</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="mentions" name="Mentions" fill="#0f766e" />
            <Bar dataKey="jobCount" name="Jobs" fill="#c26a10" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {market.suggestions.length > 0 && (
        <section className="report-panel" aria-labelledby="market-suggestions-title">
          <h2 id="market-suggestions-title">Roadmap adjustments from market demand</h2>
          <div className="suggestion-grid">
            {market.suggestions.map((suggestion) => (
              <article className="suggestion-card" key={suggestion.skill}>
                <span className={`status-badge ${suggestion.priority === 'HIGH' ? 'missing' : 'below_level'}`}>{suggestion.priority}</span>
                <h3>{suggestion.suggestedNode}</h3>
                <p>{suggestion.reason}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="trend-grid" aria-label="Technology trend summary">
        {(market.roleTrends.length > 0 ? market.roleTrends : market.keywords).slice(0, 10).map((trend) => (
          <article className="trend-card" key={'skill' in trend ? trend.skill : trend.keyword}>
            <strong>{'skill' in trend ? trend.skill : trend.keyword}</strong>
            <span>{trend.mentions} mentions</span>
            <span>{trend.jobCount} jobs</span>
            {'coverage' in trend && <span>{trend.coverage}% coverage</span>}
          </article>
        ))}
      </section>

      <section className="job-list" aria-label="Market job posts">
        {market.posts.map((post) => (
          <article className="job-card" key={post.id}>
            <div>
              <BriefcaseBusiness size={18} aria-hidden="true" />
              <h2>{post.title}</h2>
            </div>
            <p>
              {post.company} · {post.location} · {post.source}
              {post.salary ? ` · ${post.salary}` : ''}
            </p>
            {post.skills.length > 0 && (
              <div className="skill-chip-row" aria-label={`${post.title} extracted skills`}>
                {post.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            )}
            <p>{post.description}</p>
            {post.url && (
              <a className="job-link" href={post.url} target="_blank" rel="noreferrer">
                <ExternalLink size={15} aria-hidden="true" />
                Open source post
              </a>
            )}
          </article>
        ))}
      </section>

      <section className="demo-action-bar" aria-label="Market pulse demo actions">
        <span>Use these market signals to explain why the roadmap priorities changed before the counselor review.</span>
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue to Counselor/Admin
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
    </section>
  )
}
