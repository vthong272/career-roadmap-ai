import { prisma } from '../lib/prisma.js';

export const MARKET_KEYWORDS = ['React', 'Java', 'Spring Boot', 'Node.js', 'Docker', 'AWS', 'SQL', 'PostgreSQL', 'TypeScript', 'CI/CD'];

export interface JobPostInput {
  title: string;
  description: string;
}

function countKeyword(text: string, keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, 'gi');
  return text.match(pattern)?.length ?? 0;
}

export function analyzeKeywordFrequency(posts: JobPostInput[], keywords = MARKET_KEYWORDS) {
  return keywords
    .map((keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      const mentions = posts.reduce((sum, post) => sum + countKeyword(`${post.title} ${post.description}`, keyword), 0);
      const jobCount = posts.filter((post) => `${post.title} ${post.description}`.toLowerCase().includes(normalizedKeyword)).length;
      return { keyword, mentions, jobCount };
    })
    .sort((a, b) => b.mentions - a.mentions || a.keyword.localeCompare(b.keyword));
}

export async function getMarketPulse() {
  const posts = await prisma.jobPost.findMany({ orderBy: { postedAt: 'desc' } });
  return {
    keywords: analyzeKeywordFrequency(posts),
    posts
  };
}
