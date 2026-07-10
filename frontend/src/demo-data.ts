import type {
  AdminSummary,
  CareerRole,
  ChatMessage,
  GitHubPortfolio,
  JobPost,
  LearningPlan,
  MarketPulse,
  ProfileResponse,
  RoadmapResponse,
  RoadmapStatus,
  Skill,
  SkillGapAnalysis,
  SkillGapItem,
  SkillLevel,
  User,
} from './types'

const DEMO_STATE_KEY = 'career-roadmap-ai-demo-state'

const skills: Skill[] = [
  { id: 'skill-js', name: 'JavaScript', category: 'Programming', description: 'Core browser and server-side JavaScript fundamentals.' },
  { id: 'skill-ts', name: 'TypeScript', category: 'Programming', description: 'Typed JavaScript for scalable frontend and backend systems.' },
  { id: 'skill-node', name: 'Node.js', category: 'Backend', description: 'Runtime fundamentals for building backend services.' },
  { id: 'skill-express', name: 'Express', category: 'Backend', description: 'REST API design and middleware-based Node.js services.' },
  { id: 'skill-postgres', name: 'PostgreSQL', category: 'Database', description: 'Relational modeling, SQL querying, indexing, and transactions.' },
  { id: 'skill-prisma', name: 'Prisma', category: 'Database', description: 'Type-safe ORM usage, migrations, and application data access.' },
  { id: 'skill-docker', name: 'Docker', category: 'DevOps', description: 'Containerized local development and service packaging.' },
  { id: 'skill-testing', name: 'Testing', category: 'Quality', description: 'Unit, integration, and end-to-end testing discipline.' },
  { id: 'skill-github', name: 'Git/GitHub', category: 'Professional', description: 'Source control, collaboration, and portfolio workflows.' },
]

const role: CareerRole = {
  id: 'role-backend',
  slug: 'backend-developer',
  title: 'Backend Developer',
  summary: 'Designs secure APIs, data models, integrations, and service workflows.',
  demandLevel: 'High',
  requirements: [
    { id: 'req-node', priority: 'HIGH', requiredLevel: 'INTERMEDIATE', weight: 5, skill: skills[2] },
    { id: 'req-express', priority: 'HIGH', requiredLevel: 'INTERMEDIATE', weight: 4, skill: skills[3] },
    { id: 'req-postgres', priority: 'HIGH', requiredLevel: 'INTERMEDIATE', weight: 5, skill: skills[4] },
    { id: 'req-prisma', priority: 'MEDIUM', requiredLevel: 'BEGINNER', weight: 3, skill: skills[5] },
    { id: 'req-docker', priority: 'MEDIUM', requiredLevel: 'BEGINNER', weight: 2, skill: skills[6] },
    { id: 'req-testing', priority: 'HIGH', requiredLevel: 'INTERMEDIATE', weight: 4, skill: skills[7] },
    { id: 'req-github', priority: 'MEDIUM', requiredLevel: 'INTERMEDIATE', weight: 3, skill: skills[8] },
  ],
}

const studentUser: User = {
  id: 'demo-student',
  email: 'student@example.com',
  name: 'Minh Nguyen',
  role: 'STUDENT',
  avatarUrl: null,
}

const counselorUser: User = {
  id: 'demo-counselor',
  email: 'counselor@example.com',
  name: 'Counselor Admin',
  role: 'COUNSELOR_ADMIN',
  avatarUrl: null,
}

interface DemoState {
  profile: ProfileResponse
  roadmapStatuses: Record<string, RoadmapStatus>
  history: ChatMessage[]
  portfolio: GitHubPortfolio | null
}

function defaultProfile(user = studentUser): ProfileResponse {
  return {
    ...user,
    profile: {
      id: 'demo-profile',
      headline: 'Software engineering student interested in backend systems',
      location: 'Ho Chi Minh City',
      university: 'FPT University',
      major: 'Software Engineering',
      graduationYear: 2027,
      gpa: 3.35,
      careerInterests: ['Backend Developer', 'Cloud APIs', 'Database Design'],
      courses: [
        { code: 'PRN212', name: '.NET and backend fundamentals', grade: 'B+' },
        { code: 'SWP391', name: 'Software development project', grade: 'A' },
      ],
      transcriptName: 'manual-entry',
      targetRoleId: role.id,
      targetRole: role,
    },
    studentSkills: [
      { id: 'ss-js', skillId: 'skill-js', level: 'INTERMEDIATE', skill: skills[0] },
      { id: 'ss-ts', skillId: 'skill-ts', level: 'BEGINNER', skill: skills[1] },
      { id: 'ss-node', skillId: 'skill-node', level: 'BEGINNER', skill: skills[2] },
      { id: 'ss-postgres', skillId: 'skill-postgres', level: 'BEGINNER', skill: skills[4] },
      { id: 'ss-github', skillId: 'skill-github', level: 'INTERMEDIATE', skill: skills[8] },
    ],
  }
}

