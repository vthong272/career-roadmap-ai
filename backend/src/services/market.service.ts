import { prisma } from '../lib/prisma.js';
import {
  analyzeKeywordFrequency,
  buildMarketRoadmapSuggestions,
  extractJobSkills,
  isMarketKeywordMatch,
  MARKET_KEYWORDS,
  summarizeRoleSkillTrends
} from '../features/market/market-analysis.js';
import type { MarketJobPost } from '../features/market/market.types.js';

export {
  analyzeKeywordFrequency,
  buildMarketRoadmapSuggestions,
  extractJobSkills,
  MARKET_KEYWORDS,
  summarizeRoleSkillTrends
} from '../features/market/market-analysis.js';
export type {
  JobPostInput,
  MarketJobPost,
  MarketRoadmapSuggestion,
  RoleSkillTrend
} from '../features/market/market.types.js';

const ROLE_SEARCH_TERMS: Record<string, string[]> = {
  'backend-developer': ['backend developer', 'nodejs developer', 'api developer'],
  'frontend-developer': ['frontend developer', 'react developer', 'typescript developer'],
  'devops-engineer': ['devops engineer', 'cloud engineer', 'ci cd engineer'],
  'data-engineer': ['data engineer', 'python sql engineer', 'etl developer'],
  'mobile-developer': ['mobile developer', 'react native developer'],
  'qa-engineer': ['qa automation engineer', 'playwright tester']
};

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(baseUrl: string, href: string | null) {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function parseJsonLdJobs(html: string, source: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return scripts.flatMap<MarketJobPost>((script) => {
    try {
      const parsed = JSON.parse(script[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      return items
        .filter((item) => item?.['@type'] === 'JobPosting')
        .map((item) => ({
          title: String(item.title ?? 'Untitled role'),
          company: String(item.hiringOrganization?.name ?? 'Unknown company'),
          location: String(item.jobLocation?.address?.addressLocality ?? item.applicantLocationRequirements?.name ?? 'Vietnam'),
          source,
          salary: item.baseSalary?.value?.value ? String(item.baseSalary.value.value) : null,
          url: item.url ? String(item.url) : null,
          description: cleanText(String(item.description ?? '')),
          postedAt: item.datePosted ? new Date(item.datePosted) : undefined
        }));
    } catch {
      return [];
    }
  });
}

function parseAnchorJobs(html: string, baseUrl: string, source: string) {
  const anchors = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  return anchors
    .map<MarketJobPost | null>((anchor) => {
      const title = cleanText(anchor[2]);
      if (title.length < 8 || !MARKET_KEYWORDS.some((keyword) => isMarketKeywordMatch(title, keyword))) return null;
      const url = absoluteUrl(baseUrl, anchor[1]);
      return {
        title,
        company: 'Source page listing',
        location: 'Vietnam',
        source,
        salary: null,
        url,
        description: title,
        skills: extractJobSkills({ title, description: title })
      };
    })
    .filter((post): post is MarketJobPost => Boolean(post))
    .slice(0, 8);
}

async function fetchSource(url: string, source: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'user-agent': 'CareerRoadmapAI/0.1 educational market trend crawler'
      }
    });
    if (!response.ok) return [];
    const html = await response.text();
    const jsonLdJobs = parseJsonLdJobs(html, source);
    const parsedJobs = jsonLdJobs.length > 0 ? jsonLdJobs : parseAnchorJobs(html, url, source);
    return parsedJobs.map((post) => ({
      ...post,
      skills: post.skills?.length ? post.skills : extractJobSkills(post),
      externalId: post.url ?? `${source}:${post.title}:${post.company}`
    }));
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLiveJobPosts(searchTerms: string[]) {
  const query = encodeURIComponent(searchTerms[0] ?? 'software engineer');
  const sources = [
    {
      source: 'TopCV',
      url: `https://www.topcv.vn/tim-viec-lam-it-phan-mem-c10026?keyword=${query}`
    },
    {
      source: 'CareerViet',
      url: `https://careerviet.vn/viec-lam/tat-ca-viec-lam-vi.html?keyword=${query}`
    },
    {
      source: 'VietnamWorks',
      url: `https://www.vietnamworks.com/viec-lam?q=${query}`
    }
  ];

  const batches = await Promise.allSettled(sources.map((source) => fetchSource(source.url, source.source)));
  return batches.flatMap((batch) => (batch.status === 'fulfilled' ? batch.value : []));
}

function curatedMarketPosts(searchTerms: string[]): MarketJobPost[] {
  const roleTerm = searchTerms[0] ?? 'backend developer';
  return [
    {
      externalId: `curated:${roleTerm}:topcv:node`,
      title: 'Backend Node.js Developer',
      company: 'TopCV aggregated listing',
      location: 'Ho Chi Minh City',
      source: 'TopCV',
      salary: 'Up to 35M VND',
      url: 'https://www.topcv.vn/viec-lam-it-phan-mem-c10026',
      description: 'Node.js Express PostgreSQL Docker REST API TypeScript Testing CI/CD',
      skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'TypeScript', 'Testing', 'CI/CD']
    },
    {
      externalId: `curated:${roleTerm}:careerviet:api`,
      title: 'API Developer',
      company: 'CareerViet aggregated listing',
      location: 'Hybrid - Vietnam',
      source: 'CareerViet',
      salary: 'Negotiable',
      url: 'https://careerviet.vn/',
      description: 'Build backend services with Node.js PostgreSQL Prisma AWS and automated testing.',
      skills: ['Node.js', 'PostgreSQL', 'Prisma', 'AWS', 'Testing']
    },
    {
      externalId: `curated:${roleTerm}:vietnamworks:backend`,
      title: 'Junior Backend Engineer',
      company: 'VietnamWorks aggregated listing',
      location: 'Da Nang',
      source: 'VietnamWorks',
      salary: '18M - 28M VND',
      url: 'https://www.vietnamworks.com/en',
      description: 'TypeScript Node.js SQL Docker Git/GitHub backend engineer role.',
      skills: ['TypeScript', 'Node.js', 'SQL', 'Docker']
    }
  ];
}

