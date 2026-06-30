import { describe, expect, it } from 'vitest';
import { calculateSkillGap } from '../skill-gap.service.js';

describe('calculateSkillGap', () => {
  it('classifies matched, below-level, and missing skills with a readiness score', () => {
    const analysis = calculateSkillGap(
      [
        {
          skillId: 'node',
          name: 'Node.js',
          category: 'Backend',
          priority: 'HIGH',
          requiredLevel: 'INTERMEDIATE',
          weight: 5
        },
        {
          skillId: 'sql',
          name: 'SQL',
          category: 'Database',
          priority: 'HIGH',
          requiredLevel: 'INTERMEDIATE',
          weight: 5
        },
        {
          skillId: 'docker',
          name: 'Docker',
          category: 'DevOps',
          priority: 'MEDIUM',
          requiredLevel: 'BEGINNER',
          weight: 2
        }
      ],
      [
        { skillId: 'node', level: 'INTERMEDIATE' },
        { skillId: 'sql', level: 'BEGINNER' }
      ]
    );

    expect(analysis.matchedSkills.map((skill) => skill.name)).toEqual(['Node.js']);
    expect(analysis.belowLevelSkills.map((skill) => skill.name)).toEqual(['SQL']);
    expect(analysis.missingSkills.map((skill) => skill.name)).toEqual(['Docker']);
    expect(analysis.readinessScore).toBe(60);
  });
});
