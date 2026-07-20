import type { SkillLevel } from '../../types'

export interface ProfileFormState {
  headline: string
  location: string
  university: string
  major: string
  graduationYear: string
  gpa: string
  careerInterests: string
  courses: string
  transcriptName: string
  targetRoleId: string
}

export interface ProfileFormError {
  field: keyof ProfileFormState
  message: string
}

const MAX_TRANSCRIPT_SIZE = 5 * 1024 * 1024
const TRANSCRIPT_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg'])
const TRANSCRIPT_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg'])

export function validateProfileForm(form: ProfileFormState): ProfileFormError | null {
  const requiredTextFields: Array<[keyof ProfileFormState, string]> = [
    ['headline', 'Please enter a headline.'],
    ['location', 'Please enter your location.'],
    ['university', 'Please enter your university.'],
    ['major', 'Please enter your major.'],
  ]

  for (const [field, message] of requiredTextFields) {
    if (!form[field].trim()) return { field, message }
  }

  const graduationYear = Number(form.graduationYear)
  if (!form.graduationYear || !Number.isInteger(graduationYear) || graduationYear < 2020 || graduationYear > 2040) {
    return { field: 'graduationYear', message: 'Graduation year must be between 2020 and 2040.' }
  }

  const gpa = Number(form.gpa)
  if (!form.gpa || !Number.isFinite(gpa) || gpa < 0 || gpa > 4) {
    return { field: 'gpa', message: 'GPA must be between 0 and 4.' }
  }

  if (!form.targetRoleId) return { field: 'targetRoleId', message: 'Please choose a target role.' }
  if (!form.careerInterests.split(',').some((interest) => interest.trim())) {
    return { field: 'careerInterests', message: 'Please enter at least one career interest.' }
  }

  return null
}

export function validateTranscriptFile(file: Pick<File, 'name' | 'size' | 'type'>): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!TRANSCRIPT_EXTENSIONS.has(extension) || (file.type && !TRANSCRIPT_TYPES.has(file.type))) {
    return 'Upload a PDF, PNG, JPG, or JPEG transcript.'
  }
  if (file.size > MAX_TRANSCRIPT_SIZE) return 'Transcript file must be 5 MB or smaller.'
  return null
}

export function buildProfilePayload(
  form: ProfileFormState,
  currentSkills: Array<{ skillId: string; level: SkillLevel }>,
) {
  const courses = form.courses
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, name, grade] = line.split('|').map((part) => part.trim())
      return { code, name, grade: grade || undefined }
    })
    .filter((course) => course.code && course.name)

  return {
    headline: form.headline.trim(),
    location: form.location.trim(),
    university: form.university.trim(),
    major: form.major.trim(),
    graduationYear: Number(form.graduationYear),
    gpa: Number(form.gpa),
    careerInterests: form.careerInterests
      .split(',')
      .map((interest) => interest.trim())
      .filter(Boolean),
    courses,
    transcriptName: form.transcriptName || null,
    targetRoleId: form.targetRoleId,
    currentSkills,
  }
}
