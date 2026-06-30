import { useEffect, useMemo, useState } from 'react'
import { Save, Upload } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { CareerRole, ProfileResponse, Skill, SkillLevel } from '../../types'
import { useAuth } from '../auth/AuthContext'

const levels: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export function ProfilePage() {
  const { request } = useAuth()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [roles, setRoles] = useState<CareerRole[]>([])
  const [form, setForm] = useState({
    headline: '',
    location: '',
    university: '',
    major: '',
    graduationYear: '',
    gpa: '',
    careerInterests: '',
    courses: '',
    transcriptName: '',
    targetRoleId: '',
  })
  const [skillSelections, setSkillSelections] = useState<Record<string, SkillLevel | ''>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      request<{ profile: ProfileResponse }>('/profile/me'),
      request<{ skills: Skill[] }>('/skills'),
      request<{ roles: CareerRole[] }>('/career-roles'),
    ])
      .then(([profilePayload, skillPayload, rolePayload]) => {
        if (!isMounted) return
        const nextProfile = profilePayload.profile
        setProfile(nextProfile)
        setSkills(skillPayload.skills)
        setRoles(rolePayload.roles)
        setForm({
          headline: nextProfile.profile?.headline ?? '',
          location: nextProfile.profile?.location ?? '',
          university: nextProfile.profile?.university ?? '',
          major: nextProfile.profile?.major ?? '',
          graduationYear: nextProfile.profile?.graduationYear?.toString() ?? '',
          gpa: nextProfile.profile?.gpa?.toString() ?? '',
          careerInterests: nextProfile.profile?.careerInterests?.join(', ') ?? '',
          courses:
            nextProfile.profile?.courses?.map((course) => [course.code, course.name, course.grade].filter(Boolean).join('|')).join('\n') ?? '',
          transcriptName: nextProfile.profile?.transcriptName ?? '',
          targetRoleId: nextProfile.profile?.targetRoleId ?? '',
        })
        setSkillSelections(
          Object.fromEntries(nextProfile.studentSkills.map((studentSkill) => [studentSkill.skillId, studentSkill.level])),
        )
      })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Could not load profile data'))

    return () => {
      isMounted = false
    }
  }, [request])

  const skillsByCategory = useMemo(() => {
    return skills.reduce<Record<string, Skill[]>>((groups, skill) => {
      groups[skill.category] = [...(groups[skill.category] ?? []), skill]
      return groups
    }, {})
  }, [skills])

  async function saveProfile() {
    setError(null)
    setMessage(null)
    setIsSaving(true)
    try {
      const currentSkills = Object.entries(skillSelections)
        .filter(([, level]) => Boolean(level))
        .map(([skillId, level]) => ({ skillId, level: level as SkillLevel }))

      const courses = form.courses
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [code, name, grade] = line.split('|').map((part) => part.trim())
          return { code, name, grade: grade || undefined }
        })
        .filter((course) => course.code && course.name)

      const payload = await request<{ profile: ProfileResponse }>('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify({
          headline: form.headline || null,
          location: form.location || null,
          university: form.university || null,
          major: form.major || null,
          graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
          gpa: form.gpa ? Number(form.gpa) : null,
          careerInterests: form.careerInterests
            .split(',')
            .map((interest) => interest.trim())
            .filter(Boolean),
          courses,
          transcriptName: form.transcriptName || null,
          targetRoleId: form.targetRoleId || null,
          currentSkills,
        }),
      })
      setProfile(payload.profile)
      setMessage('Profile saved')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not save profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (!profile) {
    return <section className="panel">Loading profile...</section>
  }

  return (
    <section className="page-stack" aria-labelledby="profile-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student profile</p>
          <h1 id="profile-title">Academic and career baseline</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => void saveProfile()} disabled={isSaving}>
          <Save size={18} aria-hidden="true" />
          {isSaving ? 'Saving...' : 'Save profile'}
        </button>
      </header>

      {(error || message) && (
        <p className={error ? 'form-error' : 'form-success'} role="status">
          {error ?? message}
        </p>
      )}

      <section className="form-section">
        <div>
          <h2>Personal information</h2>
          <p>Stored as the context for gap analysis, roadmap generation, and mentor answers.</p>
        </div>
        <div className="form-grid two-columns">
          <label>
            Headline
            <input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </label>
          <label>
            University
            <input value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} />
          </label>
          <label>
            Major
            <input value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} />
          </label>
          <label>
            Graduation year
            <input
              type="number"
              min="2020"
              max="2040"
              value={form.graduationYear}
              onChange={(event) => setForm({ ...form, graduationYear: event.target.value })}
            />
          </label>
          <label>
            GPA
            <input
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={form.gpa}
              onChange={(event) => setForm({ ...form, gpa: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div>
          <h2>Career direction</h2>
          <p>Target role requirements drive the next gap report and roadmap.</p>
        </div>
        <div className="form-grid">
          <label>
            Target role
            <select value={form.targetRoleId} onChange={(event) => setForm({ ...form, targetRoleId: event.target.value })}>
              <option value="">Choose role</option>
              {roles.map((role) => (
                <option value={role.id} key={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Career interests
            <input
              value={form.careerInterests}
              onChange={(event) => setForm({ ...form, careerInterests: event.target.value })}
              placeholder="Backend APIs, Cloud, Data Modeling"
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div>
          <h2>Transcript input</h2>
          <p>Manual course input keeps the MVP usable until file parsing is added.</p>
        </div>
        <div className="form-grid">
          <label>
            Transcript placeholder
            <span className="input-with-icon">
              <Upload size={16} aria-hidden="true" />
              <input
                value={form.transcriptName}
                onChange={(event) => setForm({ ...form, transcriptName: event.target.value })}
                placeholder="manual-entry or transcript-fall-2026.pdf"
              />
            </span>
          </label>
          <label>
            Courses
            <textarea
              rows={5}
              value={form.courses}
              onChange={(event) => setForm({ ...form, courses: event.target.value })}
              placeholder="SWP391|Software Development Project|A"
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div>
          <h2>Current skills</h2>
          <p>Select known skills and current confidence level.</p>
        </div>
        <div className="skill-matrix">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div className="skill-group" key={category}>
              <h3>{category}</h3>
              {categorySkills.map((skill) => (
                <label className="skill-row" key={skill.id}>
                  <span>{skill.name}</span>
                  <select
                    value={skillSelections[skill.id] ?? ''}
                    onChange={(event) => setSkillSelections({ ...skillSelections, [skill.id]: event.target.value as SkillLevel | '' })}
                    aria-label={`${skill.name} level`}
                  >
                    <option value="">Not selected</option>
                    {levels.map((level) => (
                      <option value={level} key={level}>
                        {level.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
