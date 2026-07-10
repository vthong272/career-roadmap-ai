import { PrismaClient, Priority, ResourceType, SkillLevel, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const skillCatalog = [
  ['JavaScript', 'Programming', 'Core browser and server-side JavaScript fundamentals.'],
  ['TypeScript', 'Programming', 'Typed JavaScript for scalable frontend and backend systems.'],
  ['React', 'Frontend', 'Component architecture, hooks, state management, and UI integration.'],
  ['HTML/CSS', 'Frontend', 'Semantic markup, responsive layout, and accessible styling.'],
  ['Node.js', 'Backend', 'Runtime fundamentals for building backend services.'],
  ['Express', 'Backend', 'REST API design and middleware-based Node.js services.'],
  ['PostgreSQL', 'Database', 'Relational modeling, SQL querying, indexing, and transactions.'],
  ['Prisma', 'Database', 'Type-safe ORM usage, migrations, and application data access.'],
  ['Docker', 'DevOps', 'Containerized local development and service packaging.'],
  ['AWS', 'Cloud', 'Cloud deployment fundamentals and managed infrastructure services.'],
  ['CI/CD', 'DevOps', 'Automated build, test, and deployment pipelines.'],
  ['Java', 'Backend', 'Object-oriented backend development with the Java ecosystem.'],
  ['Spring Boot', 'Backend', 'Enterprise REST API development with dependency injection.'],
  ['SQL', 'Database', 'Data retrieval, aggregation, joins, and query optimization.'],
  ['Testing', 'Quality', 'Unit, integration, and end-to-end testing discipline.'],
  ['Playwright', 'Quality', 'Browser automation for end-to-end test coverage.'],
  ['Git/GitHub', 'Professional', 'Source control, collaboration, repository hygiene, and portfolio workflows.'],
  ['React Native', 'Mobile', 'Cross-platform mobile application development.'],
  ['Python', 'Data', 'Data processing, scripting, and backend automation.'],
  ['Data Modeling', 'Data', 'Designing useful, reliable structures for analytical and transactional data.']
] as const;

const roles = [
  {
    slug: 'backend-developer',
    title: 'Backend Developer',
    summary: 'Designs secure APIs, data models, integrations, and service workflows.',
    demandLevel: 'High',
    requirements: [
      ['Node.js', 'HIGH', 'INTERMEDIATE', 5],
      ['Express', 'HIGH', 'INTERMEDIATE', 4],
      ['PostgreSQL', 'HIGH', 'INTERMEDIATE', 5],
      ['Prisma', 'MEDIUM', 'BEGINNER', 3],
      ['Docker', 'MEDIUM', 'BEGINNER', 2],
      ['Testing', 'HIGH', 'INTERMEDIATE', 4],
      ['Git/GitHub', 'MEDIUM', 'INTERMEDIATE', 3]
    ]
  },
  {
    slug: 'frontend-developer',
    title: 'Frontend Developer',
    summary: 'Builds accessible, responsive, and maintainable product interfaces.',
    demandLevel: 'High',
    requirements: [
      ['HTML/CSS', 'HIGH', 'INTERMEDIATE', 5],
      ['JavaScript', 'HIGH', 'INTERMEDIATE', 5],
      ['TypeScript', 'HIGH', 'INTERMEDIATE', 4],
      ['React', 'HIGH', 'INTERMEDIATE', 5],
      ['Testing', 'MEDIUM', 'BEGINNER', 3],
      ['Git/GitHub', 'MEDIUM', 'INTERMEDIATE', 3]
    ]
  },
  {
    slug: 'devops-engineer',
    title: 'DevOps Engineer',
    summary: 'Automates delivery, improves reliability, and manages cloud infrastructure.',
    demandLevel: 'Growing',
    requirements: [
      ['Docker', 'HIGH', 'INTERMEDIATE', 5],
      ['AWS', 'HIGH', 'BEGINNER', 4],
      ['CI/CD', 'HIGH', 'INTERMEDIATE', 5],
      ['Node.js', 'MEDIUM', 'BEGINNER', 2],
      ['SQL', 'MEDIUM', 'BEGINNER', 2],
      ['Git/GitHub', 'HIGH', 'INTERMEDIATE', 4]
    ]
  },
  {
    slug: 'data-engineer',
    title: 'Data Engineer',
    summary: 'Creates data pipelines, models, storage layers, and reliable analytics inputs.',
    demandLevel: 'Growing',
    requirements: [
      ['Python', 'HIGH', 'INTERMEDIATE', 5],
      ['SQL', 'HIGH', 'INTERMEDIATE', 5],
      ['PostgreSQL', 'HIGH', 'INTERMEDIATE', 4],
      ['Data Modeling', 'HIGH', 'INTERMEDIATE', 4],
      ['Docker', 'MEDIUM', 'BEGINNER', 2],
      ['AWS', 'MEDIUM', 'BEGINNER', 3]
    ]
  },
  {
    slug: 'mobile-developer',
    title: 'Mobile Developer',
    summary: 'Builds mobile experiences and integrates client apps with backend services.',
    demandLevel: 'Stable',
    requirements: [
      ['JavaScript', 'HIGH', 'INTERMEDIATE', 4],
      ['TypeScript', 'MEDIUM', 'BEGINNER', 3],
      ['React Native', 'HIGH', 'INTERMEDIATE', 5],
      ['Testing', 'MEDIUM', 'BEGINNER', 2],
      ['Git/GitHub', 'MEDIUM', 'INTERMEDIATE', 3]
    ]
  },
  {
    slug: 'qa-engineer',
    title: 'QA Engineer',
    summary: 'Improves release confidence through automated testing and quality processes.',
    demandLevel: 'Stable',
    requirements: [
      ['Testing', 'HIGH', 'INTERMEDIATE', 5],
      ['Playwright', 'HIGH', 'BEGINNER', 4],
      ['JavaScript', 'MEDIUM', 'BEGINNER', 3],
      ['SQL', 'MEDIUM', 'BEGINNER', 2],
      ['CI/CD', 'MEDIUM', 'BEGINNER', 2],
      ['Git/GitHub', 'MEDIUM', 'INTERMEDIATE', 3]
    ]
  }
] as const;

const roadmapTemplates: Record<string, Array<{ title: string; skill: string; priority: Priority; hours: number; description: string }>> = {
  'backend-developer': [
    { title: 'REST API foundations', skill: 'Express', priority: 'HIGH', hours: 18, description: 'Build validated endpoints, middleware, error handling, and pagination.' },
    { title: 'Relational data modeling', skill: 'PostgreSQL', priority: 'HIGH', hours: 20, description: 'Model entities, constraints, indexes, and transactional workflows.' },
    { title: 'Production service workflow', skill: 'Docker', priority: 'MEDIUM', hours: 14, description: 'Containerize services and prepare repeatable local and deployment commands.' }
  ],
  'frontend-developer': [
    { title: 'Accessible React interfaces', skill: 'React', priority: 'HIGH', hours: 22, description: 'Create responsive screens with forms, state, loading, and error states.' },
    { title: 'Type-safe UI architecture', skill: 'TypeScript', priority: 'HIGH', hours: 16, description: 'Use typed API contracts and reusable component props.' },
    { title: 'Frontend quality checks', skill: 'Testing', priority: 'MEDIUM', hours: 12, description: 'Add component and browser-flow tests around critical user journeys.' }
  ],
  'devops-engineer': [
    { title: 'Container orchestration basics', skill: 'Docker', priority: 'HIGH', hours: 18, description: 'Package applications and manage dependent services consistently.' },
    { title: 'Delivery pipeline design', skill: 'CI/CD', priority: 'HIGH', hours: 18, description: 'Automate build, test, migration, and release checks.' },
    { title: 'Cloud deployment fundamentals', skill: 'AWS', priority: 'HIGH', hours: 24, description: 'Deploy services using managed compute, networking, and observability basics.' }
  ],
  'data-engineer': [
    { title: 'Analytical SQL patterns', skill: 'SQL', priority: 'HIGH', hours: 20, description: 'Write joins, aggregations, windows, and data quality checks.' },
    { title: 'Pipeline scripting', skill: 'Python', priority: 'HIGH', hours: 22, description: 'Build repeatable scripts for ingestion, transformation, and validation.' },
    { title: 'Warehouse-ready modeling', skill: 'Data Modeling', priority: 'HIGH', hours: 18, description: 'Design models that balance query performance and maintainability.' }
  ],
  'mobile-developer': [
    { title: 'React Native screens', skill: 'React Native', priority: 'HIGH', hours: 24, description: 'Build mobile screens, navigation flows, and API-connected state.' },
    { title: 'Typed mobile data flow', skill: 'TypeScript', priority: 'MEDIUM', hours: 14, description: 'Use typed models for forms, API responses, and local state.' },
    { title: 'Mobile release confidence', skill: 'Testing', priority: 'MEDIUM', hours: 12, description: 'Cover key flows and edge cases with pragmatic tests.' }
  ],
  'qa-engineer': [
    { title: 'Test strategy foundations', skill: 'Testing', priority: 'HIGH', hours: 18, description: 'Design test cases by risk, boundary, and user workflow.' },
    { title: 'Browser automation', skill: 'Playwright', priority: 'HIGH', hours: 18, description: 'Automate critical browser workflows and debug flaky tests.' },
    { title: 'Quality gates in CI', skill: 'CI/CD', priority: 'MEDIUM', hours: 12, description: 'Run tests automatically and report failures clearly.' }
  ]
};

const resourcesFor = (skill: string) => [
  {
    title: `${skill} official documentation`,
    url: `https://www.google.com/search?q=${encodeURIComponent(`${skill} official documentation`)}`,
    type: 'DOCUMENTATION' as ResourceType
  },
  {
    title: `${skill} project practice path`,
    url: `https://www.google.com/search?q=${encodeURIComponent(`${skill} project tutorial`)}`,
    type: 'PROJECT' as ResourceType
  }
];

const jobPosts = [
  {
    externalId: 'seed:topcv:junior-react-developer',
    title: 'Junior React Developer',
    company: 'FPT Software',
    location: 'Ho Chi Minh City',
    source: 'TopCV',
    salary: '15M - 25M VND',
    skills: ['React', 'TypeScript', 'JavaScript', 'Testing'],
    url: 'https://www.topcv.vn/viec-lam-it-phan-mem-c10026',
    description: 'React TypeScript JavaScript HTML CSS REST API Git GitHub testing'
  },
  {
    externalId: 'seed:vietnamworks:backend-nodejs-intern',
    title: 'Backend Node.js Intern',
    company: 'NashTech',
    location: 'Ho Chi Minh City',
    source: 'VietnamWorks',
    salary: 'Negotiable',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Docker', 'SQL', 'Testing'],
    url: 'https://www.vietnamworks.com/en',
    description: 'Node.js Express PostgreSQL Prisma Docker SQL REST API testing'
  },
  {
    externalId: 'seed:careerviet:java-spring-boot-developer',
    title: 'Java Spring Boot Developer',
    company: 'TMA Solutions',
    location: 'Ho Chi Minh City',
    source: 'CareerViet',
    salary: '20M - 35M VND',
    skills: ['Java', 'Spring Boot', 'SQL', 'Docker', 'AWS', 'CI/CD'],
    url: 'https://careerviet.vn/',
    description: 'Java Spring Boot SQL Docker AWS CI/CD Git'
  },
  {
    externalId: 'seed:vietnamworks:devops-fresher',
    title: 'DevOps Fresher',
    company: 'VNG',
    location: 'Ho Chi Minh City',
    source: 'VietnamWorks',
    salary: '18M - 30M VND',
    skills: ['Docker', 'CI/CD', 'AWS', 'SQL'],
    url: 'https://www.vietnamworks.com/en',
    description: 'Docker CI/CD AWS Linux Git GitHub monitoring SQL'
  },
  {
    externalId: 'seed:topcv:data-engineer-intern',
    title: 'Data Engineer Intern',
    company: 'KMS Technology',
    location: 'Da Nang',
    source: 'TopCV',
    salary: '12M - 22M VND',
    skills: ['Python', 'SQL', 'PostgreSQL', 'Data Modeling', 'Docker', 'AWS'],
    url: 'https://www.topcv.vn/viec-lam-it-phan-mem-c10026',
    description: 'Python SQL PostgreSQL Data Modeling Docker AWS ETL'
  },
  {
    externalId: 'seed:careerviet:qa-automation-engineer',
    title: 'QA Automation Engineer',
    company: 'Axon Active',
    location: 'Da Nang',
    source: 'CareerViet',
    salary: '16M - 28M VND',
    skills: ['Testing', 'Playwright', 'JavaScript', 'SQL', 'CI/CD'],
    url: 'https://careerviet.vn/',
    description: 'Testing Playwright JavaScript SQL CI/CD Git automation'
  }
];

async function resetDatabase() {
  await prisma.gitHubRepository.deleteMany();
  await prisma.gitHubProfile.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.roadmapProgress.deleteMany();
  await prisma.learningResource.deleteMany();
  await prisma.learningNode.deleteMany();
  await prisma.roleSkillRequirement.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.jobPost.deleteMany();
  await prisma.user.deleteMany();
  await prisma.careerRole.deleteMany();
  await prisma.skill.deleteMany();
}

async function main() {
  await resetDatabase();

  const skills = new Map<string, string>();
  for (const [name, category, description] of skillCatalog) {
    const skill = await prisma.skill.create({ data: { name, category, description } });
    skills.set(name, skill.id);
  }

  const roleIds = new Map<string, string>();
  for (const role of roles) {
    const createdRole = await prisma.careerRole.create({
      data: {
        slug: role.slug,
        title: role.title,
        summary: role.summary,
        demandLevel: role.demandLevel
      }
    });
    roleIds.set(role.slug, createdRole.id);

    for (const [skillName, priority, requiredLevel, weight] of role.requirements) {
      await prisma.roleSkillRequirement.create({
        data: {
          roleId: createdRole.id,
          skillId: skills.get(skillName)!,
          priority: priority as Priority,
          requiredLevel: requiredLevel as SkillLevel,
          weight
        }
      });
    }

    const nodes = roadmapTemplates[role.slug];
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const learningNode = await prisma.learningNode.create({
        data: {
          roleId: createdRole.id,
          skillId: skills.get(node.skill),
          title: node.title,
          description: node.description,
          priority: node.priority,
          estimatedHours: node.hours,
          sortOrder: index + 1
        }
      });

      await prisma.learningResource.createMany({
        data: resourcesFor(node.skill).map((resource) => ({
          nodeId: learningNode.id,
          title: resource.title,
          url: resource.url,
          type: resource.type
        }))
      });
    }
  }

  const studentPassword = await bcrypt.hash('Student@123', 12);
  const counselorPassword = await bcrypt.hash('Counselor@123', 12);

  const student = await prisma.user.create({
    data: {
      email: 'student@example.com',
      passwordHash: studentPassword,
      name: 'Minh Nguyen',
      role: UserRole.STUDENT,
      profile: {
        create: {
          headline: 'Software engineering student interested in backend systems',
          location: 'Ho Chi Minh City',
          university: 'FPT University',
          major: 'Software Engineering',
          graduationYear: 2027,
          gpa: 3.35,
          targetRoleId: roleIds.get('backend-developer'),
          careerInterests: ['Backend Developer', 'Cloud APIs', 'Database Design'],
          courses: [
            { code: 'PRN212', name: '.NET and backend fundamentals', grade: 'B+' },
            { code: 'SWP391', name: 'Software development project', grade: 'A' }
          ],
          transcriptName: 'manual-entry'
        }
      }
    }
  });

  for (const [skillName, level] of [
    ['JavaScript', 'INTERMEDIATE'],
    ['TypeScript', 'BEGINNER'],
    ['Node.js', 'BEGINNER'],
    ['PostgreSQL', 'BEGINNER'],
    ['Git/GitHub', 'INTERMEDIATE']
  ] as const) {
    await prisma.studentSkill.create({
      data: {
        userId: student.id,
        skillId: skills.get(skillName)!,
        level: level as SkillLevel
      }
    });
  }

  await prisma.user.create({
    data: {
      email: 'counselor@example.com',
      passwordHash: counselorPassword,
      name: 'Counselor Admin',
      role: UserRole.COUNSELOR_ADMIN
    }
  });

  await prisma.jobPost.createMany({ data: jobPosts });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed data created.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
