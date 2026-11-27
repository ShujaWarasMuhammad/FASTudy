// Chronos: FASTudy AI Academic Planner & Strategist
// Manages timetable, scans Google Classroom (GCR) announcements,
// consults Bugsy for student weak topics, and generates adaptive study routines
// accounting for Day Scholar vs. Hostelite commute time (40-50 mins).

import { getBugsyAnalytics } from './bugsy';
import { TIMETABLE_ENTRIES } from '../data/timetable';

import { GEMINI_API_KEY, generateGeminiText } from './geminiClient';

const LOCAL_STORAGE_CHRONOS_KEY = 'fastudy_chronos_data_v1';

export const DEFAULT_TIMETABLE = TIMETABLE_ENTRIES;

// Announcements are user-entered (pasted from Google Classroom); nothing is pre-seeded.
export const DEFAULT_GCR_POSTS = [];

const GREETING = {
  role: 'agent',
  text: 'Hi, I\'m **Chronos**. Ask what to study today, or tell me if you\'re a Day Scholar or Hostelite.',
};

const DEFAULT_STATE = () => ({
  residenceStatus: 'day_scholar',
  // Fixed university-bus windows requested for day scholars.
  commuteDurationMinutes: 60,
  gcrPosts: DEFAULT_GCR_POSTS,
  chatHistory: [GREETING],
});

const toHHMM = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/**
 * Loads stored Chronos planner data
 */
export function loadChronosData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHRONOS_KEY);
    if (!raw) return DEFAULT_STATE();
    const parsed = JSON.parse(raw);
    return {
      residenceStatus: parsed.residenceStatus || 'day_scholar',
      commuteDurationMinutes: parsed.commuteDurationMinutes ?? 60,
      gcrPosts: Array.isArray(parsed.gcrPosts) ? parsed.gcrPosts : [],
      chatHistory: parsed.chatHistory?.length ? parsed.chatHistory : [GREETING],
    };
  } catch (e) {
    console.warn('Failed to load Chronos data:', e);
    return DEFAULT_STATE();
  }
}

/**
 * Saves Chronos planner data
 */
export function saveChronosData(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHRONOS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save Chronos data:', e);
  }
}

/**
 * Scans text for Google Classroom academic keywords
 */
export function scanGcrKeywords(text = '') {
  const lower = text.toLowerCase();
  const detected = [];
  let category = 'general';

  if (/\b(?:quiz|surprise quiz|lab quiz|pop quiz|test|midterm|sessional)\b/.test(lower)) {
    detected.push('quiz');
    category = 'quiz';
  }
  if (/\b(?:makeup|rescheduled|extra lecture|compensation class|extra class)\b/.test(lower)) {
    detected.push('makeup class');
    if (category === 'general') category = 'makeup';
  }
  if (/\b(?:project|semester project|milestone|deliverable|term project)\b/.test(lower)) {
    detected.push('project');
    if (category === 'general') category = 'project';
  }
  if (/\b(?:presentation|viva|demo|defense|talk)\b/.test(lower)) {
    detected.push('presentation');
    if (category === 'general') category = 'presentation';
  }
  if (/\b(?:assignment|homework|lab task|problem set|submission)\b/.test(lower)) {
    detected.push('assignment');
    if (category === 'general') category = 'assignment';
  }

  // Topic keywords
  if (/\b(?:nested loops|pattern|patterns)\b/.test(lower)) detected.push('nested loops');
  if (/\b(?:array|arrays|1d array|2d array|matrix)\b/.test(lower)) detected.push('arrays');
  if (/\b(?:pointer|pointers|memory|dynamic)\b/.test(lower)) detected.push('pointers');
  if (/\b(?:string|strings|c-string)\b/.test(lower)) detected.push('strings');
  if (/\b(?:derivative|derivatives|optimization|rate of change)\b/.test(lower)) detected.push('derivatives');

  return {
    category,
    keywords: detected
  };
}

/**
 * Generates an adaptive day-by-day study schedule
 * - Takes timetable into account
 * - Reserves the fixed 07:30–08:30 and 17:00–18:00 commute windows for Day Scholars
 * - Consults Bugsy for weak topics
 * - Prioritizes upcoming quizzes/projects from GCR
 */
