import { describe, expect, it } from 'vitest';
import { ProfileUpdateSchema } from '../profile.routes.js';
import { formatZodValidationMessage } from '../../middleware/error.js';

const validProfile = {
  headline: 'Backend-focused software engineering student',
  location: 'Ho Chi Minh City',
  university: 'FPT University',
  major: 'Software Engineering',
  graduationYear: 2027,
  gpa: 3.5,
  careerInterests: ['Backend APIs'],
  targetRoleId: 'role-backend',
  courses: [],
  transcriptName: null,
  currentSkills: [],
};

describe('ProfileUpdateSchema', () => {
  it('rejects saving a profile with missing personal information', () => {
    const result = ProfileUpdateSchema.safeParse({ ...validProfile, headline: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['headline']);
    }
  });

  it('accepts a complete profile', () => {
    expect(ProfileUpdateSchema.safeParse(validProfile).success).toBe(true);
  });
});

describe('formatZodValidationMessage', () => {
  it('turns a validation issue into a specific field-level API message', () => {
    const result = ProfileUpdateSchema.safeParse({ ...validProfile, gpa: 4.1 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodValidationMessage(result.error)).toBe('GPA: Must be between 0 and 4.');
    }
  });
});
