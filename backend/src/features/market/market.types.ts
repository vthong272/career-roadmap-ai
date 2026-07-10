import type { SkillLevel } from '@prisma/client';

export interface JobPostInput {
  title: string;
  description: string;
  tags?: string[];
  skills?: string[];
}

export interface MarketJobPost extends JobPostInput {
  externalId?: string | null;
  company: string;
  location: string;
  source: string;
  salary?: string | null;
  url?: string | null;
  postedAt?: Date;
}

export interface RoleSkillTrend {
  skill: string;
  mentions: number;
  jobCount: number;
  coverage: number;
}

export interface MarketRoadmapSuggestion {
  skill: string;
  priority: 'HIGH' | 'MEDIUM';
  reason: string;
  suggestedNode: string;
}

export interface CurrentSkill {
  name: string;
  level: SkillLevel | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
