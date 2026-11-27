// Section timetable shown in the Planner. Update this file each semester;
// both the grid and the Chronos study-plan generator derive from it.

export const TIMETABLE_META = {
  section: 'BSE-1C',
  department: 'Dept of Software Engineering, FAST-NU',
  term: 'Fall 2026',
  effectiveFrom: 'Sep 14',
};

export const SLOT_STARTS_MIN = [525,555,585,615,645,675,705,735,765,790,825,855,885,910,940,970];
export const SLOT_ENDS_MIN   = [555,585,610,645,675,700,735,765,790,825,855,885,910,940,970,1000];
export const SLOT_LABELS_START = ['8:45','9:15','9:45','10:15','10:45','11:15','11:45','12:15','12:45','1:10','1:45','2:15','2:45','3:10','3:40','4:10'];
export const SLOT_LABELS_END   = ['9:15','9:45','10:10','10:45','11:15','11:40','12:15','12:45','1:10','1:45','2:15','2:45','3:10','3:40','4:10','4:40'];

// Muted, clearly distinct hues (one per course); blocks render as soft tints of these.
export const SUBJECT_COLORS = {
  prog: '#3b6fd8', // indigo  — Programming Fundamentals
  calc: '#0f8a6b', // teal    — Calculus
  ict:  '#7a5af8', // violet  — ICT
  phys: '#c2603a', // terracotta — Applied Physics
  chin: '#b0832a', // ochre   — Chinese
  eng:  '#c0457a', // rose    — English
  ideo: '#5f7085', // slate   — Ideology & Constitution
};

// [startSlot(1-based), span, colorKey, code, name, teacher, room, ?isLab, ?group]
export const TIMETABLE_DATA = [
  { day: 'Mon', cells: [
    [1,3,'prog','CS1002','Programming Fundamentals','Ms. Naba Rahim','Room 1'],
    [4,3,'calc','MT1003','Calculus and Analytical Geometry','Ms. Hadiqa Iqbal','Room 1'],
    [8,2,'ict','Seminar','ICT Seminar','Mr. Umer Zahoor / Ms. Areesha Faisal','Auditorium'],
    [11,6,'prog','CL1002','Programming Fundamentals, Lab','Ms. Areesha Faisal','Lab 10','lab'],
  ]},
  { day: 'Tue', cells: [
    [1,3,'prog','CS1002','Programming Fundamentals','Ms. Naba Rahim','Room 1'],
    [5,2,'chin','SS2033','Chinese Language','Dr. Areeba Sundas','Room 3'],
    [7,4,'ict','CL1000','Introduction to ICT','Mr. Umer Zahoor','Lab 10','lab'],
    [11,3,'phys','NS1001','Applied Physics','Mr. Mohsin Hameed','Room 3'],
    [14,3,'calc','MT1003','Calculus and Analytical Geometry','Ms. Hadiqa Iqbal','Room 3'],
  ]},
  { day: 'Wed', cells: [
    [4,3,'eng','SL1012','Functional English, Lab','Mr. Talha Akbar','Lab 10','lab','Group 2'],
    [9,2,'chin','SS2033','Chinese Language','Dr. Areeba Sundas','Room 3'],
    [14,3,'phys','NS1001','Applied Physics','Mr. Mohsin Hameed','Room 1'],
  ]},
  { day: 'Thu', cells: [
    [4,3,'eng','SL1012','Functional English, Lab','Mr. Talha Akbar','Lab 10','lab','Group 2'],
    [8,2,'ideo','SS1013','Ideology and Constitution of Pakistan','Ms. Shahnaz Parveen','Room 3'],
    [15,2,'eng','SS1012','Functional English','Mr. Khalid Mehmood','Room 2'],
  ]},
  { day: 'Fri', cells: [
    [1,2,'eng','SS1012','Functional English','Mr. Khalid Mehmood','Room 1'],
    [3,2,'ideo','SS1013','Ideology and Constitution of Pakistan','Ms. Shahnaz Parveen','Room 1'],
  ]},
];

export const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri'];
export const WEEKDAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday'];


const DAY_NAMES = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };
const toHHMM = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/** Flattened entries ({ day, startTime, endTime, course, type, room }) for schedule generation. */
export const TIMETABLE_ENTRIES = TIMETABLE_DATA.flatMap((row) =>
  row.cells.map(([startSlot, span, , code, name, teacher, room, extra], i) => ({
    id: `${row.day}_${i}`,
    day: DAY_NAMES[row.day],
    startTime: toHHMM(SLOT_STARTS_MIN[startSlot - 1]),
    endTime: toHHMM(SLOT_ENDS_MIN[startSlot + span - 2]),
    course: name,
    code,
    teacher,
    type: extra === 'lab' ? 'Lab' : 'Lecture',
    room,
  }))
);
