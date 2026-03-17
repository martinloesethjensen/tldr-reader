// PHASE 3
export const TAG_COLORS: Record<string, string> = {
  github:         '#e879f9',
  cli:            '#fbbf24',
  rust:           '#fb923c',
  python:         '#60a5fa',
  ai:             '#a78bfa',
  security:       '#f87171',
  'open source':  '#34d399',
  cloud:          '#38bdf8',
  typescript:     '#93c5fd',
  web:            '#fb923c',
  devops:         '#4ade80',
  database:       '#22d3ee',
  llm:            '#c084fc',
  mobile:         '#fb7185',
  startup:        '#facc15',
  linux:          '#a3e635',
  performance:    '#f0abfc',
};

export function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? '#94a3b8';
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Articles & Tutorials': '#38bdf8',
  'Opinions & Advice':    '#a78bfa',
  'Launches & Tools':     '#4ade80',
  'Quick Links':          '#fbbf24',
  'Headlines':            '#f87171',
  'Deep Dives':           '#fb923c',
  'Science & Tech':       '#34d399',
  'Misc':                 '#94a3b8',
  'General':              '#64748b',
};

export function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? '#64748b';
}
