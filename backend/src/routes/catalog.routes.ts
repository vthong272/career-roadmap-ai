import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';

export const catalogRouter = Router();

catalogRouter.get(
  '/skills',
  asyncHandler(async (_req, res) => {
    const skills = await prisma.skill.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    res.json({ skills });
  })
);

catalogRouter.get(
  '/career-roles',
  asyncHandler(async (_req, res) => {
    const roles = await prisma.careerRole.findMany({
      include: {
        requirements: { include: { skill: true }, orderBy: { weight: 'desc' } }
      },
      orderBy: { title: 'asc' }
    });
    res.json({ roles });
  })
);

catalogRouter.get(
  '/career-roles/:slug',
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);
    const role = await prisma.careerRole.findUnique({
      where: { slug },
      include: {
        requirements: { include: { skill: true }, orderBy: { weight: 'desc' } },
        learningNodes: {
          include: { resources: true, skill: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    res.json({ role });
  })
);