function readState(): DemoState {
  const raw = localStorage.getItem(DEMO_STATE_KEY)
  if (raw) return JSON.parse(raw) as DemoState
  const state: DemoState = { profile: defaultProfile(), roadmapStatuses: {}, history: [], portfolio: null }
  writeState(state)
  return state
}

function writeState(state: DemoState) {
  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state))
}

export function getDemoUser(token: string): User | null {
  if (token === 'demo:counselor') return counselorUser
  if (token.startsWith('demo:student')) return readState().profile
  return null
}

export function setDemoStudentUser(user: User) {
  const state = readState()
  state.profile = defaultProfile(user)
  writeState(state)
}

export function demoUserForCredentials(email: string, password: string): User | null {
  if (email.toLowerCase() === studentUser.email && password === 'Student@123') return studentUser
  if (email.toLowerCase() === counselorUser.email && password === 'Counselor@123') return counselorUser
  return null
}

function levelScore(level: SkillLevel | null) {
  if (level === 'ADVANCED') return 3
  if (level === 'INTERMEDIATE') return 2
  if (level === 'BEGINNER') return 1
  return 0
}

function gapAnalysis(state: DemoState): SkillGapAnalysis {
  const levels = new Map(state.profile.studentSkills.map((studentSkill) => [studentSkill.skillId, studentSkill.level]))
  const items: SkillGapItem[] = role.requirements.map((requirement) => {
    const currentLevel = levels.get(requirement.skill.id) ?? null
    const status =
      !currentLevel ? 'MISSING' : levelScore(currentLevel) >= levelScore(requirement.requiredLevel) ? 'MATCHED' : 'BELOW_LEVEL'
    return {
      skillId: requirement.skill.id,
      name: requirement.skill.name,
      category: requirement.skill.category,
      priority: requirement.priority,
      requiredLevel: requirement.requiredLevel,
      currentLevel,
      weight: requirement.weight,
      status,
    }
  })
  const maxScore = items.reduce((total, item) => total + item.weight * levelScore(item.requiredLevel), 0)
  const currentScore = items.reduce((total, item) => total + item.weight * Math.min(levelScore(item.currentLevel), levelScore(item.requiredLevel)), 0)
  return {
    role,
    readinessScore: Math.round((currentScore / maxScore) * 100),
    matchedSkills: items.filter((item) => item.status === 'MATCHED'),
    belowLevelSkills: items.filter((item) => item.status === 'BELOW_LEVEL'),
    missingSkills: items.filter((item) => item.status === 'MISSING'),
    items,
  }
}

function roadmap(state: DemoState): RoadmapResponse {
  const nodes = [
    ['node-api', 'REST API foundations', 'Build validated endpoints, middleware, error handling, and pagination.', 'skill-express', 18, 'HIGH'],
    ['node-data', 'Relational data modeling', 'Model entities, constraints, indexes, and transactional workflows.', 'skill-postgres', 20, 'HIGH'],
    ['node-prod', 'Production service workflow', 'Containerize services and prepare repeatable local and deployment commands.', 'skill-docker', 14, 'MEDIUM'],
  ] as const
  const mapped = nodes.map(([id, title, description, skillId, hours, priority], index) => ({
    id,
    title,
    description,
    priority,
    estimatedHours: hours,
    sortOrder: index + 1,
    parentId: null,
    status: state.roadmapStatuses[id] ?? 'NOT_STARTED',
    skill: skills.find((skill) => skill.id === skillId) ?? null,
    resources: [
      { id: `${id}-docs`, title: `${title} documentation path`, url: 'https://developer.mozilla.org/', type: 'DOCUMENTATION' as const },
      { id: `${id}-project`, title: `${title} portfolio practice`, url: 'https://github.com/', type: 'PROJECT' as const },
    ],
  }))
  return {
    role,
    nodes: mapped,
    progressSummary: {
      NOT_STARTED: mapped.filter((node) => node.status === 'NOT_STARTED').length,
      IN_PROGRESS: mapped.filter((node) => node.status === 'IN_PROGRESS').length,
      COMPLETED: mapped.filter((node) => node.status === 'COMPLETED').length,
    },
  }
}

