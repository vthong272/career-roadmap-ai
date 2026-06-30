import { describe, expect, it } from 'vitest';
import { createFallbackMentorAnswer } from '../ai.service.js';

describe('createFallbackMentorAnswer', () => {
  it('uses target role, skill gaps, and roadmap progress in the answer', () => {
    const answer = createFallbackMentorAnswer(
      {
        studentName: 'Minh',
        headline: 'Backend student',
        targetRole: 'Backend Developer',
        currentSkills: ['Node.js (BEGINNER)'],
        missingSkills: ['Docker', 'Testing'],
        belowLevelSkills: ['PostgreSQL'],
        completedNodes: 1,
        totalNodes: 3
      },
      'What should I do this week?'
    );

    expect(answer).toContain('Backend Developer');
    expect(answer).toContain('Docker');
    expect(answer).toContain('PostgreSQL');
    expect(answer).toContain('1/3');
  });
});
