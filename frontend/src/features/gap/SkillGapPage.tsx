import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertCircle, ArrowRight, CheckCircle2, FileText, TrendingUp } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { SkillGapAnalysis } from '../../types'
import { useAuth } from '../auth/auth-context'

const statusLabels = {
  MATCHED: 'Matched',
  BELOW_LEVEL: 'Below level',
  MISSING: 'Missing',
}

const statusColors = {
  MATCHED: '#0f766e',
  BELOW_LEVEL: '#b7791f',
  MISSING: '#b42318',
}

export function SkillGapPage({ onContinue }: { onContinue?: () => void }) {
  const { request } = useAuth()
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    request<{ analysis: SkillGapAnalysis }>('/gap-analysis/me')
      .then((payload) => setAnalysis(payload.analysis))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Could not load gap analysis'))
  }, [request])

  const statusData = useMemo(() => {
    if (!analysis) return []
    return [
      { name: 'Matched', value: analysis.matchedSkills.length, status: 'MATCHED' },
      { name: 'Below level', value: analysis.belowLevelSkills.length, status: 'BELOW_LEVEL' },
      { name: 'Missing', value: analysis.missingSkills.length, status: 'MISSING' },
    ]
  }, [analysis])

  const priorityData = useMemo(() => {
    if (!analysis) return []
    return ['HIGH', 'MEDIUM', 'LOW'].map((priority) => ({
      priority,
      missing: analysis.items.filter((item) => item.priority === priority && item.status !== 'MATCHED').length,
      matched: analysis.items.filter((item) => item.priority === priority && item.status === 'MATCHED').length,
    }))
  }, [analysis])

  if (error) {
    return (
      <section className="panel state-panel">
        <AlertCircle size={24} aria-hidden="true" />
        <h2>Gap analysis unavailable</h2>
        <p>{error}</p>
      </section>
    )
  }

  if (!analysis) {
    return <section className="panel">Loading gap analysis...</section>
  }

  return (
    <section className="page-stack" aria-labelledby="gap-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Skill gap analysis</p>
          <h1 id="gap-title">{analysis.role.title}</h1>
          <p>Readiness is calculated from role requirements, skill priority, and your saved current levels.</p>
        </div>
        <div className="score-tile">
          <strong>{analysis.readinessScore}%</strong>
          <span>Readiness</span>
        </div>
      </header>

      <section className="metric-strip" aria-label="Skill gap summary">
        <article>
          <CheckCircle2 size={18} aria-hidden="true" />
          <div>
            <strong>{analysis.matchedSkills.length}</strong>
            <span>Matched skills</span>
          </div>
        </article>
        <article>
          <TrendingUp size={18} aria-hidden="true" />
          <div>
            <strong>{analysis.belowLevelSkills.length}</strong>
            <span>Below target level</span>
          </div>
        </article>
        <article>
          <AlertCircle size={18} aria-hidden="true" />
          <div>
            <strong>{analysis.missingSkills.length}</strong>
            <span>Missing skills</span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="chart-panel">
          <h2>Coverage</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={statusColors[entry.status as keyof typeof statusColors]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-panel">
          <h2>Priority pressure</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="matched" fill="#0f766e" name="Matched" />
              <Bar dataKey="missing" fill="#b42318" name="Needs work" />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="report-panel" aria-labelledby="report-title">
        <div className="section-title">
          <FileText size={20} aria-hidden="true" />
          <h2 id="report-title">Gap report</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Skill</th>
                <th>Priority</th>
                <th>Required</th>
                <th>Current</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analysis.items.map((item) => (
                <tr key={item.skillId}>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.category}</span>
                  </td>
                  <td>{item.priority}</td>
                  <td>{item.requiredLevel.replace('_', ' ')}</td>
                  <td>{item.currentLevel?.replace('_', ' ') ?? 'Not listed'}</td>
                  <td>
                    <span className={`status-badge ${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="demo-action-bar" aria-label="Skill gap demo actions">
        <span>Use the missing and below-level rows as the reason for the generated learning plan.</span>
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue to Roadmap
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
    </section>
  )
}