function demoPortfolio(username: string): GitHubPortfolio {
  return {
    id: 'demo-portfolio',
    username,
    displayName: username === 'octocat' ? 'The Octocat' : username,
    bio: 'Public GitHub evidence synced for the career roadmap demo.',
    avatarUrl: null,
    htmlUrl: `https://github.com/${username}`,
    syncedAt: new Date().toISOString(),
    repos: [
      {
        id: 'repo-api',
        name: 'career-roadmap-api',
        description: 'Role-based roadmap backend with profile, gap, and mentor modules.',
        language: 'TypeScript',
        stars: 12,
        url: `https://github.com/${username}/career-roadmap-api`,
        readmeSummary: 'Shows REST API design, Prisma models, authentication, and tested service logic.',
      },
      {
        id: 'repo-portfolio',
        name: 'student-portfolio',
        description: 'Portfolio site that presents roadmap progress and project evidence.',
        language: 'React',
        stars: 8,
        url: `https://github.com/${username}/student-portfolio`,
        readmeSummary: 'Connects learning nodes with deployable frontend artifacts and recruiter-ready summaries.',
      },
    ],
  }
}

function demoMarketPulse(): MarketPulse {
  const posts: JobPost[] = [
    {
      id: 'demo-job-topcv-backend',
      externalId: 'demo:topcv:backend-nodejs',
      title: 'Backend Node.js Developer',
      company: 'TopCV aggregated listing',
      location: 'Ho Chi Minh City',
      source: 'TopCV',
      salary: 'Up to 35M VND',
      skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'TypeScript', 'Testing', 'CI/CD'],
      url: 'https://www.topcv.vn/viec-lam-it-phan-mem-c10026',
      description: 'Node.js Express PostgreSQL Docker REST API TypeScript Testing CI/CD',
      postedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    },
    {
      id: 'demo-job-careerviet-api',
      externalId: 'demo:careerviet:api-developer',
      title: 'API Developer',
      company: 'CareerViet aggregated listing',
      location: 'Hybrid - Vietnam',
      source: 'CareerViet',
      salary: 'Negotiable',
      skills: ['Node.js', 'PostgreSQL', 'Prisma', 'AWS', 'Testing'],
      url: 'https://careerviet.vn/',
      description: 'Build backend services with Node.js PostgreSQL Prisma AWS and automated testing.',
      postedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    },
    {
      id: 'demo-job-vnw-backend',
      externalId: 'demo:vietnamworks:junior-backend',
      title: 'Junior Backend Engineer',
      company: 'VietnamWorks aggregated listing',
      location: 'Da Nang',
      source: 'VietnamWorks',
      salary: '18M - 28M VND',
      skills: ['TypeScript', 'Node.js', 'SQL', 'Docker'],
      url: 'https://www.vietnamworks.com/en',
      description: 'TypeScript Node.js SQL Docker Git/GitHub backend engineer role.',
      postedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    },
  ]

  return {
    posts,
    sources: ['TopCV', 'CareerViet', 'VietnamWorks'],
    keywords: [
      { keyword: 'Node.js', mentions: 6, jobCount: 3 },
      { keyword: 'PostgreSQL', mentions: 4, jobCount: 2 },
      { keyword: 'Docker', mentions: 3, jobCount: 2 },
      { keyword: 'Testing', mentions: 3, jobCount: 2 },
      { keyword: 'TypeScript', mentions: 2, jobCount: 2 },
    ],
    roleTrends: [
      { skill: 'Node.js', mentions: 6, jobCount: 3, coverage: 100 },
      { skill: 'PostgreSQL', mentions: 4, jobCount: 2, coverage: 67 },
      { skill: 'Docker', mentions: 3, jobCount: 2, coverage: 67 },
      { skill: 'Testing', mentions: 3, jobCount: 2, coverage: 67 },
    ],
    suggestions: [
      {
        skill: 'PostgreSQL',
        priority: 'HIGH',
        reason: 'Appears in 2 live job posts for the target role and is not in the student profile.',
        suggestedNode: 'Build a market-aligned PostgreSQL portfolio task',
      },
      {
        skill: 'Node.js',
        priority: 'MEDIUM',
        reason: 'Appears in 3 live job posts and current level is BEGINNER.',
        suggestedNode: 'Upgrade Node.js from beginner to role-ready evidence',
      },
    ],
  }
}

