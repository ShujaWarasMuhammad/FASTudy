import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  loadChronosData,
  saveChronosData,
  generateAdaptiveSchedule,
  talkToChronos,
  scanGcrKeywords,
} from '../utils/chronos';
import { getBugsyAnalytics } from '../utils/bugsy';
import { useAuth } from '../context/AuthContext';
import {
  Bus, Home, Send, Bot, Bell, Plus, Trash2, Clock, Calendar, GraduationCap,
} from 'lucide-react';

// ─── BSE-1C timetable data (matches the uploaded HTML exactly) ───────────────
const SLOT_STARTS_MIN = [525,555,585,615,645,675,705,735,765,790,825,855,885,910,940,970];
const SLOT_ENDS_MIN   = [555,585,610,645,675,700,735,765,790,825,855,885,910,940,970,1000];
const SLOT_LABELS_START = ['8:45','9:15','9:45','10:15','10:45','11:15','11:45','12:15','12:45','1:10','1:45','2:15','2:45','3:10','3:40','4:10'];
const SLOT_LABELS_END   = ['9:15','9:45','10:10','10:45','11:15','11:40','12:15','12:45','1:10','1:45','2:15','2:45','3:10','3:40','4:10','4:40'];

const SUBJECT_COLORS = {
  prog:  '#3b9be0',
  calc:  '#4fb3cf',
  ict:   '#7f8fe6',
  phys:  '#2a6fb8',
  chin:  '#5cc4b5',
  eng:   '#7fb4ee',
  ideo:  '#9fb3d1',
};

// [startSlot(1-based), span, colorKey, code, name, teacher, room, ?isLab, ?group]
const TIMETABLE_DATA = [
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

const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri'];
const WEEKDAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

function fmt24(totalMins) {
  return `${String(Math.floor(totalMins/60)).padStart(2,'0')}:${String(totalMins%60).padStart(2,'0')}`;
}
function fmtAMPM(totalMins) {
  const h = Math.floor(totalMins/60), m = totalMins%60;
  return `${((h+11)%12+1)}:${String(m).padStart(2,'0')} ${h<12?'am':'pm'}`;
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 10000); return () => clearInterval(id); }, []);
  return now;
}

