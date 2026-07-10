import type {
  CurrentSkill,
  JobPostInput,
  MarketRoadmapSuggestion,
  RoleSkillTrend
} from './market.types.js';

export const MARKET_KEYWORDS = [
  'React',
  'Java',
  'Spring Boot',
  'Node.js',
  'Express',
  'Docker',
  'AWS',
  'SQL',
  'PostgreSQL',
  'Prisma',
  'TypeScript',
  'CI/CD',
  'Testing',
  'Playwright',
  'Python',
  'Data Modeling'
];

const EXTRACTION_ORDER = ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'CI/CD'];

function countKeyword(text: string, keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, 'gi');
  return text.match(pattern)?.length ?? 0;
}

function keywordMatches(text: string, keyword: string) {
  return countKeyword(text, keyword) > 0;
}

export function analyzeKeywordFrequency(posts: JobPostInput[], keywords = MARKET_KEYWORDS) {
  return keywords
    .map((keyword) => {
      const mentions = posts.reduce((sum, post) => {
        const tags = [...(post.tags ?? []), ...(post.skills ?? [])].join(' ');
        return sum + countKeyword(`${post.title} ${post.description} ${tags}`, keyword);
      }, 0);
      const jobCount = posts.filter((post) => {
        const tags = [...(post.tags ?? []), ...(post.skills ?? [])].join(' ');
        return keywordMatches(`${post.title} ${post.description} ${tags}`, keyword);
      }).length;
      return { keyword, mentions, jobCount };
    })
    .sort((a, b) => b.mentions - a.mentions || a.keyword.localeCompare(b.keyword));
}

export function extractJobSkills(post: JobPostInput, keywords = MARKET_KEYWORDS) {
  const text = `${post.title} ${post.description}`;
  const matchedSkills = keywords.filter((keyword) => keywordMatches(text, keyword));
  const tagMatches = [...(post.tags ?? []), ...(post.skills ?? [])]
    .map((tag) => keywords.find((keyword) => keyword.toLowerCase() === tag.toLowerCase()))
    .filter((skill): skill is string => Boolean(skill));

  const orderedSkills = [...new Set([...matchedSkills, ...tagMatches])];
  return orderedSkills.sort((a, b) => {
    const aIndex = EXTRACTION_ORDER.indexOf(a);
    const bIndex = EXTRACTION_ORDER.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    return keywords.indexOf(a) - keywords.indexOf(b);
  });
}

export function summarizeRoleSkillTrends({ roleSkills, posts }: { roleSkills: string[]; posts: JobPostInput[] }) {
  return roleSkills
    .map((skill) => {
      const textMentionTotal = posts.reduce((sum, post) => sum + countKeyword(`${post.title} ${post.description}`, skill), 0);
      const explicitMentionTotal = posts.reduce((sum, post) => {
        const explicitSkillMention = post.skills?.some((postSkill) => postSkill.toLowerCase() === skill.toLowerCase()) ? 1 : 0;
        return sum + explicitSkillMention;
      }, 0);
      const mentions = textMentionTotal + (textMentionTotal <= 1 ? explicitMentionTotal : 0);
      const jobCount = posts.filter((post) => {
        const explicitSkills = post.skills?.join(' ') ?? '';
        return keywordMatches(`${post.title} ${post.description} ${explicitSkills}`, skill);
      }).length;
      return {
        skill,
        mentions,
        jobCount,
        coverage: posts.length > 0 ? Math.round((jobCount / posts.length) * 100) : 0
      };
    })
    .filter((trend) => trend.mentions > 0)
    .sort((a, b) => {
      const aIndex = roleSkills.indexOf(a.skill);
      const bIndex = roleSkills.indexOf(b.skill);
      return b.mentions - a.mentions || b.jobCount - a.jobCount || aIndex - bIndex;
    });
}

export function buildMarketRoadmapSuggestions({
  currentSkills,
  roleTrends
}: {
  currentSkills: CurrentSkill[];
  roleTrends: RoleSkillTrend[];
}) {
  const currentSkillMap = new Map(currentSkills.map((skill) => [skill.name, skill.level]));

  return roleTrends
    .filter((trend) => trend.jobCount >= 2)
    .flatMap<MarketRoadmapSuggestion>((trend) => {
      const currentLevel = currentSkillMap.get(trend.skill);
      if (!currentLevel) {
        return [
          {
            skill: trend.skill,
            priority: 'HIGH',
            reason: `Appears in ${trend.jobCount} live job posts for the target role and is not in the student profile.`,
            suggestedNode: `Build a market-aligned ${trend.skill} portfolio task`
          }
        ];
      }

      if (currentLevel === 'BEGINNER') {
        return [
          {
            skill: trend.skill,
            priority: 'MEDIUM',
            reason: `Appears in ${trend.jobCount} live job posts and current level is BEGINNER.`,
            suggestedNode: `Upgrade ${trend.skill} from beginner to role-ready evidence`
          }
        ];
      }

      return [];
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'HIGH' ? -1 : 1;
      return a.skill.localeCompare(b.skill);
    })
    .slice(0, 5);
}

export function isMarketKeywordMatch(text: string, keyword: string) {
  return keywordMatches(text, keyword);
}
