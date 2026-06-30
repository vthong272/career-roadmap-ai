import { Priority, ResourceType } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

const RoleSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(120),
  summary: z.string().min(10).max(500),
  demandLevel: z.string().min(2).max(80)
});

const SkillSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(80),
  description: z.string().min(10).max(500)
});

const NodeSchema = z.object({
  roleId: z.string(),
  skillId: z.string().nullable().optional(),
  title: z.string().min(2).max(160),
  description: z.string().min(10).max(600),
  priority: z.nativeEnum(Priority),
  estimatedHours: z.number().int().min(1).max(500),
  sortOrder: z.number().int().min(1).max(999)
});

const ResourceSchema = z.object({
  nodeId: z.string(),
  title: z.string().min(2).max(160),
  url: z.string().url(),
  type: z.nativeEnum(ResourceType)
});

adminRouter.get(
  '/admin/summary',
  asyncHandler(async (_req, res) => {
    const [studentCount, roleCount, skillCount, resourceCount, students] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.careerRole.count(),
      prisma.skill.count(),
      prisma.learningResource.count(),
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { targetRole: { select: { title: true } } } },
          roadmapProgress: { select: { status: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    res.json({
      summary: {
        metrics: { studentCount, roleCount, skillCount, resourceCount },
        students: students.map((student) => ({
          id: student.id,
          name: student.name,
          email: student.email,
          targetRole: student.profile?.targetRole?.title ?? null,
          completedNodes: student.roadmapProgress.filter((progress) => progress.status === 'COMPLETED').length,
          inProgressNodes: student.roadmapProgress.filter((progress) => progress.status === 'IN_PROGRESS').length
        }))
      }
    });
  })
);

adminRouter.get(
  '/admin/management-data',
  asyncHandler(async (_req, res) => {
    const [roles, skills] = await Promise.all([
      prisma.careerRole.findMany({
        include: {
          learningNodes: { include: { resources: true, skill: true }, orderBy: { sortOrder: 'asc' } }
        },
        orderBy: { title: 'asc' }
      }),
      prisma.skill.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
    ]);

    res.json({ roles, skills });
  })
);

adminRouter.post(
  '/admin/career-roles',
  asyncHandler(async (req, res) => {
    const input = RoleSchema.parse(req.body);
    const role = await prisma.careerRole.create({ data: input });
    res.status(201).json({ role });
  })
);

adminRouter.patch(
  '/admin/career-roles/:id',
  asyncHandler(async (req, res) => {
    const input = RoleSchema.partial().parse(req.body);
    const role = await prisma.careerRole.update({ where: { id: String(req.params.id) }, data: input });
    res.json({ role });
  })
);

adminRouter.post(
  '/admin/skills',
  asyncHandler(async (req, res) => {
    const input = SkillSchema.parse(req.body);
    const skill = await prisma.skill.create({ data: input });
    res.status(201).json({ skill });
  })
);

adminRouter.patch(
  '/admin/skills/:id',
  asyncHandler(async (req, res) => {
    const input = SkillSchema.partial().parse(req.body);
    const skill = await prisma.skill.update({ where: { id: String(req.params.id) }, data: input });
    res.json({ skill });
  })
);

adminRouter.post(
  '/admin/learning-nodes',
  asyncHandler(async (req, res) => {
    const input = NodeSchema.parse(req.body);
    const node = await prisma.learningNode.create({ data: input });
    res.status(201).json({ node });
  })
);

adminRouter.patch(
  '/admin/learning-nodes/:id',
  asyncHandler(async (req, res) => {
    const input = NodeSchema.partial().parse(req.body);
    const node = await prisma.learningNode.update({ where: { id: String(req.params.id) }, data: input });
    res.json({ node });
  })
);

adminRouter.post(
  '/admin/learning-resources',
  asyncHandler(async (req, res) => {
    const input = ResourceSchema.parse(req.body);
    const resource = await prisma.learningResource.create({ data: input });
    res.status(201).json({ resource });
  })
);

adminRouter.patch(
  '/admin/learning-resources/:id',
  asyncHandler(async (req, res) => {
    const input = ResourceSchema.partial().parse(req.body);
    const resource = await prisma.learningResource.update({ where: { id: String(req.params.id) }, data: input });
    res.json({ resource });
  })
);
