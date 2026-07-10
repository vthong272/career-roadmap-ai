import { ChatRole, type SkillLevel } from '@prisma/client';
import { env } from '../config/env.js';
import {
  buildLearningPlanPrompt,
  buildMentorPrompt,
  createFallbackLearningPlan,
  createFallbackMentorAnswer,
  createReadmeFallbackSummary,
  parseLearningPlan,
  type MentorContext
} from '../features/mentor/mentor-domain.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/error.js';
import { getRoadmapForUser, getSkillGapForUser } from './skill-gap.service.js';

export {
  createFallbackLearningPlan,
  createFallbackMentorAnswer,
  createReadmeFallbackSummary
} from '../features/mentor/mentor-domain.js';
export type { LearningPlan, LearningPlanItem, MentorContext } from '../features/mentor/mentor-domain.js';

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

  if (!response.ok) return null;

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

  if (!response.ok) return null;

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join('\n').trim() || null;
}

async function callConfiguredModel(prompt: string) {
  if (env.AI_PROVIDER === 'openai') return callOpenAI(prompt);
  if (env.AI_PROVIDER === 'gemini') return callGemini(prompt);
  return null;
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
    totalNodes: roadmap.nodes.length,
    roadmapNodes: roadmap.nodes.map((node) => ({
      title: node.title,
      status: node.status,
      priority: node.priority,
      estimatedHours: node.estimatedHours
    })),
    gpa: user.profile?.gpa ?? null,
    major: user.profile?.major ?? null,
    careerInterests: (user.profile?.careerInterests as string[] | undefined) ?? []
  };
}

async function generateMentorAnswer(context: MentorContext, question: string) {
  return (await callConfiguredModel(buildMentorPrompt(context, question))) ?? createFallbackMentorAnswer(context, question);
}

export async function generateLearningPlan(userId: string, horizonDays: 7 | 30) {
  const context = await buildMentorContext(userId);
  const fallback = createFallbackLearningPlan(context, horizonDays);
  const modelPlan = await callConfiguredModel(buildLearningPlanPrompt(context, horizonDays));
  return parseLearningPlan(modelPlan, fallback);
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

  return (await callConfiguredModel(prompt)) ?? fallback;
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
