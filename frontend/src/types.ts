export type UserRole = 'STUDENT' | 'COUNSELOR_ADMIN'
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
export type RoadmapStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl: string | null
}

export interface Skill {
  id: string
  name: string
  category: string
  description: string
}

export interface RoleRequirement {
  id: string
  priority: Priority
  requiredLevel: SkillLevel
  weight: number
  skill: Skill
}

export interface CareerRole {
  id: string
  slug: string
  title: string
  summary: string
  demandLevel: string
  requirements: RoleRequirement[]
}

export interface StudentSkill {
  id: string
  skillId: string
  level: SkillLevel
  skill: Skill
}

export interface StudentProfileRecord {
  id: string
  headline: string | null
  location: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  gpa: number | null
  careerInterests: string[]
  courses: Array<{ code: string; name: string; grade?: string }>
  transcriptName: string | null
  targetRoleId: string | null
  targetRole: CareerRole | null
}

export interface ProfileResponse {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl: string | null
  profile: StudentProfileRecord | null
  studentSkills: StudentSkill[]
}

export interface SkillGapItem {
  skillId: string
  name: string
  category: string
  priority: Priority
  requiredLevel: SkillLevel
  currentLevel: SkillLevel | null
  weight: number
  status: 'MATCHED' | 'BELOW_LEVEL' | 'MISSING'
}

export interface SkillGapAnalysis {
  role: CareerRole
  readinessScore: number
  matchedSkills: SkillGapItem[]
  belowLevelSkills: SkillGapItem[]
  missingSkills: SkillGapItem[]
  items: SkillGapItem[]
}

export interface LearningResource {
  id: string
  title: string
  url: string
  type: 'COURSE' | 'DOCUMENTATION' | 'VIDEO' | 'ARTICLE' | 'PROJECT'
}

export interface RoadmapNode {
  id: string
  title: string
  description: string
  priority: Priority
  estimatedHours: number
  sortOrder: number
  parentId: string | null
  status: RoadmapStatus
  skill: Skill | null
  resources: LearningResource[]
}

export interface RoadmapResponse {
  role: CareerRole
  nodes: RoadmapNode[]
  progressSummary: Record<RoadmapStatus, number>
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}
