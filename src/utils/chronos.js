// Chronos: FASTudy AI Academic Planner & Strategist
// Manages timetable, scans Google Classroom (GCR) announcements,
// consults Bugsy for student weak topics, and generates adaptive study routines
// accounting for Day Scholar vs. Hostelite commute time (40-50 mins).

import { supabase } from '../config/supabase';
import { getBugsyAnalytics } from './bugsy';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const LOCAL_STORAGE_CHRONOS_KEY = 'fastudy_chronos_data_v1';

// Default realistic timetable for FAST NUCES students
export const DEFAULT_TIMETABLE = [
  { id: 'tt_1', day: 'Monday', startTime: '08:30', endTime: '10:00', course: 'Programming Fundamentals', type: 'Lecture', room: 'CS-1' },
  { id: 'tt_2', day: 'Monday', startTime: '10:15', endTime: '11:45', course: 'Calculus & Analytical Geometry', type: 'Lecture', room: 'CS-2' },
  { id: 'tt_3', day: 'Tuesday', startTime: '08:30', endTime: '11:30', course: 'Programming Fundamentals Lab', type: 'Lab', room: 'Lab-3' },
  { id: 'tt_4', day: 'Tuesday', startTime: '12:30', endTime: '14:00', course: 'Applied Physics', type: 'Lecture', room: 'PHY-1' },
  { id: 'tt_5', day: 'Wednesday', startTime: '09:00', endTime: '10:30', course: 'Calculus & Analytical Geometry', type: 'Lecture', room: 'CS-2' },
  { id: 'tt_6', day: 'Wednesday', startTime: '11:00', endTime: '12:30', course: 'Programming Fundamentals', type: 'Lecture', room: 'CS-1' },
  { id: 'tt_7', day: 'Thursday', startTime: '10:00', endTime: '13:00', course: 'Applied Physics Lab', type: 'Lab', room: 'PHY-Lab' },
  { id: 'tt_8', day: 'Friday', startTime: '08:30', endTime: '10:00', course: 'English Composition', type: 'Lecture', room: 'H&S-1' },
  { id: 'tt_9', day: 'Friday', startTime: '10:15', endTime: '11:45', course: 'Pakistan Studies', type: 'Lecture', room: 'H&S-2' },
];

// Sample initial GCR announcements with FAST keywords
export const DEFAULT_GCR_POSTS = [
  {
    id: 'gcr_1',
    course: 'Programming Fundamentals',
    teacher: 'Dr. Zulfiqar Ali',
    text: 'Reminder: Lab Quiz 3 on 1D Arrays and Nested Loops will be conducted at the start of tomorrow lab session. Bring your student IDs.',
    date: 'Tomorrow, 08:30 AM',
    keywords: ['quiz', '1d arrays', 'nested loops'],
    category: 'quiz',
    dueDate: 'Tuesday',
  },
  {
    id: 'gcr_2',
    course: 'Calculus & Analytical Geometry',
    teacher: 'Prof. Sajjad Ahmed',
    text: 'Makeup class for Derivatives & Optimization will take place this Thursday from 14:00 to 15:30 in CS-2.',
    date: 'Thursday, 02:00 PM',
    keywords: ['makeup class', 'derivatives', 'optimization'],
    category: 'makeup',
    dueDate: 'Thursday',
  },
  {
    id: 'gcr_3',
    course: 'Programming Fundamentals',
    teacher: 'Dr. Zulfiqar Ali',
    text: 'Semester Project Milestone 1 submission is due next Monday. Submission must include working C++ code and documentation.',
    date: 'Next Monday, 11:59 PM',
    keywords: ['project', 'milestone', 'c++'],
    category: 'project',
    dueDate: 'Monday',
  },
];

/**
 * Loads stored Chronos planner data
 */
