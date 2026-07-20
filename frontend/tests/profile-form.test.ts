import { describe, expect, it } from 'vitest'
import { buildProfilePayload, validateProfileForm, validateTranscriptFile } from '../src/features/profile/profile-form'

const completeForm = {
  headline: 'Backend-focused software engineering student',
  location: 'Ho Chi Minh City',
  university: 'FPT University',
  major: 'Software Engineering',
  graduationYear: '2027',
  gpa: '3.5',
  careerInterests: 'Backend APIs, Cloud',
  courses: 'SWP391|Software Development Project|A',
  transcriptName: 'transcript.pdf',
  targetRoleId: 'role-backend',
}

describe('profile form validation', () => {
  it('blocks an empty profile with a specific field message', () => {
    expect(validateProfileForm({ ...completeForm, headline: '' })).toEqual({
      field: 'headline',
      message: 'Please enter a headline.',
    })
  })

  it('reports an out-of-range GPA before sending the request', () => {
    expect(validateProfileForm({ ...completeForm, gpa: '4.1' })).toEqual({
      field: 'gpa',
      message: 'GPA must be between 0 and 4.',
    })
  })

  it('builds a trimmed API payload after validation succeeds', () => {
    expect(buildProfilePayload({ ...completeForm, headline: `  ${completeForm.headline}  ` }, [])).toMatchObject({
      headline: completeForm.headline,
      graduationYear: 2027,
      gpa: 3.5,
      careerInterests: ['Backend APIs', 'Cloud'],
      courses: [{ code: 'SWP391', name: 'Software Development Project', grade: 'A' }],
    })
  })
})

describe('transcript file validation', () => {
  it('rejects unsupported file types with a specific message', () => {
    expect(validateTranscriptFile({ name: 'transcript.exe', size: 100, type: 'application/octet-stream' })).toBe(
      'Upload a PDF, PNG, JPG, or JPEG transcript.',
    )
  })

  it('rejects transcript files larger than 5 MB', () => {
    expect(validateTranscriptFile({ name: 'transcript.pdf', size: 5 * 1024 * 1024 + 1, type: 'application/pdf' })).toBe(
      'Transcript file must be 5 MB or smaller.',
    )
  })
})
