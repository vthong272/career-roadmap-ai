import { describe, expect, it } from 'vitest';
import { createReadmeFallbackSummary } from '../ai.service.js';

describe('createReadmeFallbackSummary', () => {
  it('extracts an objective and technology signals from README text', () => {
    const summary = createReadmeFallbackSummary(
      'career-roadmap-ai',
      'Career planning platform',
      '# Career Roadmap AI\nA React TypeScript Node.js app for student career planning with PostgreSQL.'
    );

    expect(summary).toContain('Objective: A React TypeScript Node.js app');
    expect(summary).toContain('React');
    expect(summary).toContain('PostgreSQL');
  });
});