// ─── Faithful timetable grid replica ─────────────────────────────────────────
function TimetableGrid({ gcrPosts }) {
  const now     = useClock();
  const [is24, setIs24] = useState(true);
  const dow     = now.getDay();
  const nowMins = now.getHours()*60 + now.getMinutes();

  const activeSlotIdx = SLOT_STARTS_MIN.findIndex((s,i) => nowMins >= s && nowMins < SLOT_ENDS_MIN[i]);

  let nowLinePos = -1;
  if (dow >= 1 && dow <= 5 && nowMins >= SLOT_STARTS_MIN[0] && nowMins <= SLOT_ENDS_MIN[15]) {
    for (let i = 0; i < 16; i++) {
      if (nowMins >= SLOT_STARTS_MIN[i] && nowMins < SLOT_ENDS_MIN[i]) {
        nowLinePos = i + (nowMins - SLOT_STARTS_MIN[i]) / (SLOT_ENDS_MIN[i] - SLOT_STARTS_MIN[i]);
        break;
      }
      if (i < 15 && nowMins >= SLOT_ENDS_MIN[i] && nowMins < SLOT_STARTS_MIN[i+1]) { nowLinePos = i+1; break; }
    }
  }

  let statusText = '';
  if (dow < 1 || dow > 5) {
    statusText = 'No classes today';
  } else {
    const todayData = TIMETABLE_DATA[dow-1];
    let cur = null, next = null;
    if (todayData) {
      todayData.cells.forEach(c => {
        const st = SLOT_STARTS_MIN[c[0]-1];
        const en = SLOT_ENDS_MIN[c[0]+c[1]-2];
        if (nowMins >= st && nowMins < en) cur = c;
        else if (st > nowMins && (!next || st < SLOT_STARTS_MIN[next[0]-1])) next = c;
      });
    }
    const f = is24 ? fmt24 : fmtAMPM;
    if (cur) statusText = `Now: ${cur[4]}, until ${f(SLOT_ENDS_MIN[cur[0]+cur[1]-2])}`;
    else if (next) statusText = `Next: ${next[4]} at ${f(SLOT_STARTS_MIN[next[0]-1])}`;
    else if (nowMins < SLOT_STARTS_MIN[0]) statusText = `Classes start at ${f(SLOT_STARTS_MIN[0])}`;
    else statusText = 'Done for today ✓';
  }

  // GCR badges per day
  const gcrBadges = {};
  gcrPosts.forEach(p => {
    const idx = WEEKDAYS.indexOf(p.dueDate);
    if (idx < 0) return;
    const key = DAYS_SHORT[idx];
    (gcrBadges[key] = gcrBadges[key] || []).push(p);
  });

  return (
    <div className="tt-wrap">
      {/* Header */}
      <div className="tt-head">
        <div className="tt-head-left">
          <div className="tt-title">BSE-1C</div>
          <div className="tt-subtitle">Dept of Software Engineering, FAST-NU · Fall 2026 · effective Sep 14</div>
        </div>
        <div className="tt-head-right">
          <div className="tt-clock" onClick={() => setIs24(v => !v)} title="Click to toggle 12/24h">
            {is24
              ? `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
              : fmtAMPM(now.getHours()*60+now.getMinutes())}
          </div>
          <div className="tt-status-text">{statusText}</div>
        </div>
      </div>

      {/* Time slot header */}
      <div className="tt-timebar">
        <div className="tt-timebar-spacer" />
        {SLOT_LABELS_START.map((s, i) => (
          <div key={i} className={`tt-timeslot${activeSlotIdx===i && dow>=1&&dow<=5?' tt-timeslot-active':''}`}>
            <b>{is24 ? s : fmtAMPM(SLOT_STARTS_MIN[i])}</b>
            <small>to {is24 ? SLOT_LABELS_END[i] : fmtAMPM(SLOT_ENDS_MIN[i])}</small>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="tt-body" style={{ position:'relative' }}>
        {nowLinePos >= 0 && (
          <div className="tt-nowline" style={{ left:`calc(var(--tt-dw) + (100% - var(--tt-dw)) * ${nowLinePos/16})` }} />
        )}
        {TIMETABLE_DATA.map((row, di) => {
          const isToday = dow === di+1;
          const badges  = gcrBadges[row.day] || [];
          return (
            <div key={row.day} className={`tt-row${isToday?' tt-row-today':''}`}>
              <div className="tt-day-col">
                <span className="tt-day-name">{row.day}</span>
                {badges.map((b,bi) => (
                  <span key={bi} className="tt-gcr-dot" title={`${b.category.toUpperCase()}: ${b.text.slice(0,60)}…`}>
                    {b.category==='quiz'?'📝':b.category==='makeup'?'📌':b.category==='project'?'🗂':'📣'}
                  </span>
                ))}
              </div>
              <div className="tt-row-cells">
                {row.cells.map((c, ci) => {
                  const [startSlot, span, colorKey, code, name, teacher, room, extra, group] = c;
                  const bg = SUBJECT_COLORS[colorKey] || '#888';
                  const isActive = isToday && activeSlotIdx >= startSlot-1 && activeSlotIdx < startSlot-1+span;
                  return (
                    <div
                      key={ci}
                      className={`tt-cell${isActive?' tt-cell-on':''}`}
                      style={{ gridColumn:`${startSlot}/span ${span}`, '--cell-color': bg }}
                      title={`${name}${group?` (${group})`:''} · ${teacher} · ${room}`}
                    >
                      <div className="tt-cell-name">{name}{group?` (${group})`:''}</div>
                      <div className="tt-cell-info">{teacher} / {room}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="tt-legend-bar">
        {Object.entries({ prog:'PF', calc:'Calculus', ict:'ICT', phys:'Physics', chin:'Chinese', eng:'English', ideo:'Ideology' }).map(([k,v]) => (
          <span key={k} className="tt-legend-item">
            <span className="tt-legend-dot" style={{ background: SUBJECT_COLORS[k] }} />
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Planner() {
  const { user } = useAuth();
  const [chronosData, setChronosData] = useState(() => loadChronosData());
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return WEEKDAYS[Math.min(4, Math.max(0, d-1))];
  });
  const [activeTab, setActiveTab] = useState('timetable');
  const [chatInput, setChatInput]   = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [showAddGcr, setShowAddGcr] = useState(false);
  const [newGcrCourse,  setNewGcrCourse]  = useState('Programming Fundamentals');
  const [newGcrTeacher, setNewGcrTeacher] = useState('Course Instructor');
  const [newGcrText,    setNewGcrText]    = useState('');
  const [newGcrDate,    setNewGcrDate]    = useState('Upcoming');
  const chatEndRef = useRef(null);

  const bugsyStats       = useMemo(() => getBugsyAnalytics(), []);
  const primaryWeakTopic = bugsyStats.weakTopics[0]?.topic || 'Nested Loops & Arrays';

  const dailySchedule = useMemo(() =>
    generateAdaptiveSchedule({
      residenceStatus: chronosData.residenceStatus,
      commuteDurationMinutes: chronosData.commuteDurationMinutes,
      timetable: chronosData.timetable,
      gcrPosts: chronosData.gcrPosts,
      targetDay: selectedDay,
    }),
  [chronosData, selectedDay]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chronosData.chatHistory, isChatSending]);

  const saveAndSet = updated => { setChronosData(updated); saveChronosData(updated); };

  const handleToggleResidence = status =>
    saveAndSet({ ...chronosData, residenceStatus: status, commuteDurationMinutes: status==='day_scholar'?45:5 });

  const handleAddGcrPost = e => {
    e.preventDefault();
    if (!newGcrText.trim()) return;
    const scan = scanGcrKeywords(newGcrText);
    saveAndSet({ ...chronosData, gcrPosts: [{ id:`gcr_${Date.now()}`, course:newGcrCourse, teacher:newGcrTeacher, text:newGcrText.trim(), date:newGcrDate||'Upcoming', keywords:scan.keywords, category:scan.category, dueDate:selectedDay }, ...chronosData.gcrPosts] });
    setNewGcrText(''); setShowAddGcr(false);
  };

  const handleDeleteGcrPost = id =>
    saveAndSet({ ...chronosData, gcrPosts: chronosData.gcrPosts.filter(p => p.id!==id) });

  const handleSendChat = async e => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;
    const text = chatInput.trim();
    setChatInput(''); setIsChatSending(true);
    try {
      const res = await talkToChronos({ userMessage:text, currentState:chronosData, user });
      setChronosData(res.updatedState);
    } finally { setIsChatSending(false); }
  };

  const CAT_COLOR = { quiz:'#e97a3b', makeup:'#9b59b6', project:'#2ecc71', presentation:'#e67e22', assignment:'#3498db', general:'#888' };

  return (
    <div className="planner-page">

      {/* ── Topbar ── */}
      <div className="planner-topbar">
        <div className="planner-topbar-brand">
          <span className="planner-logo">⏳</span>
          <div>
            <div className="planner-title">Chronos</div>
            <div className="planner-subtitle">AI Academic Planner · FAST NUCES BSE-1C</div>
          </div>
        </div>

        <div className="planner-residence-group">
          <span className="planner-res-label">Residence:</span>
          <div className="planner-res-btns">
            <button className={`planner-res-btn${chronosData.residenceStatus==='day_scholar'?' active':''}`} onClick={() => handleToggleResidence('day_scholar')}>
              <Bus size={12} /> Day Scholar
            </button>
            <button className={`planner-res-btn${chronosData.residenceStatus==='hostelite'?' active':''}`} onClick={() => handleToggleResidence('hostelite')}>
              <Home size={12} /> Hostelite
            </button>
          </div>
        </div>

        <div className="planner-bugsy-strip">
          🐛 Bugsy focus: <strong>{primaryWeakTopic}</strong>
          <Link to="/practice?subject=pf" className="planner-practice-link">Practice →</Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="planner-tabbar">
        {[
          { key:'timetable', icon:<GraduationCap size={14}/>, label:'Timetable' },
          { key:'schedule',  icon:<Calendar size={14}/>,      label:'Study Plan' },
          { key:'gcr',       icon:<Bell size={14}/>,           label:`GCR Radar (${chronosData.gcrPosts.length})` },
          { key:'chat',      icon:<Bot size={14}/>,            label:'Chat Chronos' },
        ].map(t => (
          <button key={t.key} className={`planner-tabbar-btn${activeTab===t.key?' active':''}`} onClick={() => setActiveTab(t.key)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══ TIMETABLE ══ */}
      {activeTab === 'timetable' && (
        <div className="planner-timetable-panel">
          <TimetableGrid gcrPosts={chronosData.gcrPosts} />
        </div>
      )}

      {/* ══ STUDY PLAN ══ */}
      {activeTab === 'schedule' && (
        <div className="planner-schedule-panel">
          <div className="plan-day-nav">
            {WEEKDAYS.map(d => (
              <button key={d} className={`plan-day-pill${selectedDay===d?' active':''}`} onClick={() => setSelectedDay(d)}>
                {d.slice(0,3)}
              </button>
            ))}
          </div>
          <div className="plan-timeline-list">
            {dailySchedule.map((slot,i) => (
              <div key={i} className={`plan-slot plan-slot-${slot.type}`}>
                <div className="plan-slot-time"><Clock size={11} /><span>{slot.time}</span></div>
                <div className="plan-slot-content">
                  <div className="plan-slot-title">{slot.title}</div>
                  <div className="plan-slot-desc">{slot.description}</div>
                  {slot.topic && <Link to="/practice?subject=pf" className="plan-slot-link">Open in FASTudy →</Link>}
                </div>
              </div>
            ))}
          </div>
          <div className="plan-commute-note">
            {chronosData.residenceStatus==='day_scholar'
              ? '🚌 Day Scholar: 45 min university bus commute each way. Campus is located outside city limits.'
              : '🚶 Hostelite: 5 min walk, maximising your evening free & study blocks.'}
          </div>
        </div>
      )}

      {/* ══ GCR RADAR ══ */}
      {activeTab === 'gcr' && (
        <div className="planner-gcr-panel">
          <div className="gcr-panel-head">
            <div>
              <h3>Google Classroom Radar</h3>
              <p>Paste GCR announcements here. Chronos detects quizzes, makeup classes, projects & presentations.</p>
            </div>
            <button className="btn-primary btn-sm" onClick={() => setShowAddGcr(v => !v)}>
              <Plus size={13}/><span>{showAddGcr?'Cancel':'Add Announcement'}</span>
            </button>
          </div>

          {showAddGcr && (
            <form className="gcr-add-form" onSubmit={handleAddGcrPost}>
              <div className="gcr-form-row">
                <div className="gcr-field">
                  <label>Course</label>
                  <input value={newGcrCourse} onChange={e=>setNewGcrCourse(e.target.value)} placeholder="e.g. Programming Fundamentals" required/>
                </div>
                <div className="gcr-field">
                  <label>Instructor</label>
                  <input value={newGcrTeacher} onChange={e=>setNewGcrTeacher(e.target.value)} placeholder="e.g. Ms. Naba Rahim"/>
                </div>
                <div className="gcr-field">
                  <label>Date</label>
                  <input value={newGcrDate} onChange={e=>setNewGcrDate(e.target.value)} placeholder="e.g. Tuesday, Nov 28"/>
                </div>
              </div>
              <div className="gcr-field" style={{marginTop:10}}>
                <label>Announcement text (paste from GCR)</label>
                <textarea rows={3} value={newGcrText} onChange={e=>setNewGcrText(e.target.value)}
                  placeholder="Quiz 3 on 1D Arrays will be held at the start of tomorrow's lab session..." required/>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
                <button type="submit" className="btn-primary">Scan & Add</button>
              </div>
            </form>
          )}

          <div className="gcr-posts">
            {chronosData.gcrPosts.length===0 && <div className="gcr-empty-msg">No announcements yet. Add one above!</div>}
            {chronosData.gcrPosts.map(post => (
              <div key={post.id} className="gcr-card" style={{'--gcr-accent': CAT_COLOR[post.category]||'#888'}}>
                <div className="gcr-card-stripe"/>
                <div className="gcr-card-body">
                  <div className="gcr-card-top">
                    <span className="gcr-card-course">{post.course}</span>
                    <span className="gcr-card-teacher">{post.teacher}</span>
                    <span className="gcr-cat-pill" style={{background:CAT_COLOR[post.category]||'#888'}}>{post.category.toUpperCase()}</span>
                    <button className="gcr-del-btn" onClick={()=>handleDeleteGcrPost(post.id)} title="Remove"><Trash2 size={12}/></button>
                  </div>
                  <p className="gcr-card-text">{post.text}</p>
                  <div className="gcr-card-foot">
                    <div className="gcr-kws">{post.keywords.map((kw,i)=><span key={i} className="gcr-kw">#{kw}</span>)}</div>
                    <span className="gcr-card-date">{post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ CHAT ══ */}
      {activeTab === 'chat' && (
        <div className="planner-chat-panel">
          <div className="chat-msgs">
            {chronosData.chatHistory.map((msg,idx) => (
              <div key={idx} className={`chat-row ${msg.role==='user'?'chat-user':'chat-agent'}`}>
                {msg.role==='agent' && <div className="chat-ava">⏳</div>}
                <div className="chat-bbl">{msg.text}</div>
              </div>
            ))}
            {isChatSending && (
              <div className="chat-row chat-agent">
                <div className="chat-ava">⏳</div>
                <div className="chat-bbl chat-bbl-thinking">Chronos is consulting Bugsy…</div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>
          <form className="chat-bar" onSubmit={handleSendChat}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
              placeholder='Try: "Add PF quiz for Tuesday", "I am a hostelite", "What should I study today?"'
              disabled={isChatSending}/>
            <button type="submit" className="btn-primary" disabled={!chatInput.trim()||isChatSending}>
              <Send size={14}/><span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
