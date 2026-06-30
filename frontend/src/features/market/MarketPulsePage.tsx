import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertCircle, BriefcaseBusiness } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { MarketPulse } from '../../types'
import { useAuth } from '../auth/AuthContext'

export function MarketPulsePage() {
  const { request } = useAuth()
  const [market, setMarket] = useState<MarketPulse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    request<{ market: MarketPulse }>('/market/trends')
      .then((payload) => setMarket(payload.market))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Could not load market trends'))
  }, [request])

  if (error) {
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

  return (
    <section className="page-stack" aria-labelledby="market-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Market pulse</p>
          <h1 id="market-title">Technology demand from sample job posts</h1>
        </div>
      </header>

      <section className="chart-panel">
        <h2>Keyword frequency</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={market.keywords}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="keyword" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="mentions" name="Mentions" fill="#0f766e" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="trend-grid" aria-label="Technology trend summary">
        {market.keywords.map((keyword) => (
          <article className="trend-card" key={keyword.keyword}>
            <strong>{keyword.keyword}</strong>
            <span>{keyword.mentions} mentions</span>
            <span>{keyword.jobCount} jobs</span>
          </article>
        ))}
      </section>

      <section className="job-list" aria-label="Sample job posts">
        {market.posts.map((post) => (
          <article className="job-card" key={post.id}>
            <div>
              <BriefcaseBusiness size={18} aria-hidden="true" />
              <h2>{post.title}</h2>
            </div>
            <p>
              {post.company} · {post.location} · {post.source}
            </p>
            <p>{post.description}</p>
          </article>
        ))}
      </section>
    </section>
  )
}