export async function syncMarketJobs(searchTerms: string[]) {
  const livePosts = await fetchLiveJobPosts(searchTerms);
  const posts = livePosts.length > 0 ? livePosts : curatedMarketPosts(searchTerms);

  for (const post of posts) {
    await prisma.jobPost.upsert({
      where: { externalId: post.externalId ?? `${post.source}:${post.title}:${post.company}` },
      update: {
        title: post.title,
        company: post.company,
        location: post.location,
        source: post.source,
        salary: post.salary,
        skills: post.skills ?? extractJobSkills(post),
        url: post.url,
        description: post.description,
        postedAt: post.postedAt,
        fetchedAt: new Date()
      },
      create: {
        externalId: post.externalId ?? `${post.source}:${post.title}:${post.company}`,
        title: post.title,
        company: post.company,
        location: post.location,
        source: post.source,
        salary: post.salary,
        skills: post.skills ?? extractJobSkills(post),
        url: post.url,
        description: post.description,
        postedAt: post.postedAt,
        fetchedAt: new Date()
      }
    });
  }

  return posts.length;
}

export async function getMarketPulse(userId?: string) {
  const profile = userId
    ? await prisma.studentProfile.findUnique({
        where: { userId },
        include: {
          targetRole: { include: { requirements: { include: { skill: true } } } },
          user: { include: { studentSkills: { include: { skill: true } } } }
        }
      })
    : null;

  const searchTerms = profile?.targetRole?.slug
    ? ROLE_SEARCH_TERMS[profile.targetRole.slug] ?? [profile.targetRole.title]
    : ['software engineer'];

  let posts = await prisma.jobPost.findMany({ orderBy: { postedAt: 'desc' }, take: 30 });
  if (posts.length === 0) {
    await syncMarketJobs(searchTerms);
    posts = await prisma.jobPost.findMany({ orderBy: { postedAt: 'desc' }, take: 30 });
  }

  const normalizedPosts = posts.map((post) => ({
    ...post,
    skills: post.skills.length > 0 ? post.skills : extractJobSkills(post)
  }));
  const roleSkills = profile?.targetRole?.requirements.map((requirement) => requirement.skill.name) ?? MARKET_KEYWORDS.slice(0, 8);
  const roleTrends = summarizeRoleSkillTrends({ roleSkills, posts: normalizedPosts });
  const suggestions = buildMarketRoadmapSuggestions({
    currentSkills:
      profile?.user.studentSkills.map((studentSkill) => ({
        name: studentSkill.skill.name,
        level: studentSkill.level
      })) ?? [],
    roleTrends
  });

  return {
    keywords: analyzeKeywordFrequency(normalizedPosts),
    roleTrends,
    suggestions,
    sources: [...new Set(normalizedPosts.map((post) => post.source))],
    posts: normalizedPosts
  };
}
