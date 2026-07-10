import { Bot, BriefcaseBusiness, Github, LineChart, Route, ShieldCheck, UserRound } from 'lucide-react'

export type PageKey = 'profile' | 'gap' | 'roadmap' | 'mentor' | 'portfolio' | 'market' | 'admin'

export const navItems: Array<{
  key: PageKey
  label: string
  description: string
  icon: typeof UserRound
}> = [
  { key: 'profile', label: 'Profile', description: 'Career baseline', icon: UserRound },
  { key: 'gap', label: 'Skill Gap', description: 'Readiness score', icon: LineChart },
  { key: 'roadmap', label: 'Roadmap', description: 'Learning plan', icon: Route },
  { key: 'mentor', label: 'AI Mentor', description: 'Weekly guidance', icon: Bot },
  { key: 'portfolio', label: 'Portfolio', description: 'GitHub evidence', icon: Github },
  { key: 'market', label: 'Market Pulse', description: 'Hiring signals', icon: BriefcaseBusiness },
  { key: 'admin', label: 'Admin', description: 'Counselor tools', icon: ShieldCheck },
]

export const pageLabels = Object.fromEntries(navItems.map((item) => [item.key, item.label])) as Record<PageKey, string>
