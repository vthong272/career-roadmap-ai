import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { AdminSummary, CareerRole, Skill } from '../../types'
import { useAuth } from '../auth/AuthContext'

interface ManagementRole extends CareerRole {
  learningNodes: Array<{ id: string; title: string; resources: Array<{ id: string; title: string }> }>
}

export function AdminPage() {
  const { request, user } = useAuth()
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [roles, setRoles] = useState<ManagementRole[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [roleForm, setRoleForm] = useState({ slug: '', title: '', summary: '', demandLevel: 'Stable' })
  const [skillForm, setSkillForm] = useState({ name: '', category: '', description: '' })
  const [nodeForm, setNodeForm] = useState({
    roleId: '',
    skillId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    estimatedHours: '10',
    sortOrder: '1',
  })
  const [resourceForm, setResourceForm] = useState({ nodeId: '', title: '', url: '', type: 'DOCUMENTATION' })

  const nodes = useMemo(() => roles.flatMap((role) => role.learningNodes.map((node) => ({ ...node, roleTitle: role.title }))), [roles])

  const loadAdminData = useCallback(async () => {
    const [summaryPayload, managementPayload] = await Promise.all([
      request<{ summary: AdminSummary }>('/admin/summary'),
      request<{ roles: ManagementRole[]; skills: Skill[] }>('/admin/management-data'),
    ])
    setSummary(summaryPayload.summary)
    setRoles(managementPayload.roles)
    setSkills(managementPayload.skills)
  }, [request])

  useEffect(() => {
    if (user?.role !== 'COUNSELOR_ADMIN') return
    loadAdminData().catch((err) => setError(err instanceof ApiClientError ? err.message : 'Could not load admin data'))
  }, [loadAdminData, user?.role])

  async function createResource(path: string, body: unknown, success: string) {
    setError(null)
    setMessage(null)
    try {
      await request(path, { method: 'POST', body: JSON.stringify(body) })
      setMessage(success)
      await loadAdminData()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Admin action failed')
    }
  }

  if (user?.role !== 'COUNSELOR_ADMIN') {
    return (
      <section className="panel state-panel">
        <ShieldCheck size={24} aria-hidden="true" />
        <h2>Counselor/Admin access required</h2>
        <p>Login with the counselor demo account to manage roles, skills, nodes, and resources.</p>
      </section>
    )
  }

  return (
    <section className="page-stack" aria-labelledby="admin-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Counselor/Admin</p>
          <h1 id="admin-title">Progress summary and content management</h1>
          <p>Maintain role requirements, skill definitions, learning nodes, and resources used by student roadmaps.</p>
        </div>
      </header>

      {(error || message) && (
        <p className={error ? 'form-error' : 'form-success'} role="status">
          {error ?? message}
        </p>
      )}

      {summary && (
        <section className="trend-grid" aria-label="Admin metrics">
          <Metric label="Students" value={summary.metrics.studentCount} />
          <Metric label="Career roles" value={summary.metrics.roleCount} />
          <Metric label="Skills" value={summary.metrics.skillCount} />
          <Metric label="Resources" value={summary.metrics.resourceCount} />
        </section>
      )}

      <section className="admin-grid">
        <AdminForm title="Career role">
          <input placeholder="backend-developer" value={roleForm.slug} onChange={(event) => setRoleForm({ ...roleForm, slug: event.target.value })} />
          <input placeholder="Backend Developer" value={roleForm.title} onChange={(event) => setRoleForm({ ...roleForm, title: event.target.value })} />
          <input placeholder="Demand level" value={roleForm.demandLevel} onChange={(event) => setRoleForm({ ...roleForm, demandLevel: event.target.value })} />
          <textarea placeholder="Role summary" value={roleForm.summary} onChange={(event) => setRoleForm({ ...roleForm, summary: event.target.value })} />
          <button className="primary-button" type="button" onClick={() => void createResource('/admin/career-roles', roleForm, 'Career role created')}>
            <Plus size={16} aria-hidden="true" />
            Add role
          </button>
        </AdminForm>

        <AdminForm title="Skill">
          <input placeholder="Skill name" value={skillForm.name} onChange={(event) => setSkillForm({ ...skillForm, name: event.target.value })} />
          <input placeholder="Category" value={skillForm.category} onChange={(event) => setSkillForm({ ...skillForm, category: event.target.value })} />
          <textarea placeholder="Description" value={skillForm.description} onChange={(event) => setSkillForm({ ...skillForm, description: event.target.value })} />
          <button className="primary-button" type="button" onClick={() => void createResource('/admin/skills', skillForm, 'Skill created')}>
            <Plus size={16} aria-hidden="true" />
            Add skill
          </button>
        </AdminForm>

        <AdminForm title="Learning node">
          <select value={nodeForm.roleId} onChange={(event) => setNodeForm({ ...nodeForm, roleId: event.target.value })}>
            <option value="">Select role</option>
            {roles.map((role) => (
              <option value={role.id} key={role.id}>
                {role.title}
              </option>
            ))}
          </select>
          <select value={nodeForm.skillId} onChange={(event) => setNodeForm({ ...nodeForm, skillId: event.target.value })}>
            <option value="">No linked skill</option>
            {skills.map((skill) => (
              <option value={skill.id} key={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
          <input placeholder="Node title" value={nodeForm.title} onChange={(event) => setNodeForm({ ...nodeForm, title: event.target.value })} />
          <textarea placeholder="Description" value={nodeForm.description} onChange={(event) => setNodeForm({ ...nodeForm, description: event.target.value })} />
          <select value={nodeForm.priority} onChange={(event) => setNodeForm({ ...nodeForm, priority: event.target.value })}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
          <input type="number" min="1" value={nodeForm.estimatedHours} onChange={(event) => setNodeForm({ ...nodeForm, estimatedHours: event.target.value })} />
          <input type="number" min="1" value={nodeForm.sortOrder} onChange={(event) => setNodeForm({ ...nodeForm, sortOrder: event.target.value })} />
          <button
            className="primary-button"
            type="button"
            onClick={() =>
              void createResource(
                '/admin/learning-nodes',
                {
                  ...nodeForm,
                  skillId: nodeForm.skillId || null,
                  estimatedHours: Number(nodeForm.estimatedHours),
                  sortOrder: Number(nodeForm.sortOrder),
                },
                'Learning node created',
              )
            }
          >
            <Plus size={16} aria-hidden="true" />
            Add node
          </button>
        </AdminForm>

        <AdminForm title="Learning resource">
          <select value={resourceForm.nodeId} onChange={(event) => setResourceForm({ ...resourceForm, nodeId: event.target.value })}>
            <option value="">Select node</option>
            {nodes.map((node) => (
              <option value={node.id} key={node.id}>
                {node.roleTitle}: {node.title}
              </option>
            ))}
          </select>
          <input placeholder="Resource title" value={resourceForm.title} onChange={(event) => setResourceForm({ ...resourceForm, title: event.target.value })} />
          <input placeholder="https://..." value={resourceForm.url} onChange={(event) => setResourceForm({ ...resourceForm, url: event.target.value })} />
          <select value={resourceForm.type} onChange={(event) => setResourceForm({ ...resourceForm, type: event.target.value })}>
            <option value="COURSE">COURSE</option>
            <option value="DOCUMENTATION">DOCUMENTATION</option>
            <option value="VIDEO">VIDEO</option>
            <option value="ARTICLE">ARTICLE</option>
            <option value="PROJECT">PROJECT</option>
          </select>
          <button className="primary-button" type="button" onClick={() => void createResource('/admin/learning-resources', resourceForm, 'Resource created')}>
            <Plus size={16} aria-hidden="true" />
            Add resource
          </button>
        </AdminForm>
      </section>

      {summary && (
        <section className="report-panel">
          <h2>Student progress</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Target role</th>
                  <th>Completed</th>
                  <th>In progress</th>
                </tr>
              </thead>
              <tbody>
                {summary.students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.name}</strong>
                      <span>{student.email}</span>
                    </td>
                    <td>{student.targetRole ?? 'Not selected'}</td>
                    <td>{student.completedNodes}</td>
                    <td>{student.inProgressNodes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="trend-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function AdminForm({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-form">
      <h2>{title}</h2>
      <div className="form-grid">{children}</div>
    </section>
  )
}
