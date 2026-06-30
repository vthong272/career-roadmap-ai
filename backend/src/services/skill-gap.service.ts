import { RoadmapStatus, SkillLevel } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/error.js';

export interface RequirementInput {
  skillId: string;
  name: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredLevel: SkillLevel;
  weight: number;
}

export interface StudentSkillInput {
  skillId: string;
  level: SkillLevel;
}

export interface SkillGapItem {
  skillId: string;
  name: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredLevel: SkillLevel;
  currentLevel: SkillLevel | null;
  weight: number;
  status: 'MATCHED' | 'BELOW_LEVEL' | 'MISSING';
}

const levelRank: Record<SkillLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3
};

export function calculateSkillGap(requirements: RequirementInput[], studentSkills: StudentSkillInput[]) {
  const studentSkillMap = new Map(studentSkills.map((skill) => [skill.skillId, skill.level]));
  const items: SkillGapItem[] = requirements.map((requirement) => {
    const currentLevel = studentSkillMap.get(requirement.skillId) ?? null;
    const status =
      currentLevel === null
        ? 'MISSING'
        : levelRank[currentLevel] >= levelRank[requirement.requiredLevel]
          ? 'MATCHED'
          : 'BELOW_LEVEL';

    return {
      ...requirement,
      currentLevel,
      status
    };
  });

  const totalWeight = requirements.reduce((sum, requirement) => sum + requirement.weight, 0) || 1;
  const earnedWeight = items.reduce((sum, item) => {
    if (item.status === 'MATCHED') return sum + item.weight;
    if (item.status === 'BELOW_LEVEL') return sum + item.weight * 0.45;
    return sum;
  }, 0);

  return {
    readinessScore: Math.round((earnedWeight / totalWeight) * 100),
    matchedSkills: items.filter((item) => item.status === 'MATCHED'),
    belowLevelSkills: items.filter((item) => item.status === 'BELOW_LEVEL'),
    missingSkills: items.filter((item) => item.status === 'MISSING'),
    items: items.sort((a, b) => b.weight - a.weight)
  };
}

export async function getSkillGapForUser(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      targetRole: {
        include: {
          requirements: {
            include: { skill: true },
            orderBy: { weight: 'desc' }
          }
        }
      }
    }
  });

  if (!profile?.targetRole) {
    throw new ApiError(422, 'TARGET_ROLE_REQUIRED', 'Select a target career role before running gap analysis.');
  }

  const studentSkills = await prisma.studentSkill.findMany({
    where: { userId },
    select: { skillId: true, level: true }
  });

  const analysis = calculateSkillGap(
    profile.targetRole.requirements.map((requirement) => ({
      skillId: requirement.skillId,
      name: requirement.skill.name,
      category: requirement.skill.category,
      priority: requirement.priority,
      requiredLevel: requirement.requiredLevel,
      weight: requirement.weight
    })),
    studentSkills
  );

  return {
    role: profile.targetRole,
    ...analysis
  };
}

export async function getRoadmapForUser(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { targetRole: true }
  });

  if (!profile?.targetRoleId || !profile.targetRole) {
    throw new ApiError(422, 'TARGET_ROLE_REQUIRED', 'Select a target career role before opening the roadmap.');
  }

  const nodes = await prisma.learningNode.findMany({
    where: { roleId: profile.targetRoleId },
    include: {
      resources: true,
      skill: true,
      progress: { where: { userId } }
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });

  const roadmapNodes = nodes.map((node) => ({
    id: node.id,
    title: node.title,
    description: node.description,
    priority: node.priority,
    estimatedHours: node.estimatedHours,
    sortOrder: node.sortOrder,
    parentId: node.parentId,
    skill: node.skill,
    resources: node.resources,
    status: node.progress[0]?.status ?? RoadmapStatus.NOT_STARTED
  }));

  const progressSummary = roadmapNodes.reduce(
    (summary, node) => {
      summary[node.status] += 1;
      return summary;
    },
    { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 } as Record<RoadmapStatus, number>
  );

  return {
    role: profile.targetRole,
    nodes: roadmapNodes,
    progressSummary
  };
}

export async function updateRoadmapProgress(userId: string, nodeId: string, status: RoadmapStatus) {
  const node = await prisma.learningNode.findUnique({ where: { id: nodeId } });
  if (!node) {
    throw new ApiError(404, 'ROADMAP_NODE_NOT_FOUND', 'Roadmap node was not found.');
  }

  await prisma.roadmapProgress.upsert({
    where: { userId_nodeId: { userId, nodeId } },
    update: { status },
    create: { userId, nodeId, status }
  });

  return getRoadmapForUser(userId);
}
