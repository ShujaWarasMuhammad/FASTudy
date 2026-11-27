import { LayoutDashboard, BookOpen, LineChart, CalendarClock } from 'lucide-react';

/** Single source of truth for primary navigation: navbar, command palette and dashboard guide. */
export const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    hint: 'Your overview: progress, next problem and shortcuts.',
    match: (p) => p === '/',
  },
  {
    to: '/practice',
    label: 'Practice',
    icon: BookOpen,
    hint: 'Pick a course, then a topic, then open a problem to solve it.',
    how: 'Practice → course → topic → problem',
    match: (p) => p.startsWith('/practice') || p.startsWith('/question'),
  },
  {
    to: '/profile',
    label: 'Progress',
    icon: LineChart,
    hint: 'Streaks, activity heatmap, bookmarks, history and Bugsy weak topics.',
    how: 'Progress → Overview / Bookmarks / History / Bugsy tabs',
    match: (p) => p === '/profile',
  },
  {
    to: '/planner',
    label: 'Planner',
    icon: CalendarClock,
    hint: 'Live class timetable, daily study plan, Classroom announcements and Chronos chat.',
    how: 'Planner → Timetable / Study Plan / GCR Radar / Chat tabs',
    match: (p) => p === '/planner',
  },
];

/** Per-course accent colours (falls back to the theme accent). */
export const COURSE_COLORS = { pf: '#2f6feb', calculus: '#0f9d76', physics: '#c2410c' };
