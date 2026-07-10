export interface MentorContext {
  studentName: string;
  headline: string | null;
  targetRole: string;
  currentSkills: string[];
  missingSkills: string[];
  belowLevelSkills: string[];
  completedNodes: number;
  totalNodes: number;
  roadmapNodes: Array<{ title: string; status: string; priority: string; estimatedHours: number }>;
  gpa: number | null;
  major: string | null;
  careerInterests: string[];
}

export interface LearningPlanItem {
  dayRange: string;
  title: string;
  tasks: string[];
  evidence: string;
}

export interface LearningPlan {
  horizonDays: 7 | 30;
  focus: string;
  items: LearningPlanItem[];
}

function roleMentorInstruction(targetRole: string) {
  const normalized = targetRole.toLowerCase();
  if (normalized.includes('frontend')) {
    return 'Mentor lens: frontend roles need accessible UI, component architecture, type-safe API usage, and visible portfolio polish.';
  }
  if (normalized.includes('fullstack') || normalized.includes('full stack')) {
    return 'Mentor lens: fullstack roles need end-to-end product slices, API contracts, database design, auth, deployment, and UI quality.';
  }
  if (normalized.includes('ai') || normalized.includes('machine learning') || normalized.includes('ml')) {
    return 'Mentor lens: AI engineer roles need Python, model evaluation, data quality, API integration, and honest experiment reporting.';
  }
  return 'Mentor lens: backend roles need API design, data modeling, validation, testing, deployment readiness, and operational clarity.';
}

function buildProfileContextBlock(context: MentorContext) {
  return `Student: ${context.studentName}
Headline: ${context.headline ?? 'Not provided'}
Major: ${context.major ?? 'Not provided'}
GPA: ${context.gpa ?? 'Not provided'}
Career interests: ${context.careerInterests.join(', ') || 'None listed'}
Target role: ${context.targetRole}
Current skills: ${context.currentSkills.join(', ') || 'None listed'}
Missing skills: ${context.missingSkills.join(', ') || 'None'}
Below-level skills: ${context.belowLevelSkills.join(', ') || 'None'}
Roadmap progress: ${context.completedNodes}/${context.totalNodes} completed
Roadmap nodes:
${context.roadmapNodes.map((node) => `- ${node.title} | ${node.status} | ${node.priority} | ${node.estimatedHours}h`).join('\n') || '- No roadmap nodes'}`;
}

export function createFallbackMentorAnswer(context: MentorContext, question: string) {
  const missing = context.missingSkills.slice(0, 3).join(', ') || 'no critical missing skill recorded';
  const below = context.belowLevelSkills.slice(0, 3).join(', ') || 'no below-level skill recorded';
  const progress = `${context.completedNodes}/${context.totalNodes} roadmap nodes completed`;
  const nextNode = context.roadmapNodes.find((node) => node.status !== 'COMPLETED')?.title ?? 'the next roadmap node';

  return [
    roleMentorInstruction(context.targetRole),
    `For ${context.targetRole}, focus on the highest-impact gaps first: ${missing}.`,
    `Your below-level skills are ${below}, so turn one of them into a small portfolio project this week.`,
    `Current roadmap progress is ${progress}; next roadmap focus is ${nextNode}.`,
    `Question noted: "${question}". A practical next step is to complete ${nextNode}, commit the result, and document the evidence in your GitHub portfolio.`
  ].join(' ');
}

export function buildMentorPrompt(context: MentorContext, question: string) {
  return `You are a concise career mentor for a software engineering student.
${roleMentorInstruction(context.targetRole)}
Use the student's profile, skill gap, and roadmap. Do not invent credentials or completed work.
${buildProfileContextBlock(context)}

Answer the student's question with direct, actionable advice. Include the next roadmap node and one portfolio evidence action.
Question: ${question}`;
}

export function buildLearningPlanPrompt(context: MentorContext, horizonDays: 7 | 30) {
  return `You are a career mentor generating a ${horizonDays}-day learning plan.
${roleMentorInstruction(context.targetRole)}
Use this context:
${buildProfileContextBlock(context)}

Return strict JSON only with this shape:
{
  "horizonDays": ${horizonDays},
  "focus": "one sentence",
  "items": [
    {
      "dayRange": "Day 1-2",
      "title": "short milestone",
      "tasks": ["task 1", "task 2"],
      "evidence": "GitHub or portfolio evidence"
    }
  ]
}
Use ${horizonDays === 7 ? '4' : '5'} items.`;
}

