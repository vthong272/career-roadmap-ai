import { describe, expect, it } from 'vitest';
import {
  analyzeKeywordFrequency,
  buildMarketRoadmapSuggestions,
  extractJobSkills,
  summarizeRoleSkillTrends
} from '../../features/market/market-analysis.js';

describe('analyzeKeywordFrequency', () => {
  it('counts keyword mentions across job titles and descriptions', () => {
    const trends = analyzeKeywordFrequency(
      [
        { title: 'React Developer', description: 'React TypeScript SQL' },
        { title: 'Backend Node.js', description: 'Node.js Docker SQL SQL' }
      ],
      ['React', 'Node.js', 'SQL', 'Docker']
    );

    expect(trends).toEqual([
      { keyword: 'SQL', mentions: 3, jobCount: 2 },
      { keyword: 'Node.js', mentions: 2, jobCount: 1 },
      { keyword: 'React', mentions: 2, jobCount: 1 },
      { keyword: 'Docker', mentions: 1, jobCount: 1 },
    ]);
  });

  it('extracts canonical skills from title, description, and tag fields', () => {
    const skills = extractJobSkills({
      title: 'Backend TypeScript Engineer',
      description: 'Build Node.js APIs with PostgreSQL, Docker, and CI/CD.',
      tags: ['AWS', 'not-a-skill']
    });

    expect(skills).toEqual(['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'CI/CD']);
  });

  it('summarizes target role skills against job market demand', () => {
    const trends = summarizeRoleSkillTrends({
      roleSkills: ['Node.js', 'PostgreSQL', 'Docker', 'Testing'],
      posts: [
        { title: 'Backend Node.js Engineer', description: 'Node.js PostgreSQL Docker', skills: ['Node.js', 'PostgreSQL', 'Docker'] },
        { title: 'API Developer', description: 'Node.js testing', skills: ['Node.js', 'Testing'] }
      ]
    });

    expect(trends).toEqual([
      { skill: 'Node.js', mentions: 3, jobCount: 2, coverage: 100 },
      { skill: 'PostgreSQL', mentions: 2, jobCount: 1, coverage: 50 },
      { skill: 'Docker', mentions: 2, jobCount: 1, coverage: 50 },
      { skill: 'Testing', mentions: 2, jobCount: 1, coverage: 50 }
    ]);
  });

  it('turns market pressure into roadmap suggestions', () => {
    const suggestions = buildMarketRoadmapSuggestions({
      currentSkills: [{ name: 'Node.js', level: 'BEGINNER' }],
      roleTrends: [
        { skill: 'Node.js', mentions: 5, jobCount: 3, coverage: 75 },
        { skill: 'PostgreSQL', mentions: 4, jobCount: 2, coverage: 50 },
        { skill: 'Docker', mentions: 1, jobCount: 1, coverage: 25 }
      ]
    });

    expect(suggestions).toEqual([
      {
        skill: 'PostgreSQL',
        priority: 'HIGH',
        reason: 'Appears in 2 live job posts for the target role and is not in the student profile.',
        suggestedNode: 'Build a market-aligned PostgreSQL portfolio task'
      },
      {
        skill: 'Node.js',
        priority: 'MEDIUM',
        reason: 'Appears in 3 live job posts and current level is BEGINNER.',
        suggestedNode: 'Upgrade Node.js from beginner to role-ready evidence'
      }
    ]);
  });
});
