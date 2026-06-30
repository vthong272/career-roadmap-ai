import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { RoadmapResponse, RoadmapStatus } from '../../types'
import { useAuth } from '../auth/AuthContext'

const statusOptions: RoadmapStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']

function statusLabel(status: RoadmapStatus) {
  return status.replace('_', ' ')
}

export function RoadmapPage() {
  const { request } = useAuth()
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updatingNodeId, setUpdatingNodeId] = useState<string | null>(null)

  useEffect(() => {
    request<{ roadmap: RoadmapResponse }>('/roadmap/me')
      .then((payload) => setRoadmap(payload.roadmap))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Could not load roadmap'))
  }, [request])

  async function updateStatus(nodeId: string, status: RoadmapStatus) {
    setUpdatingNodeId(nodeId)
    setError(null)
    try {
      const payload = await request<{ roadmap: RoadmapResponse }>(`/roadmap/nodes/${nodeId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setRoadmap(payload.roadmap)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not update progress')
    } finally {
      setUpdatingNodeId(null)
    }
  }

  if (error && !roadmap) {
    return (
      <section className="panel state-panel">
        <AlertCircle size={24} aria-hidden="true" />
        <h2>Roadmap unavailable</h2>
        <p>{error}</p>
      </section>
    )
  }

  if (!roadmap) {
    return <section className="panel">Loading roadmap...</section>
  }

  const completed = roadmap.progressSummary.COMPLETED
  const total = roadmap.nodes.length || 1
  const percent = Math.round((completed / total) * 100)

  return (
    <section className="page-stack" aria-labelledby="roadmap-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dynamic learning roadmap</p>
          <h1 id="roadmap-title">{roadmap.role.title}</h1>
        </div>
        <div className="score-tile">
          <strong>{percent}%</strong>
          <span>Completed</span>
        </div>
      </header>

      {error && (
        <p className="form-error" role="status">
          {error}
        </p>
      )}

      <section className="roadmap-list">
        {roadmap.nodes.map((node) => (
          <article className="roadmap-node" key={node.id}>
            <div className="roadmap-index">{node.sortOrder}</div>
            <div className="roadmap-body">
              <div className="roadmap-heading">
                <div>
                  <h2>{node.title}</h2>
                  <p>{node.description}</p>
                </div>
                <span className={`status-badge ${node.status.toLowerCase()}`}>{statusLabel(node.status)}</span>
              </div>
              <div className="node-meta">
                <span>
                  <Clock size={16} aria-hidden="true" />
                  {node.estimatedHours} hours
                </span>
                <span>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {node.priority} priority
                </span>
                {node.skill && <span>{node.skill.name}</span>}
              </div>
              <div className="resource-list">
                {node.resources.map((resource) => (
                  <a href={resource.url} target="_blank" rel="noreferrer" key={resource.id}>
                    <ExternalLink size={15} aria-hidden="true" />
                    {resource.title}
                  </a>
                ))}
              </div>
              <div className="status-actions" aria-label={`${node.title} progress`}>
                {statusOptions.map((status) => (
                  <button
                    type="button"
                    className={node.status === status ? 'active' : ''}
                    onClick={() => void updateStatus(node.id, status)}
                    disabled={updatingNodeId === node.id}
                    key={status}
                  >
                    {statusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </section>
  )
}