export function createFallbackLearningPlan(context: MentorContext, horizonDays: 7 | 30): LearningPlan {
  const openNodes = context.roadmapNodes.filter((node) => node.status !== 'COMPLETED');
  const firstNode = openNodes[0]?.title ?? context.missingSkills[0] ?? 'target-role fundamentals';
  const secondNode = openNodes[1]?.title ?? context.belowLevelSkills[0] ?? 'portfolio evidence';
  const missingSkill = context.missingSkills[0] ?? 'the highest-priority missing skill';
  const belowSkill = context.belowLevelSkills[0] ?? 'a below-level skill';

  if (horizonDays === 7) {
    return {
      horizonDays,
      focus: `Close the most visible ${context.targetRole} gap and produce one GitHub-backed proof artifact.`,
      items: [
        { dayRange: 'Day 1-2', title: `Start ${firstNode}`, tasks: [`Review the roadmap resources for ${firstNode}.`, `Write a short checklist for ${missingSkill}.`], evidence: 'Create a GitHub issue or README checklist for the learning task.' },
        { dayRange: 'Day 3-4', title: `Build a small ${missingSkill} exercise`, tasks: ['Implement one focused practice feature.', 'Add validation or tests where relevant.'], evidence: 'Commit the exercise with a clear README note.' },
        { dayRange: 'Day 5-6', title: `Upgrade ${belowSkill}`, tasks: [`Connect ${belowSkill} to the practice feature.`, 'Document what changed and what still needs work.'], evidence: 'Push a before/after commit and link it in the portfolio.' },
        { dayRange: 'Day 7', title: 'Mentor review and portfolio polish', tasks: ['Ask the mentor for review questions.', `Summarize how this supports ${context.targetRole}.`], evidence: 'Publish a short portfolio update with screenshots or API examples.' }
      ]
    };
  }

  return {
    horizonDays,
    focus: `Build role-ready ${context.targetRole} evidence across roadmap progress, skill gaps, and portfolio proof.`,
    items: [
      { dayRange: 'Day 1-5', title: `Baseline ${missingSkill} and ${belowSkill}`, tasks: ['Re-check profile skill levels.', 'Collect resources from the roadmap.', 'Define one portfolio outcome.'], evidence: 'Create a public project plan in GitHub.' },
      { dayRange: 'Day 6-12', title: `Complete ${firstNode}`, tasks: ['Finish the main learning resource.', 'Build a small implementation.', 'Write tests or examples.'], evidence: 'Commit a working feature with setup instructions.' },
      { dayRange: 'Day 13-19', title: `Apply ${secondNode}`, tasks: ['Extend the first feature into a realistic workflow.', 'Connect data, API, or UI boundaries as needed.'], evidence: 'Record a README demo flow and screenshots.' },
      { dayRange: 'Day 20-26', title: 'Interview and market alignment', tasks: ['Map project decisions to job post skills.', 'Prepare 5 interview explanations.', 'Ask mentor for critique.'], evidence: 'Add a project retrospective section to the portfolio.' },
      { dayRange: 'Day 27-30', title: 'Ship portfolio proof', tasks: ['Polish README, deployment notes, and screenshots.', 'Update profile skills only where evidence exists.'], evidence: 'Publish final portfolio link and roadmap progress update.' }
    ]
  };
}

export function parseLearningPlan(raw: string | null, fallback: LearningPlan): LearningPlan {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as LearningPlan;
    if (
      parsed.horizonDays === fallback.horizonDays &&
      typeof parsed.focus === 'string' &&
      Array.isArray(parsed.items) &&
      parsed.items.every(
        (item) =>
          typeof item.dayRange === 'string' &&
          typeof item.title === 'string' &&
          Array.isArray(item.tasks) &&
          item.tasks.every((task) => typeof task === 'string') &&
          typeof item.evidence === 'string'
      )
    ) {
      return parsed;
    }
  } catch {
    return fallback;
  }
  return fallback;
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