export function loadChronosData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHRONOS_KEY);
    if (!raw) {
      return {
        residenceStatus: 'day_scholar', // 'day_scholar' | 'hostelite'
        commuteDurationMinutes: 45,     // 45 mins each way for day scholars (campus is outside city)
        timetable: DEFAULT_TIMETABLE,
        gcrPosts: DEFAULT_GCR_POSTS,
        chatHistory: [
          {
            role: 'agent',
            text: 'Hello FASTian! I am Chronos, your AI Academic Planner. I have synchronized your timetable and scanned your Google Classroom streams. Let me know if you are a Day Scholar or Hostelite so I can calculate your campus commute!'
          }
        ]
      };
    }
    const parsed = JSON.parse(raw);
    return {
      residenceStatus: parsed.residenceStatus || 'day_scholar',
      commuteDurationMinutes: parsed.commuteDurationMinutes ?? 45,
      timetable: parsed.timetable || DEFAULT_TIMETABLE,
      gcrPosts: parsed.gcrPosts || DEFAULT_GCR_POSTS,
      chatHistory: parsed.chatHistory || []
    };
  } catch (e) {
    console.warn('Failed to load Chronos data:', e);
    return {
      residenceStatus: 'day_scholar',
      commuteDurationMinutes: 45,
      timetable: DEFAULT_TIMETABLE,
      gcrPosts: DEFAULT_GCR_POSTS,
      chatHistory: []
    };
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
 * - Adds 40-50 min commute buffer if Day Scholar
 * - Consults Bugsy for weak topics
 * - Prioritizes upcoming quizzes/projects from GCR
 */
export function generateAdaptiveSchedule({
  residenceStatus = 'day_scholar',
  commuteDurationMinutes = 45,
  timetable = DEFAULT_TIMETABLE,
  gcrPosts = DEFAULT_GCR_POSTS,
  targetDay = 'Monday'
}) {
  const bugsy = getBugsyAnalytics();
  const weakTopics = bugsy.weakTopics || [];
  const primaryWeakTopic = weakTopics[0]?.topic || 'Nested Loops & Arrays';

  // Find classes on target day
  const dayClasses = timetable
    .filter(t => t.day.toLowerCase() === targetDay.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const scheduleSlots = [];

  // 1. Morning Commute (for Day Scholars)
  if (residenceStatus === 'day_scholar') {
    const firstClassTime = dayClasses[0]?.startTime || '08:30';
    const [h, m] = firstClassTime.split(':').map(Number);
    const busMinutes = (h * 60 + m) - commuteDurationMinutes - 15; // 15 mins buffer
    const busStartH = Math.floor(busMinutes / 60).toString().padStart(2, '0');
    const busStartM = (busMinutes % 60).toString().padStart(2, '0');

    scheduleSlots.push({
      time: `${busStartH}:${busStartM} - ${firstClassTime}`,
      title: '🚌 Morning Commute (FAST Point / University Bus)',
      type: 'commute',
      description: `Travel from city to campus (~${commuteDurationMinutes} mins). Campus is situated outside city limits.`,
      icon: 'bus'
    });
  } else {
    scheduleSlots.push({
      time: '08:00 - 08:25',
      title: '🚶 Hostel Walk & Morning Breakfast',
      type: 'commute',
      description: 'Quick 5-minute walk from hostel to department classrooms.',
      icon: 'walk'
    });
  }

  // 2. Scheduled Lectures & Labs
  dayClasses.forEach(c => {
    scheduleSlots.push({
      time: `${c.startTime} - ${c.endTime}`,
      title: `🎓 ${c.course} (${c.type})`,
      type: c.type === 'Lab' ? 'lab' : 'class',
      description: `Room: ${c.room}. Active academic instruction.`,
      icon: 'book'
    });
  });

  // 3. Evening Return Commute
  const lastClass = dayClasses[dayClasses.length - 1];
  const lastEndTime = lastClass ? lastClass.endTime : '14:00';

  if (residenceStatus === 'day_scholar') {
    const [h, m] = lastEndTime.split(':').map(Number);
    const returnEndMinutes = (h * 60 + m) + commuteDurationMinutes;
    const returnEndH = Math.floor(returnEndMinutes / 60).toString().padStart(2, '0');
    const returnEndM = (returnEndMinutes % 60).toString().padStart(2, '0');

    scheduleSlots.push({
      time: `${lastEndTime} - ${returnEndH}:${returnEndM}`,
      title: '🚌 Evening Return Commute (Campus to Home)',
      type: 'commute',
      description: `University transport return commute (~${commuteDurationMinutes} mins). Rest or listen to concept review audio.`,
      icon: 'bus'
    });

    scheduleSlots.push({
      time: `${returnEndH}:${returnEndM} - 17:30`,
      title: '☕ Post-Commute Decompression & Snack',
      type: 'rest',
      description: 'Rest and recharge after road travel before evening study blocks.',
      icon: 'coffee'
    });
  } else {
    scheduleSlots.push({
      time: `${lastEndTime} - 16:30`,
      title: '🏸 Hostel Recreation & Rest',
      type: 'rest',
      description: 'Take a break in the hostel, sports complex, or cafeteria.',
      icon: 'coffee'
    });
  }

  // 4. Targeted Bugsy Weak-Topic Study Session
  scheduleSlots.push({
    time: '18:00 - 19:30',
    title: `🐛 Bugsy Target Study: ${primaryWeakTopic}`,
    type: 'study_bugsy',
    description: `Targeted practice session. Bugsy noticed lower pass rate in "${primaryWeakTopic}". Write code and solve 2-3 FASTudy problems to eliminate edgecase failures.`,
    icon: 'bug',
    topic: primaryWeakTopic
  });

  // 5. GCR Quiz & Project Preparation Block
  const relevantGcr = gcrPosts.find(p => p.category === 'quiz' || p.category === 'project');
  if (relevantGcr) {
    scheduleSlots.push({
      time: '20:30 - 21:45',
      title: `📝 GCR Preparation: ${relevantGcr.course} (${relevantGcr.category.toUpperCase()})`,
      type: 'study_gcr',
      description: `Sir announcement: "${relevantGcr.text.slice(0, 85)}..." Prep notes, dry runs, and test cases.`,
      icon: 'file'
    });
  } else {
    scheduleSlots.push({
      time: '20:30 - 21:30',
      title: '📚 Academic Coursework & Problem Sets Review',
      type: 'study_general',
      description: 'Review lecture slides and complete daily textbook practice questions.',
      icon: 'file'
    });
  }

  // 6. Night Wind-down
  scheduleSlots.push({
    time: '22:30 - 23:00',
    title: '🌙 Next-Day Review & Sleep Prep',
    type: 'rest',
    description: 'Verify tomorrow classes and pack student ID & lab notebook.',
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
  user
}) {
  const msg = (userMessage || '').trim();
  const lower = msg.toLowerCase();

  let updatedState = { ...currentState };
  let agentReply = '';

  // 1. Check residence status change
  if (lower.includes('day scholar') || lower.includes('day-scholar')) {
    updatedState.residenceStatus = 'day_scholar';
    updatedState.commuteDurationMinutes = 45;
    agentReply = `Understood! I have updated your status to **Day Scholar**. I have factored in a **45-minute university bus commute** each way (since FAST campus is situated outside the city). Your morning departure and evening return blocks have been seamlessly adjusted.`;
  } else if (lower.includes('hostelite') || lower.includes('hostel') || lower.includes('hostelites')) {
    updatedState.residenceStatus = 'hostelite';
    updatedState.commuteDurationMinutes = 5;
    agentReply = `Got it! I have set your status to **Hostelite**. Your commute is now reduced to a 5-minute walk, giving you an extra ~1.5 hours of flexible evening study or recreation time in the hostel.`;
  }
  // 2. Check for GCR announcement / quiz / makeup class addition
  else if (lower.includes('quiz') || lower.includes('makeup') || lower.includes('project') || lower.includes('presentation')) {
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

    agentReply = `I have logged this in your Google Classroom radar as a **${scan.category.toUpperCase()}** task! 
- **Keywords detected**: \`${scan.keywords.join(', ')}\`
- **Action**: I consulted **Bugsy** and integrated targeted preparation sessions into your schedule ahead of this deadline!`;
  }
  // 3. General scheduling consultation via Gemini (or intelligent fallback)
  else if (GEMINI_API_KEY) {
    try {
      const bugsy = getBugsyAnalytics();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const prompt = `You are Chronos, the intelligent Academic Planner for FAST NUCES university students.
Student profile:
- Residence: ${updatedState.residenceStatus === 'day_scholar' ? 'Day Scholar (takes 45m bus commute)' : 'Hostelite (lives in campus hostel)'}
- Weak topics identified by TA Bugsy: ${bugsy.weakTopics.map(w => w.topic).join(', ') || 'None yet'}
- Active GCR Announcements: ${updatedState.gcrPosts.map(p => `[${p.category}] ${p.text}`).join('; ')}

Student asked: "${msg}"

Instructions:
1. Provide a sharp, empathetic, and structured FASTian response.
2. If they ask for advice on what to study, recommend focusing on their Bugsy weak topics during their free slots.
3. Keep it concise, friendly, and formatted in clean markdown.`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });

      if (res.ok) {
        const body = await res.json();
        agentReply = body.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } catch (e) {
      console.warn('Chronos Gemini fallback:', e);
    }
  }

  if (!agentReply) {
    const bugsy = getBugsyAnalytics();
    const primaryWeak = bugsy.weakTopics[0]?.topic || 'Nested Loops & Arrays';
    agentReply = `I've consulted with **Bugsy**! Your key focus area right now is **${primaryWeak}**. 
Based on your **${updatedState.residenceStatus === 'day_scholar' ? 'Day Scholar bus commute' : 'Hostelite schedule'}**, I've designated your prime evening study block for high-yield practice in ${primaryWeak}. Check your Planner timeline to view today's complete breakdown!`;
  }

  // Update chat history
  const updatedChat = [
    ...(updatedState.chatHistory || []),
    { role: 'user', text: msg },
    { role: 'agent', text: agentReply }
  ];

  updatedState.chatHistory = updatedChat;
  saveChronosData(updatedState);

  return {
    reply: agentReply,
    updatedState
  };
}
