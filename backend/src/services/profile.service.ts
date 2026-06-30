import { Prisma, SkillLevel } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/error.js';

export interface ProfileUpdateInput {
  headline?: string | null;
  location?: string | null;
  university?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  gpa?: number | null;
  careerInterests?: string[];
  courses?: Array<{ code: string; name: string; grade?: string }>;
  transcriptName?: string | null;
  targetRoleId?: string | null;
  currentSkills?: Array<{ skillId: string; level: SkillLevel }>;
}

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      profile: { include: { targetRole: true } },
      studentSkills: {
        include: { skill: true },
        orderBy: { skill: { name: 'asc' } }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  return user;
}

export async function updateMyProfile(userId: string, input: ProfileUpdateInput) {
  if (input.targetRoleId) {
    const role = await prisma.careerRole.findUnique({ where: { id: input.targetRoleId } });
    if (!role) {
      throw new ApiError(422, 'INVALID_TARGET_ROLE', 'Selected target role does not exist.');
    }
  }

  if (input.currentSkills) {
    const skillIds = input.currentSkills.map((skill) => skill.skillId);
    const skills = await prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true } });
    if (skills.length !== new Set(skillIds).size) {
      throw new ApiError(422, 'INVALID_SKILL_SELECTION', 'One or more selected skills do not exist.');
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.studentProfile.upsert({
      where: { userId },
      update: {
        headline: input.headline,
        location: input.location,
        university: input.university,
        major: input.major,
        graduationYear: input.graduationYear,
        gpa: input.gpa,
        careerInterests: input.careerInterests as Prisma.InputJsonValue | undefined,
        courses: input.courses as Prisma.InputJsonValue | undefined,
        transcriptName: input.transcriptName,
        targetRoleId: input.targetRoleId
      },
      create: {
        userId,
        headline: input.headline,
        location: input.location,
        university: input.university,
        major: input.major,
        graduationYear: input.graduationYear,
        gpa: input.gpa,
        careerInterests: (input.careerInterests ?? []) as Prisma.InputJsonValue,
        courses: (input.courses ?? []) as Prisma.InputJsonValue,
        transcriptName: input.transcriptName,
        targetRoleId: input.targetRoleId
      }
    });

    if (input.currentSkills) {
      const skillIds = input.currentSkills.map((skill) => skill.skillId);
      await tx.studentSkill.deleteMany({
        where: {
          userId,
          skillId: { notIn: skillIds }
        }
      });

      for (const skill of input.currentSkills) {
        await tx.studentSkill.upsert({
          where: { userId_skillId: { userId, skillId: skill.skillId } },
          update: { level: skill.level },
          create: { userId, skillId: skill.skillId, level: skill.level }
        });
      }
    }
  });

  return getMyProfile(userId);
}
