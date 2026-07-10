import { describe, expect, it } from 'vitest';
import { createFallbackLearningPlan, createFallbackMentorAnswer } from '../../features/mentor/mentor-domain.js';

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
        totalNodes: 3,
        roadmapNodes: [
          { title: 'REST API foundations', status: 'COMPLETED', priority: 'HIGH', estimatedHours: 18 },
          { title: 'Relational data modeling', status: 'NOT_STARTED', priority: 'HIGH', estimatedHours: 20 }
        ],
        gpa: 3.35,
        major: 'Software Engineering',
        careerInterests: ['Backend APIs']
      },
      'What should I do this week?'
    );

    expect(answer).toContain('Backend Developer');
    expect(answer).toContain('Docker');
    expect(answer).toContain('PostgreSQL');
    expect(answer).toContain('1/3');
    expect(answer).toContain('Relational data modeling');
  });

  it('creates a structured 7 day learning plan from mentor context', () => {
    const plan = createFallbackLearningPlan(
      {
        studentName: 'Minh',
        headline: 'Backend student',
        targetRole: 'Backend Developer',
        currentSkills: ['Node.js (BEGINNER)'],
        missingSkills: ['Docker'],
        belowLevelSkills: ['PostgreSQL'],
        completedNodes: 0,
        totalNodes: 2,
        roadmapNodes: [
          { title: 'REST API foundations', status: 'NOT_STARTED', priority: 'HIGH', estimatedHours: 18 },
          { title: 'Relational data modeling', status: 'NOT_STARTED', priority: 'HIGH', estimatedHours: 20 }
        ],
        gpa: 3.35,
        major: 'Software Engineering',
        careerInterests: ['Backend APIs']
      },
      7
    );

    expect(plan.horizonDays).toBe(7);
    expect(plan.focus).toContain('Backend Developer');
    expect(plan.items).toHaveLength(4);
    expect(plan.items[0].title).toContain('REST API foundations');
    expect(plan.items[0].evidence).toContain('GitHub');
  });
});
