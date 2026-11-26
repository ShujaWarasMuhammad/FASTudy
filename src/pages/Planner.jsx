import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  loadChronosData,
  saveChronosData,
  generateAdaptiveSchedule,
  talkToChronos,
  scanGcrKeywords
} from '../utils/chronos';
import { getBugsyAnalytics } from '../utils/bugsy';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Bus,
  Home,
  BookOpen,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Bot,
  GraduationCap,
  Bell,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function Planner() {
  const { user } = useAuth();
  const [chronosData, setChronosData] = useState(() => loadChronosData());
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'gcr' | 'timetable' | 'chat'
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // New GCR Post Form state
  const [showAddGcr, setShowAddGcr] = useState(false);
  const [newGcrCourse, setNewGcrCourse] = useState('Programming Fundamentals');
  const [newGcrTeacher, setNewGcrTeacher] = useState('Course Instructor');
  const [newGcrText, setNewGcrText] = useState('');
  const [newGcrDate, setNewGcrDate] = useState('Upcoming');

  // Bugsy intelligence
  const bugsyStats = useMemo(() => getBugsyAnalytics(), []);
  const primaryWeakTopic = bugsyStats.weakTopics[0]?.topic || 'Nested Loops & Arrays';

  // Generate today's schedule dynamically
  const dailySchedule = useMemo(() => {
    return generateAdaptiveSchedule({
      residenceStatus: chronosData.residenceStatus,
      commuteDurationMinutes: chronosData.commuteDurationMinutes,
      timetable: chronosData.timetable,
      gcrPosts: chronosData.gcrPosts,
      targetDay: selectedDay
    });
  }, [chronosData, selectedDay]);

  const handleToggleResidence = (status) => {
    const updated = {
      ...chronosData,
      residenceStatus: status,
      commuteDurationMinutes: status === 'day_scholar' ? 45 : 5
    };
    setChronosData(updated);
    saveChronosData(updated);
  };

  const handleAddGcrPost = (e) => {
    e.preventDefault();
    if (!newGcrText.trim()) return;

    const scan = scanGcrKeywords(newGcrText);
    const newPost = {
      id: `gcr_${Date.now()}`,
      course: newGcrCourse,
      teacher: newGcrTeacher,
      text: newGcrText.trim(),
      date: newGcrDate.trim() || 'Upcoming',
      keywords: scan.keywords,
      category: scan.category,
      dueDate: selectedDay
    };

    const updated = {
      ...chronosData,
      gcrPosts: [newPost, ...chronosData.gcrPosts]
    };
    setChronosData(updated);
    saveChronosData(updated);

    setNewGcrText('');
    setShowAddGcr(false);
  };

  const handleDeleteGcrPost = (id) => {
    const updated = {
      ...chronosData,
      gcrPosts: chronosData.gcrPosts.filter(p => p.id !== id)
    };
    setChronosData(updated);
    saveChronosData(updated);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const text = chatInput.trim();
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await talkToChronos({
        userMessage: text,
        currentState: chronosData,
        user
      });
      setChronosData(res.updatedState);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="planner-page-container">
      {/* Hero Header */}
      <div className="planner-hero-card">
        <div className="planner-hero-left">
          <div className="chronos-avatar-badge">⏳</div>
          <div>
            <div className="chronos-title-flex">
              <h1>Chronos AI Academic Planner</h1>
              <span className="chronos-role-pill">FAST Strategist</span>
            </div>
            <p className="chronos-lead">
              Personalized FAST NUCES routine engine: maps your lectures, 3-hour labs, GCR quizzes & makeup classes, and schedules targeted practice for your <strong>Bugsy weak topics</strong>.
            </p>
          </div>
        </div>

        {/* Day Scholar vs Hostelite Switcher */}
        <div className="residence-toggle-card">
          <span className="toggle-label">Residence Status:</span>
          <div className="toggle-button-group">
            <button
              className={`residence-btn ${chronosData.residenceStatus === 'day_scholar' ? 'active' : ''}`}
              onClick={() => handleToggleResidence('day_scholar')}
            >
              <Bus size={14} />
              <span>Day Scholar (45m Commute)</span>
            </button>
            <button
              className={`residence-btn ${chronosData.residenceStatus === 'hostelite' ? 'active' : ''}`}
              onClick={() => handleToggleResidence('hostelite')}
            >
              <Home size={14} />
              <span>Hostelite (5m Walk)</span>
            </button>
          </div>
          <span className="toggle-caption">
            {chronosData.residenceStatus === 'day_scholar'
              ? '🚌 FAST campuses are outside the city: 45m bus transit added morning & evening.'
              : '🚶 Hostel life: Minimal transit, maximizing evening study & lab review time.'}
          </span>
        </div>
      </div>

      {/* Bugsy & Chronos Sync Banner */}
      <div className="chronos-bugsy-sync-banner">
        <div className="sync-banner-content">
          <div className="sync-icons">
            <span className="sync-icon-bugsy">🐛</span>
            <span className="sync-arrow">↔</span>
            <span className="sync-icon-chronos">⏳</span>
          </div>
          <div className="sync-text">
            <strong>Chronos & Bugsy Live Consultation:</strong>
            <span>
              Bugsy flagged <strong>{primaryWeakTopic}</strong> as your primary improvement target ({bugsyStats.weakTopics[0]?.successRate || 40}% pass rate). Chronos has automatically scheduled prioritized practice blocks before your upcoming lab quizzes!
            </span>
          </div>
        </div>
        <Link to="/practice?subject=pf" className="btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
          <span>Practice {primaryWeakTopic}</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Planner Navigation Tabs */}
      <div className="planner-tabs-bar">
        <button
          className={`planner-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={15} />
          <span>Adaptive Study Schedule</span>
        </button>
        <button
          className={`planner-tab-btn ${activeTab === 'gcr' ? 'active' : ''}`}
          onClick={() => setActiveTab('gcr')}
        >
          <Bell size={15} />
          <span>Google Classroom Radar ({chronosData.gcrPosts.length})</span>
        </button>
        <button
          className={`planner-tab-btn ${activeTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveTab('timetable')}
        >
          <GraduationCap size={15} />
          <span>Weekly Timetable ({chronosData.timetable.length} classes)</span>
        </button>
        <button
          className={`planner-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <Bot size={15} />
          <span>Chat with Chronos</span>
        </button>
      </div>

      {/* TAB 1: ADAPTIVE STUDY SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="planner-schedule-view">
          {/* Weekday Selector */}
          <div className="weekdays-nav-strip">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                className={`weekday-btn ${selectedDay === day ? 'active' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Timeline Cards */}
          <div className="schedule-timeline">
            {dailySchedule.map((slot, index) => (
              <div key={index} className={`timeline-slot slot-${slot.type}`}>
                <div className="timeline-time-col">
                  <Clock size={14} />
                  <span>{slot.time}</span>
                </div>
                <div className="timeline-content-card">
                  <div className="slot-title-row">
                    <h4>{slot.title}</h4>
                    <span className={`slot-tag tag-${slot.type}`}>{slot.type.replace('_', ' ')}</span>
                  </div>
                  <p className="slot-desc">{slot.description}</p>
                  {slot.topic && (
                    <div className="slot-action-row">
                      <Link to="/practice?subject=pf" className="btn-secondary btn-xs">
                        Open {slot.topic} in FASTudy Arena
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE CLASSROOM RADAR */}
      {activeTab === 'gcr' && (
        <div className="planner-gcr-view">
          <div className="gcr-header-strip">
            <div>
              <h3>Google Classroom Stream & Keyword Scanner</h3>
              <p>Chronos continuously extracts announcements mentioning <strong>quizzes</strong>, <strong>makeup classes</strong>, <strong>projects</strong>, and <strong>presentations</strong>.</p>
            </div>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowAddGcr(!showAddGcr)}
            >
              <Plus size={14} />
              <span>{showAddGcr ? 'Cancel' : 'Add GCR Post'}</span>
            </button>
          </div>

          {showAddGcr && (
            <form className="add-gcr-form" onSubmit={handleAddGcrPost}>
              <div className="form-row-2">
                <div>
                  <label>Course</label>
                  <input
                    type="text"
                    value={newGcrCourse}
                    onChange={(e) => setNewGcrCourse(e.target.value)}
                    placeholder="e.g. Programming Fundamentals"
                    required
                  />
                </div>
                <div>
                  <label>Teacher / Instructor</label>
                  <input
                    type="text"
                    value={newGcrTeacher}
                    onChange={(e) => setNewGcrTeacher(e.target.value)}
                    placeholder="e.g. Dr. Zulfiqar Ali"
                  />
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <label>Announcement / Post Text (paste from GCR)</label>
                <textarea
                  rows={3}
                  value={newGcrText}
                  onChange={(e) => setNewGcrText(e.target.value)}
                  placeholder="e.g. Quiz 3 on 1D Arrays will be conducted on Tuesday during the first 30 minutes of lab..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="btn-primary">
                  Scan & Add Announcement
                </button>
              </div>
            </form>
          )}

          <div className="gcr-posts-grid">
            {chronosData.gcrPosts.map((post) => (
              <div key={post.id} className={`gcr-card card-${post.category}`}>
                <div className="gcr-card-header">
                  <div className="gcr-course-info">
                    <span className="gcr-course">{post.course}</span>
                    <span className="gcr-teacher">{post.teacher}</span>
                  </div>
                  <div className="gcr-actions">
                    <span className={`gcr-category-pill pill-${post.category}`}>
                      {post.category.toUpperCase()}
                    </span>
                    <button
                      className="btn-icon-subtle"
                      onClick={() => handleDeleteGcrPost(post.id)}
                      title="Remove announcement"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="gcr-text">{post.text}</p>

                <div className="gcr-footer">
                  <div className="gcr-keywords-list">
                    {post.keywords.map((kw, i) => (
                      <span key={i} className="gcr-keyword-tag">#{kw}</span>
                    ))}
                  </div>
                  <span className="gcr-due-date">{post.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WEEKLY TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="planner-timetable-view">
          <div className="timetable-header">
            <h3>FAST NUCES Weekly Timetable</h3>
            <p>Your official schedule of 1.5-hour lectures and 3-hour lab sessions.</p>
          </div>

          <div className="timetable-grid">
            {WEEKDAYS.map((day) => {
              const classesOnDay = chronosData.timetable
                .filter(t => t.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div key={day} className="timetable-day-col">
                  <div className="day-col-header">{day}</div>
                  <div className="day-classes-list">
                    {classesOnDay.length === 0 ? (
                      <div className="no-class-box">No classes scheduled</div>
                    ) : (
                      classesOnDay.map((c) => (
                        <div key={c.id} className={`class-slot-card type-${c.type.toLowerCase()}`}>
                          <div className="class-time">{c.startTime} - {c.endTime}</div>
                          <div className="class-course">{c.course}</div>
                          <div className="class-meta">
                            <span>{c.type}</span>
                            <span>Room: {c.room}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CHAT WITH CHRONOS */}
      {activeTab === 'chat' && (
        <div className="planner-chat-view">
          <div className="chat-messages-scroll">
            {chronosData.chatHistory.map((msg, idx) => (
              <div key={idx} className={`chronos-chat-msg ${msg.role === 'user' ? 'msg-user' : 'msg-agent'}`}>
                {msg.role === 'agent' && <div className="chat-avatar">⏳</div>}
                <div className="chat-bubble">
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            {isChatSending && (
              <div className="chronos-chat-msg msg-agent">
                <div className="chat-avatar">⏳</div>
                <div className="chat-bubble">
                  <p>Chronos is analyzing your schedule and consulting Bugsy...</p>
                </div>
              </div>
            )}
          </div>

          <form className="chat-input-row" onSubmit={handleSendChat}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tell Chronos: 'Add a quiz in PF for next Tuesday', 'I am a hostelite', etc..."
              disabled={isChatSending}
            />
            <button type="submit" className="btn-primary" disabled={!chatInput.trim() || isChatSending}>
              <Send size={15} />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
