import { describe, expect, it } from 'vitest';
import { analyzeKeywordFrequency } from '../market.service.js';

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
});