function demoLearningPlan(days: 7 | 30): LearningPlan {
  if (days === 7) {
    return {
      horizonDays: 7,
      focus: 'Close the backend readiness gap by turning one roadmap node into GitHub evidence.',
      items: [
        {
          dayRange: 'Day 1-2',
          title: 'Start REST API foundations',
          tasks: ['Review Express validation and error handling.', 'Write the API endpoints you will demonstrate.'],
          evidence: 'Create a GitHub issue or README checklist.',
        },
        {
          dayRange: 'Day 3-4',
          title: 'Build a PostgreSQL-backed endpoint',
          tasks: ['Model one relational workflow.', 'Add Prisma query and validation.'],
          evidence: 'Commit the feature with setup instructions.',
        },
        {
          dayRange: 'Day 5-6',
          title: 'Add tests and Docker notes',
          tasks: ['Cover one success and one error path.', 'Document local service startup.'],
          evidence: 'Push tests and a README demo section.',
        },
        {
          dayRange: 'Day 7',
          title: 'Portfolio polish',
          tasks: ['Ask mentor for review questions.', 'Summarize role relevance.'],
          evidence: 'Publish screenshots or API examples in portfolio.',
        },
      ],
    }
  }

  return {
    horizonDays: 30,
    focus: 'Build backend role evidence across APIs, data modeling, testing, and deployment readiness.',
    items: [
      {
        dayRange: 'Day 1-5',
        title: 'Baseline skill gaps',
        tasks: ['Review profile skills.', 'Pick one backend portfolio outcome.', 'Collect roadmap resources.'],
        evidence: 'Create a public GitHub project plan.',
      },
      {
        dayRange: 'Day 6-12',
        title: 'Complete REST API foundations',
        tasks: ['Build validated routes.', 'Add consistent error handling.', 'Document request examples.'],
        evidence: 'Commit a working API slice.',
      },
      {
        dayRange: 'Day 13-19',
        title: 'Apply relational data modeling',
        tasks: ['Design entities and constraints.', 'Use Prisma queries.', 'Add seed data.'],
        evidence: 'Add schema notes and sample data.',
      },
      {
        dayRange: 'Day 20-26',
        title: 'Testing and market alignment',
        tasks: ['Add service tests.', 'Map project skills to job posts.', 'Prepare interview explanations.'],
        evidence: 'Write a project retrospective.',
      },
      {
        dayRange: 'Day 27-30',
        title: 'Ship portfolio proof',
        tasks: ['Polish README.', 'Capture screenshots.', 'Update roadmap progress.'],
        evidence: 'Publish final portfolio link.',
      },
    ],
  }
}

export async function demoRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const state = readState()
  const body = options.body ? JSON.parse(String(options.body)) : {}

  if (path === '/profile/me' && options.method === 'PATCH') {
    const profile = {
      ...state.profile.profile!,
      ...body,
      targetRole: role,
      targetRoleId: body.targetRoleId || role.id,
    }
    state.profile = {
      ...state.profile,
      profile,
      studentSkills: (body.currentSkills ?? []).map((studentSkill: { skillId: string; level: SkillLevel }) => ({
        id: `ss-${studentSkill.skillId}`,
        skillId: studentSkill.skillId,
        level: studentSkill.level,
        skill: skills.find((skill) => skill.id === studentSkill.skillId)!,
      })),
    }
    writeState(state)
    return { profile: state.profile } as T
  }

  if (path === '/profile/me') return { profile: state.profile } as T
  if (path === '/skills') return { skills } as T
  if (path === '/career-roles') return { roles: [role] } as T
  if (path === '/gap-analysis/me') return { analysis: gapAnalysis(state) } as T
  if (path === '/roadmap/me') return { roadmap: roadmap(state) } as T
  if (path.startsWith('/roadmap/nodes/') && options.method === 'PATCH') {
    const nodeId = path.split('/')[3]
    state.roadmapStatuses[nodeId] = body.status
    writeState(state)
    return { roadmap: roadmap(state) } as T
  }
  if (path === '/mentor/history') return { history: state.history } as T
  if (path === '/mentor/chat') {
    state.history = [
      ...state.history,
      { id: `msg-${Date.now()}-u`, role: 'USER', content: body.message, createdAt: new Date().toISOString() },
      {
        id: `msg-${Date.now()}-a`,
        role: 'ASSISTANT',
        content: 'Focus this week on Express validation, PostgreSQL modeling, and one portfolio commit that proves the roadmap node.',
        createdAt: new Date().toISOString(),
      },
    ]
    writeState(state)
    return { history: state.history } as T
  }
  if (path === '/mentor/plan') return { plan: demoLearningPlan(body.days === 30 ? 30 : 7) } as T
  if (path === '/portfolio/me') return { portfolio: state.portfolio } as T
  if (path === '/portfolio/sync') {
    state.portfolio = demoPortfolio(body.username || 'octocat')
    writeState(state)
    return { portfolio: state.portfolio } as T
  }
  if (path === '/market/trends') return { market: demoMarketPulse() } as T
  if (path === '/market/sync') return { imported: 3, market: demoMarketPulse() } as T
  if (path === '/admin/summary') {
    const road = roadmap(state)
    return {
      summary: {
        metrics: { studentCount: 1, roleCount: 1, skillCount: skills.length, resourceCount: road.nodes.length * 2 },
        students: [
          {
            id: state.profile.id,
            name: state.profile.name,
            email: state.profile.email,
            targetRole: role.title,
            completedNodes: road.progressSummary.COMPLETED,
            inProgressNodes: road.progressSummary.IN_PROGRESS,
          },
        ],
      } satisfies AdminSummary,
    } as T
  }
  if (path === '/admin/management-data') return { roles: [{ ...role, learningNodes: roadmap(state).nodes }], skills } as T

  return {} as T
}
