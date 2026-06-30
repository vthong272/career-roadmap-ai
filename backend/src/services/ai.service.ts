import { ChatRole } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/error.js';
import { getRoadmapForUser, getSkillGapForUser } from './skill-gap.service.js';

interface MentorContext {
  studentName: string;
  headline: string | null;
  targetRole: string;
  currentSkills: string[];
  missingSkills: string[];
  belowLevelSkills: string[];
  completedNodes: number;
  totalNodes: number;
}

export function createFallbackMentorAnswer(context: MentorContext, question: string) {
  const missing = context.missingSkills.slice(0, 3).join(', ') || 'no critical missing skill recorded';
  const below = context.belowLevelSkills.slice(0, 3).join(', ') || 'no below-level skill recorded';
  const progress = `${context.completedNodes}/${context.totalNodes} roadmap nodes completed`;

  return [
    `For ${context.targetRole}, focus on the highest-impact gaps first: ${missing}.`,
    `Your below-level skills are ${below}, so turn one of them into a small portfolio project this week.`,
    `Current roadmap progress is ${progress}.`,
    `Question noted: "${question}". A practical next step is to pick one missing skill, complete one resource, and document the result in your GitHub portfolio.`
  ].join(' ');
}

function buildPrompt(context: MentorContext, question: string) {
  return `You are a concise career mentor for a software engineering student.
Student: ${context.studentName}
Headline: ${context.headline ?? 'Not provided'}
Target role: ${context.targetRole}
Current skills: ${context.currentSkills.join(', ') || 'None listed'}
Missing skills: ${context.missingSkills.join(', ') || 'None'}
Below-level skills: ${context.belowLevelSkills.join(', ') || 'None'}
Roadmap progress: ${context.completedNodes}/${context.totalNodes} completed

Answer the student's question with direct, actionable advice and reference the profile context.
Question: ${question}`;
}

async function callOpenAI(prompt: string) {
  if (!env.OPENAI_API_KEY) return null;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: prompt
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { output_text?: string };
  return data.output_text?.trim() || null;
}

async function callGemini(prompt: string) {
  if (!env.GEMINI_API_KEY) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join('\n').trim() || null;
}

async function buildMentorContext(userId: string): Promise<MentorContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: { include: { targetRole: true } },
      studentSkills: { include: { skill: true } }
    }
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  const gap = await getSkillGapForUser(userId);
  const roadmap = await getRoadmapForUser(userId);

  return {
    studentName: user.name,
    headline: user.profile?.headline ?? null,
    targetRole: user.profile?.targetRole?.title ?? 'Not selected',
    currentSkills: user.studentSkills.map((studentSkill) => `${studentSkill.skill.name} (${studentSkill.level})`),
    missingSkills: gap.missingSkills.map((skill) => skill.name),
    belowLevelSkills: gap.belowLevelSkills.map((skill) => skill.name),
    completedNodes: roadmap.progressSummary.COMPLETED,
    totalNodes: roadmap.nodes.length
  };
}

async function generateMentorAnswer(context: MentorContext, question: string) {
  const prompt = buildPrompt(context, question);

  if (env.AI_PROVIDER === 'openai') {
    return (await callOpenAI(prompt)) ?? createFallbackMentorAnswer(context, question);
  }

  if (env.AI_PROVIDER === 'gemini') {
    return (await callGemini(prompt)) ?? createFallbackMentorAnswer(context, question);
  }

  return createFallbackMentorAnswer(context, question);
}

export function createReadmeFallbackSummary(repoName: string, description: string | null, readme: string | null) {
  const source = `${description ?? ''}\n${readme ?? ''}`.trim();
  const techMatches = source.match(/\b(React|TypeScript|JavaScript|Node\.js|Express|PostgreSQL|Prisma|Docker|AWS|Java|Spring Boot|Python|SQL|Tailwind|Vite)\b/gi);
  const uniqueTech = [...new Set((techMatches ?? []).map((tech) => tech.trim()))].slice(0, 6);
  const firstUsefulLine =
    readme
      ?.split('\n')
      .map((line) => line.replace(/^#+\s*/, '').trim())
      .find((line) => line.length > 24 && !line.startsWith('![')) ?? description;

  return [
    firstUsefulLine ? `Objective: ${firstUsefulLine.slice(0, 180)}` : `Objective: Public repository ${repoName}.`,
    `Tech stack signals: ${uniqueTech.length > 0 ? uniqueTech.join(', ') : 'Not explicit in README'}.`
  ].join(' ');
}

export async function summarizeProjectReadme(repoName: string, description: string | null, readme: string | null) {
  const fallback = createReadmeFallbackSummary(repoName, description, readme);
  if (!readme || env.AI_PROVIDER === 'fallback') {
    return fallback;
  }

  const prompt = `Summarize this GitHub project for a student e-portfolio in two short sentences.
Repository: ${repoName}
Description: ${description ?? 'None'}
README:
${readme.slice(0, 6000)}`;

  if (env.AI_PROVIDER === 'openai') {
    return (await callOpenAI(prompt)) ?? fallback;
  }

  if (env.AI_PROVIDER === 'gemini') {
    return (await callGemini(prompt)) ?? fallback;
  }

  return fallback;
}

export async function getMentorHistory(userId: string) {
  return prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 40
  });
}

export async function askMentor(userId: string, question: string) {
  const context = await buildMentorContext(userId);

  await prisma.chatMessage.create({
    data: { userId, role: ChatRole.USER, content: question }
  });

  const answer = await generateMentorAnswer(context, question);
  const assistantMessage = await prisma.chatMessage.create({
    data: { userId, role: ChatRole.ASSISTANT, content: answer }
  });

  return {
    answer: assistantMessage,
    history: await getMentorHistory(userId)
  };
}
