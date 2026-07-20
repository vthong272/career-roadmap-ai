import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, BriefcaseBusiness, Save, Sparkles, UserRound } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { CareerRole, ProfileResponse, Skill, SkillLevel } from '../../types'
import { useAuth } from '../auth/auth-context'
import { buildProfilePayload, validateProfileForm, validateTranscriptFile, type ProfileFormState } from './profile-form'

const levels: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export function ProfilePage({ onContinue }: { onContinue?: () => void }) {
  const { request } = useAuth()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [roles, setRoles] = useState<CareerRole[]>([])
  const [form, setForm] = useState<ProfileFormState>({
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
    const validationError = validateProfileForm(form)
    if (validationError) {
      setError(validationError.message)
      document.getElementById(validationError.field)?.focus()
      return
    }

    setIsSaving(true)
    try {
      const currentSkills = Object.entries(skillSelections)
        .filter(([, level]) => Boolean(level))
        .map(([skillId, level]) => ({ skillId, level: level as SkillLevel }))

      const payload = await request<{ profile: ProfileResponse }>('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify(buildProfilePayload(form, currentSkills)),
      })
      setProfile(payload.profile)
      setMessage('Profile saved')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not save profile')
    } finally {
      setIsSaving(false)
    }
  }

  function selectTranscript(file: File | undefined) {
    setMessage(null)
    if (!file) {
      setForm({ ...form, transcriptName: '' })
      return
    }

    const fileError = validateTranscriptFile(file)
    if (fileError) {
      setError(fileError)
      setForm({ ...form, transcriptName: '' })
      return
    }

    setError(null)
    setForm({ ...form, transcriptName: file.name })
  }

  function fillDemoProfile() {
    const targetRole = roles.find((role) => role.slug === 'backend-developer') ?? roles[0]
    const demoLevels: Record<string, SkillLevel> = {
      JavaScript: 'INTERMEDIATE',
      TypeScript: 'BEGINNER',
      'Node.js': 'BEGINNER',
      PostgreSQL: 'BEGINNER',
      'Git/GitHub': 'INTERMEDIATE',
      Testing: 'BEGINNER',
    }

    setForm({
      headline: 'Software engineering student interested in backend systems',
      location: 'Ho Chi Minh City',
      university: 'FPT University',
      major: 'Software Engineering',
      graduationYear: '2027',
      gpa: '3.35',
      careerInterests: 'Backend Developer, Cloud APIs, Database Design',
      courses: 'PRN212|.NET and backend fundamentals|B+\nSWP391|Software development project|A',
      transcriptName: 'manual-entry',
      targetRoleId: targetRole?.id ?? '',
    })
    setSkillSelections(
      Object.fromEntries(skills.filter((skill) => demoLevels[skill.name]).map((skill) => [skill.id, demoLevels[skill.name]])),
    )
    setMessage('Demo profile filled. Save it before opening skill gap.')
    setError(null)
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
          <p>Keep this profile current so gap analysis, roadmap generation, and mentor answers use the right context.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => void saveProfile()} disabled={isSaving}>
          <Save size={18} aria-hidden="true" />
          {isSaving ? 'Saving...' : 'Save profile'}
        </button>
      </header>

      <section className="metric-strip" aria-label="Profile summary">
        <article>
          <UserRound size={18} aria-hidden="true" />
          <div>
            <strong>{profile.name}</strong>
            <span>{profile.email}</span>
          </div>
        </article>
        <article>
          <BriefcaseBusiness size={18} aria-hidden="true" />
          <div>
            <strong>{profile.profile?.targetRole?.title ?? 'No target role'}</strong>
            <span>Career direction</span>
          </div>
        </article>
        <article>
          <BookOpen size={18} aria-hidden="true" />
          <div>
            <strong>{profile.studentSkills.length}</strong>
            <span>Saved skills</span>
          </div>
        </article>
      </section>

      {(error || message) && (
        <p id="profile-feedback" className={error ? 'form-error' : 'form-success'} role={error ? 'alert' : 'status'}>
          {error ?? message}
        </p>
      )}

      <section className="demo-action-bar" aria-label="Profile demo actions">
        <button className="secondary-button" type="button" onClick={fillDemoProfile} disabled={roles.length === 0 || skills.length === 0}>
          <Sparkles size={18} aria-hidden="true" />
          Fill demo profile
        </button>
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue to Skill Gap
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <section className="form-section">
        <div>
          <h2>Personal information</h2>
          <p>All fields are required and are used for gap analysis, roadmap generation, and mentor answers.</p>
        </div>
        <div className="form-grid two-columns">
          <label>
            Headline *
            <input id="headline" required value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} />
          </label>
          <label>
            Location *
            <input id="location" required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </label>
          <label>
            University *
            <input id="university" required value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} />
          </label>
          <label>
            Major *
            <input id="major" required value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} />
          </label>
          <label>
            Graduation year *
            <input
              type="number"
              id="graduationYear"
              required
              min="2020"
              max="2040"
              value={form.graduationYear}
              onChange={(event) => setForm({ ...form, graduationYear: event.target.value })}
            />
          </label>
          <label>
            GPA *
            <input
              type="number"
              id="gpa"
              required
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
            Target role *
            <select id="targetRoleId" required value={form.targetRoleId} onChange={(event) => setForm({ ...form, targetRoleId: event.target.value })}>
              <option value="">Choose role</option>
              {roles.map((role) => (
                <option value={role.id} key={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Career interests *
            <input
              id="careerInterests"
              required
              value={form.careerInterests}
              onChange={(event) => setForm({ ...form, careerInterests: event.target.value })}
              placeholder="Backend APIs, Cloud, Data Modeling"
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div>
          <h2>Transcript upload</h2>
          <p>Choose a transcript file. Its name is saved for reference; automatic course parsing is not available yet.</p>
        </div>
        <div className="form-grid">
          <label>
            Transcript file
            <input
              id="transcriptName"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(event) => selectTranscript(event.target.files?.[0])}
            />
            <small>{form.transcriptName ? `Selected: ${form.transcriptName}` : 'PDF, PNG, JPG, or JPEG; maximum 5 MB.'}</small>
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
