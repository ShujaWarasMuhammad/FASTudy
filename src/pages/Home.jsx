import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Search, X } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useQuestions } from '../context/QuestionsContext';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, COURSE_COLORS } from '../config/navigation';

const CHECKLIST_KEY = 'fastudy_onboarding_dismissed_v1';
const CHRONOS_KEY = 'fastudy_chronos_data_v1';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Animates a number from 0 to `value` once on mount/change. */
function useCountUp(value, duration = 700) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    let raf; const start = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return shown;
}

function Stat({ label, value, suffix, hint }) {
  const n = useCountUp(value);
  return (
    <div className="dash-stat" data-tip={hint}>
      <dt>{label}</dt>
      <dd>{n}<span>{suffix}</span></dd>
    </div>
  );
}

function Ring({ pct, color }) {
  const r = 20, c = 2 * Math.PI * r;
  return (
    <svg className="dash-ring" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r={r} className="dash-ring-track" />
      <circle cx="24" cy="24" r={r} className="dash-ring-fill" stroke={color}
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      <text x="24" y="24" dominantBaseline="central" textAnchor="middle">{pct}%</text>
    </svg>
  );
}

export default function Home() {
  const { solvedQuestions, sessionStats, profile, submissionHistory, bookmarks } = useProfile();
  const { subjects, questions } = useQuestions();
  const { isAuthenticated } = useAuth();
  const [hideChecklist, setHideChecklist] = useState(() => {
    try { return localStorage.getItem(CHECKLIST_KEY) === '1'; } catch { return false; }
  });

  const solvedSet = useMemo(() => new Set(solvedQuestions), [solvedQuestions]);
  const courses = useMemo(
    () =>
      subjects.map((subject) => {
        const subjectQs = questions.filter((q) => q.subjectId === subject.id);
        const solved = subjectQs.filter((q) => solvedSet.has(q.id)).length;
        return {
          subject,
          total: subjectQs.length,
          solved,
          topics: subject.categories.reduce((n, c) => n + c.subcategories.length, 0),
          percentage: subjectQs.length ? Math.round((solved / subjectQs.length) * 100) : 0,
          next: subjectQs.find((q) => !solvedSet.has(q.id)),
        };
      }),
    [subjects, questions, solvedSet]
  );

  // Resume in the course of the most recent attempt; fall back to the first unfinished course.
  const lastSubjectId = questions.find((q) => q.id === submissionHistory[0]?.questionId)?.subjectId;
  const resume = courses.find((c) => c.next && c.subject.id === lastSubjectId) || courses.find((c) => c.next);
  const name = isAuthenticated ? (profile.full_name || profile.username || '').split(' ')[0] : '';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  const plannerSetUp = (() => { try { return Boolean(localStorage.getItem(CHRONOS_KEY)); } catch { return false; } })();
  const steps = [
    { done: solvedQuestions.length > 0, label: 'Solve your first problem', to: resume ? `/question/${resume.next.id}` : '/practice' },
    { done: bookmarks.length > 0, label: 'Bookmark a problem to revisit', to: '/practice' },
    { done: plannerSetUp, label: 'Set your residence in the Planner', to: '/planner' },
    { done: isAuthenticated, label: 'Sign in to sync progress', to: '/profile' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const showChecklist = !hideChecklist && doneCount < steps.length;

  const dismissChecklist = () => {
    setHideChecklist(true);
    try { localStorage.setItem(CHECKLIST_KEY, '1'); } catch { /* ignore */ }
  };
  const openSearch = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));

  return (
    <div className="page-container dash">
      <header className="dash-head reveal">
        <div className="dash-head-top">
          <div>
            <p className="dash-date">{today}</p>
            <h1 className="dash-title">{greeting()}{name ? `, ${name}` : ''}.</h1>
          </div>
          <button type="button" className="dash-search" onClick={openSearch}>
            <Search size={15} />
            <span>Find a page, topic or problem</span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>
        <dl className="dash-stats">
          <Stat label="Problems solved" value={solvedQuestions.length} suffix={` / ${questions.length}`} hint="Problems you've answered correctly" />
          <Stat label="Current streak" value={sessionStats.currentStreak} suffix={sessionStats.currentStreak === 1 ? ' day' : ' days'} hint="Consecutive days with at least one attempt" />
          <Stat label="Level" value={sessionStats.level} suffix={` · ${sessionStats.xp} XP`} hint="75 XP per solve, 25 XP per streak day" />
          <div className="dash-stat dash-stat-level" data-tip={`${sessionStats.levelProgress}% of the way to level ${sessionStats.level + 1}`}>
            <dt>Progress to level {sessionStats.level + 1}<b className="dash-level-pct">{sessionStats.levelProgress}%</b></dt>
            <dd className="dash-level-track"><span style={{ width: `${sessionStats.levelProgress}%` }} /></dd>
          </div>
        </dl>
      </header>

      <div className="dash-grid">
        <div className="dash-main">
          {resume && (
            <Link to={`/question/${resume.next.id}`} className="dash-resume reveal" style={{ '--c': COURSE_COLORS[resume.subject.id] }}>
              <div>
                <span className="dash-label"><i className="dash-dot" /> Up next · {resume.subject.name}</span>
                <span className="dash-resume-title">{resume.next.title}</span>
                <span className="dash-resume-meta">{resume.next.difficulty} · {resume.solved} of {resume.total} done in this course</span>
              </div>
              <span className="dash-resume-cta">Continue <ArrowRight size={15} /></span>
            </Link>
          )}

          <section aria-labelledby="courses-heading" className="reveal">
            <div className="dash-section-head">
              <div>
                <h2 id="courses-heading">Your courses</h2>
              </div>
              <Link to="/practice" className="text-action">All courses <ArrowRight size={14} /></Link>
            </div>
            <ul className="dash-course-list">
              {courses.map(({ subject, total, solved, percentage }) => (
                <li key={subject.id}>
                  <Link to={`/practice/${subject.id}`} className="dash-course" style={{ '--c': COURSE_COLORS[subject.id] }}>
                    <Ring pct={percentage} color={COURSE_COLORS[subject.id] || 'var(--accent)'} />
                    <span className="dash-course-main">
                      <span className="dash-course-name">{subject.name} <span className="dash-course-code">{subject.shortName}</span></span>
                    </span>
                    <span className="dash-course-meta">
                      <strong>{solved}/{total}</strong>
                    </span>
                    <ArrowRight size={16} className="dash-course-arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="dash-side">
          {showChecklist && (
            <section className="dash-card reveal" aria-labelledby="start-heading">
              <div className="dash-card-head">
                <h2 id="start-heading">Getting started</h2>
                <button type="button" className="dash-icon-btn" onClick={dismissChecklist} aria-label="Hide checklist"><X size={14} /></button>
              </div>
              <div className="dash-checklist-bar"><span style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
              <p className="dash-card-sub">{doneCount} of {steps.length} complete</p>
              <ul className="dash-checklist">
                {steps.map((s) => (
                  <li key={s.label}>
                    <Link to={s.to} className={s.done ? 'done' : ''}>
                      <span className="dash-check">{s.done && <Check size={11} strokeWidth={3} />}</span>
                      <span>{s.label}</span>
                      {!s.done && <ArrowRight size={13} className="dash-check-go" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="dash-card reveal" aria-labelledby="map-heading">
            <div className="dash-card-head">
              <h2 id="map-heading">Where everything is</h2>
            </div>
            <ul className="dash-map">
              {NAV_ITEMS.filter((n) => n.to !== '/').map(({ to, label, icon: Icon, hint }) => (
                <li key={to}>
                  <Link to={to} className="dash-map-item" title={hint}>
                    <span className="dash-map-icon"><Icon size={16} /></span>
                    <span className="dash-map-label">{label}</span>
                    <ArrowRight size={14} className="dash-map-go" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="dash-card-foot">Tip: press <kbd>/</kbd> or <kbd>Ctrl</kbd><kbd>K</kbd> anywhere to search. On a problem, use <b>Ask AI</b> for hints and <b>Bugsy</b> for code review.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