export function generateAdaptiveSchedule({
  residenceStatus = 'day_scholar',
  timetable = DEFAULT_TIMETABLE,
  gcrPosts = DEFAULT_GCR_POSTS,
  targetDay = 'Monday'
}) {
  const bugsy = getBugsyAnalytics();
  const weakTopics = bugsy.weakTopics || [];
  const primaryWeakTopic = weakTopics[0]?.topic || null;

  // Find classes on target day
  const dayClasses = timetable
    .filter(t => t.day.toLowerCase() === targetDay.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const scheduleSlots = [];

  // 1. Morning commute is a non-negotiable fixed block for day scholars.
  if (residenceStatus === 'day_scholar') {
    scheduleSlots.push({
      time: '07:30 - 08:30',
      title: '🚌 Commute to campus',
      type: 'commute',
      description: 'Travel to campus.',
      icon: 'bus'
    });
  } else {
    scheduleSlots.push({
      time: '08:00 - 08:25',
      title: '🚶 Breakfast & walk',
      type: 'commute',
      description: 'Walk to class.',
      icon: 'walk'
    });
  }

  // 2. Scheduled Lectures & Labs
  dayClasses.forEach(c => {
    scheduleSlots.push({
      time: `${c.startTime} - ${c.endTime}`,
      title: `🎓 ${c.course} (${c.type})`,
      type: c.type === 'Lab' ? 'lab' : 'class',
      description: c.room,
      icon: 'book'
    });
  });

  // 3. Protect the fixed evening commute. Chronos plans around it rather than
  // squeezing a task into a period when the student is travelling.
  let cursor = 17 * 60;
  if (residenceStatus === 'day_scholar') {
    scheduleSlots.push({
      time: '17:00 - 18:00',
      title: '🚌 Commute home',
      type: 'commute',
      description: 'Travel home.',
      icon: 'bus'
    });
    cursor = 18 * 60;
  }

  const restEnd = cursor + 45;
  scheduleSlots.push({
    time: `${toHHMM(cursor)} - ${toHHMM(restEnd)}`,
    title: residenceStatus === 'day_scholar' ? '☕ Rest' : '🏸 Rest',
    type: 'rest',
    description: 'Recharge before studying.',
    icon: 'coffee'
  });
  cursor = restEnd + 30;

  // 4. Targeted Weak-Topic Study Session (from Bugsy analytics when available)
  scheduleSlots.push({
    time: `${toHHMM(cursor)} - ${toHHMM(cursor + 90)}`,
    title: primaryWeakTopic ? `🐛 Practice: ${primaryWeakTopic}` : '🐛 Practice session',
    type: 'study_bugsy',
    description: primaryWeakTopic
      ? `Solve 2–3 problems on this topic.`
      : 'Solve a few PF problems to find your weak topics.',
    icon: 'bug',
    topic: primaryWeakTopic
  });
  cursor += 90 + 60; // dinner break

  // 5. GCR priority block: every tracked assessment type can drive the plan.
  const priority = { quiz: 0, assignment: 1, presentation: 2, project: 3, makeup: 4, general: 5 };
  const relevantGcr = [...gcrPosts].sort((a, b) => (priority[a.category] ?? 5) - (priority[b.category] ?? 5))[0];
  if (relevantGcr) {
    scheduleSlots.push({
      time: `${toHHMM(cursor)} - ${toHHMM(cursor + 75)}`,
      title: `📝 Prep: ${relevantGcr.course} ${relevantGcr.category}`,
      type: 'study_gcr',
      description: relevantGcr.text.length > 70 ? `${relevantGcr.text.slice(0, 70)}…` : relevantGcr.text,
      icon: 'file'
    });
  } else {
    scheduleSlots.push({
      time: `${toHHMM(cursor)} - ${toHHMM(cursor + 60)}`,
      title: '📚 Coursework review',
      type: 'study_general',
      description: 'Review today’s lectures.',
      icon: 'file'
    });
  }

  // 6. Night Wind-down
  scheduleSlots.push({
    time: '22:30 - 23:00',
    title: '🌙 Wind down',
    type: 'rest',
    description: 'Check tomorrow’s classes.',
    icon: 'moon'
  });

  return scheduleSlots;
}

/**
 * Chronos Conversational Agent Response Generator
 * Processes user queries like:
 * - "I am a hostelite"
 * - "Add quiz in PF next Tuesday"
 * - "Calculus makeup class Friday 3pm"
 * - "What is my plan for today?"
 */
export async function talkToChronos({
  userMessage,
  currentState,
  user: _user
}) {
  const msg = (userMessage || '').trim();
  const lower = msg.toLowerCase();

  let updatedState = { ...currentState };
  let agentReply = '';

  // 1. Check residence status change
  if (lower.includes('day scholar') || lower.includes('day-scholar')) {
    updatedState.residenceStatus = 'day_scholar';
    updatedState.commuteDurationMinutes = 60;
    agentReply = `Set to **Day Scholar**. Commute time is now blocked in your plan.`;
  } else if (lower.includes('hostelite') || lower.includes('hostel') || lower.includes('hostelites')) {
    updatedState.residenceStatus = 'hostelite';
    updatedState.commuteDurationMinutes = 5;
    agentReply = `Set to **Hostelite**. Commute removed, so you have more evening study time.`;
  }
  // 2. Check for GCR announcement / quiz / makeup class addition
  else if (lower.includes('quiz') || lower.includes('makeup') || lower.includes('project') || lower.includes('presentation') || lower.includes('assignment') || lower.includes('homework')) {
    const scan = scanGcrKeywords(msg);
    const newPost = {
      id: `gcr_${Date.now()}`,
      course: lower.includes('pf') || lower.includes('programming') ? 'Programming Fundamentals' : (lower.includes('calc') ? 'Calculus' : 'Coursework'),
      teacher: 'Course Instructor',
      text: msg,
      date: 'Upcoming',
      keywords: scan.keywords,
      category: scan.category,
      dueDate: lower.includes('friday') ? 'Friday' : (lower.includes('tuesday') ? 'Tuesday' : 'Upcoming')
    };

    updatedState.gcrPosts = [newPost, ...updatedState.gcrPosts];

    agentReply = `Added a **${scan.category}** to GCR Radar${scan.keywords.length ? ` (${scan.keywords.join(', ')})` : ''}. Prep time is in your Study Plan.`;
  }
  // 3. General scheduling consultation via Gemini (or intelligent fallback)
  else if (GEMINI_API_KEY) {
    try {
      const bugsy = getBugsyAnalytics();

      const prompt = `You are Chronos, the intelligent Academic Planner for FAST NUCES university students.
Student profile:
- Residence: ${updatedState.residenceStatus === 'day_scholar' ? 'Day Scholar (takes 45m bus commute)' : 'Hostelite (lives in campus hostel)'}
- Weak topics identified by TA Bugsy: ${bugsy.weakTopics.map(w => w.topic).join(', ') || 'None yet'}
- Active GCR Announcements: ${updatedState.gcrPosts.map(p => `[${p.category}] ${p.text}`).join('; ')}

Student asked: "${msg}"

Rules:
- Answer in at most 3 short bullet points or 2 sentences, under 60 words total.
- No greeting, no headings, no filler. Be direct and specific.
- For study advice, name the weak topic and a time slot.`;

      agentReply = await generateGeminiText([{ role: 'user', parts: [{ text: prompt }] }], { maxOutputTokens: 300, temperature: 0.4 });
    } catch (e) {
      console.warn('Chronos Gemini fallback:', e);
    }
  }

  if (!agentReply) {
    const bugsy = getBugsyAnalytics();
    const primaryWeak = bugsy.weakTopics[0]?.topic;
    const schedule = updatedState.residenceStatus === 'day_scholar' ? 'Day Scholar bus commute' : 'Hostelite schedule';
    agentReply = primaryWeak
      ? `Focus on **${primaryWeak}** in tonight's study block. See the **Study Plan** tab.`
      : `No weak topics yet. Solve a few PF problems so I can personalise your plan.`;
  }

  // Update chat history
  const updatedChat = [
    ...(updatedState.chatHistory || []),
    { role: 'user', text: msg },
    { role: 'agent', text: agentReply }
  ];

  updatedState.chatHistory = updatedChat.slice(-60); // keep storage bounded
  saveChronosData(updatedState);

  return {
    reply: agentReply,
    updatedState
  };
}
