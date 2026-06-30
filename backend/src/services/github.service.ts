import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/error.js';
import { summarizeProjectReadme } from './ai.service.js';

const GitHubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  html_url: z.string().url(),
  repos_url: z.string().url()
});

const GitHubRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  html_url: z.string().url(),
  fork: z.boolean().optional()
});

function githubHeaders(accept = 'application/vnd.github+json') {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'career-roadmap-ai'
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    throw new ApiError(response.status === 404 ? 404 : 502, 'GITHUB_FETCH_FAILED', 'Could not fetch GitHub profile.');
  }
  return response.json();
}

async function fetchReadme(username: string, repoName: string) {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/readme`, {
    headers: githubHeaders('application/vnd.github.raw')
  });

  if (!response.ok) {
    return null;
  }

  return response.text();
}

export async function syncGitHubPortfolio(userId: string, username: string) {
  const normalizedUsername = username.trim();
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(normalizedUsername)) {
    throw new ApiError(422, 'INVALID_GITHUB_USERNAME', 'GitHub username format is invalid.');
  }

  const githubUser = GitHubUserSchema.parse(await fetchJson(`https://api.github.com/users/${normalizedUsername}`));
  const repoPayload = await fetchJson(`${githubUser.repos_url}?per_page=20&sort=updated`);
  const repos = z.array(GitHubRepoSchema).parse(repoPayload).filter((repo) => !repo.fork).slice(0, 12);

  const profile = await prisma.gitHubProfile.upsert({
    where: { userId },
    update: {
      username: githubUser.login,
      displayName: githubUser.name,
      bio: githubUser.bio,
      avatarUrl: githubUser.avatar_url,
      htmlUrl: githubUser.html_url,
      syncedAt: new Date()
    },
    create: {
      userId,
      username: githubUser.login,
      displayName: githubUser.name,
      bio: githubUser.bio,
      avatarUrl: githubUser.avatar_url,
      htmlUrl: githubUser.html_url
    }
  });

  await prisma.gitHubRepository.deleteMany({ where: { profileId: profile.id } });

  for (const repo of repos) {
    const readme = await fetchReadme(githubUser.login, repo.name);
    const readmeSummary = await summarizeProjectReadme(repo.name, repo.description, readme);
    await prisma.gitHubRepository.create({
      data: {
        profileId: profile.id,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        url: repo.html_url,
        readmeSummary
      }
    });
  }

  return getPortfolioForUser(userId);
}

export async function getPortfolioForUser(userId: string) {
  return prisma.gitHubProfile.findUnique({
    where: { userId },
    include: { repos: { orderBy: [{ stars: 'desc' }, { name: 'asc' }] } }
  });
}

export async function getPublicPortfolio(username: string) {
  const portfolio = await prisma.gitHubProfile.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
    include: {
      repos: { orderBy: [{ stars: 'desc' }, { name: 'asc' }] },
      user: {
        select: {
          name: true,
          profile: {
            select: {
              headline: true,
              university: true,
              major: true,
              targetRole: { select: { title: true } }
            }
          }
        }
      }
    }
  });

  if (!portfolio) {
    throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio was not found.');
  }

  return portfolio;
}
