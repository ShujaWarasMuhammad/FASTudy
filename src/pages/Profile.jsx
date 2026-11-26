import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth, getOAuthUserDetails } from '../context/AuthContext';
import { useQuestions } from '../context/QuestionsContext';
import ActivityHeatmap from '../components/ActivityHeatmap';
import AuthModal from '../components/AuthModal';
import {
  Flame,
  Award,
  CheckCircle,
  Save,
  Trash2,
  Edit2,
  CalendarDays,
  Target,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  Building,
  History,
  TrendingUp,
  BookOpen,
  RefreshCw,
  CloudOff,
  Sparkles,
  LogIn,
  Camera,
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Fastian_Dev',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ByteNinja',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PointersKing',
  'https://api.dicebear.com/7.x/bottts/svg?seed=BitwiseMaster',
  'https://api.dicebear.com/7.x/bottts/svg?seed=FastStudent',
];

const FAST_CAMPUSES = [
  'Islamabad Campus',
  'Lahore Campus',
  'Karachi Campus',
  'Peshawar Campus',
  'CFD Campus (Chiniot-Faisalabad)',
];

export default function Profile() {
  const {
    profile,
    updateProfile,
    submissions,
    solvedQuestions,
    bookmarks,
    toggleBookmark,
    sessionStats,
    submissionHistory,
    syncStatus,
    lastSyncedAt,
    syncNotice,
    syncNow,
  } = useProfile();

  const { user, isGuest } = useAuth();
  const { questions } = useQuestions();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bookmarks' | 'history'
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'correct' | 'incorrect'
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncingManual, setIsSyncingManual] = useState(false);

  const oAuthDetails = useMemo(() => getOAuthUserDetails(user), [user]);

  const [formData, setFormData] = useState({
    username: profile.username || 'Fastian',
    full_name: profile.full_name || '',
    title: profile.title || 'BS Computer Science',
    campus: profile.campus || 'Islamabad Campus',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || AVATAR_PRESETS[0],
  });
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync formData with profile when starting to edit
  const handleStartEdit = () => {
    setFormData({
      username: profile.username,
      full_name: profile.full_name || '',
      title: profile.title || 'BS Computer Science',
      campus: profile.campus || 'Islamabad Campus',
      bio: profile.bio || '',
      avatar_url: profile.avatar_url,
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    try {
      await syncNow();
    } finally {
      setTimeout(() => setIsSyncingManual(false), 600);
    }
  };

  // Calculations for progress and breakdown
  const stats = useMemo(() => {
    const totalQuestionsCount = questions.length || 1;
    const totalSolvesCount = solvedQuestions.length;

    // By Subject
    const pfTotal = questions.filter((q) => q.subjectId === 'pf').length || 1;
    const pfSolved = solvedQuestions.filter((id) => questions.find((q) => q.id === id)?.subjectId === 'pf').length;

    const calcTotal = questions.filter((q) => q.subjectId === 'calculus').length || 1;
    const calcSolved = solvedQuestions.filter((id) => questions.find((q) => q.id === id)?.subjectId === 'calculus').length;

    const phyTotal = questions.filter((q) => q.subjectId === 'physics').length || 1;
    const phySolved = solvedQuestions.filter((id) => questions.find((q) => q.id === id)?.subjectId === 'physics').length;

    // By Difficulty
    const easyTotal = questions.filter((q) => q.difficulty === 'easy').length || 1;
    const easySolved = solvedQuestions.filter((id) => questions.find((q) => q.id === id)?.difficulty === 'easy').length;

    const medTotal = questions.filter((q) => q.difficulty === 'medium').length || 1;
    const medSolved = solvedQuestions.filter((id) => questions.find((q) => q.id === id)?.difficulty === 'medium').length;

    const hardTotal = questions.filter((q) => q.difficulty === 'hard').length || 1;
    const hardSolved = solvedQuestions.filter((id) => questions.find((q) => q.id === id)?.difficulty === 'hard').length;

    const activeDays = Object.values(submissions).filter((count) => count > 0).length;

    return {
      totalQuestionsCount,
      totalSolvesCount,
      pf: { solved: pfSolved, total: pfTotal, pct: Math.round((pfSolved / pfTotal) * 100) },
      calc: { solved: calcSolved, total: calcTotal, pct: Math.round((calcSolved / calcTotal) * 100) },
      phy: { solved: phySolved, total: phyTotal, pct: Math.round((phySolved / phyTotal) * 100) },
      easy: { solved: easySolved, total: easyTotal },
      med: { solved: medSolved, total: medTotal },
      hard: { solved: hardSolved, total: hardTotal },
      activeDays,
    };
  }, [questions, solvedQuestions, submissions]);

  // Bookmarked questions details
  const bookmarkedQuestions = useMemo(() => {
    return bookmarks
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean);
  }, [bookmarks, questions]);

  // Filtered submission history
  const filteredHistory = useMemo(() => {
    if (historyFilter === 'correct') return submissionHistory.filter((s) => s.isCorrect);
    if (historyFilter === 'incorrect') return submissionHistory.filter((s) => !s.isCorrect);
    return submissionHistory;
  }, [submissionHistory, historyFilter]);

  const weeklyGoal = 5;
  const weekProgress = Math.min(sessionStats.currentStreak, weeklyGoal);

  // Determine provider display badge
  const provider = oAuthDetails?.provider || 'none';
  const isCloudSynced = user && !isGuest && !user.id?.startsWith('guest_');

  return (
    <div className="page-container profile-page">
      {/* Guest Mode Callout Banner */}
      {!isCloudSynced && (
        <div className="guest-sync-banner">
          <div className="guest-sync-info">
            <Sparkles size={18} className="guest-banner-icon" />
            <div>
              <strong>Practicing in Guest Mode</strong>
              <p>Your solves and streak are currently stored locally. Sign in with Google or GitHub to sync to the cloud and keep your record permanent.</p>
            </div>
          </div>
          <button className="btn-primary guest-sync-btn" onClick={() => setIsAuthModalOpen(true)}>
            <LogIn size={14} />
            <span>Sign in to Sync</span>
          </button>
        </div>
      )}

      {/* Sync Notice Alert */}
      {syncNotice && (
        <div className="sync-notice-banner" role="status">
          <ShieldCheck size={16} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="page-intro profile-intro">
        <div>
          <p className="eyebrow">LEARNING RECORD & PROFILE</p>
          <h1>Your progress, in one place.</h1>
          <p>Track your problems solved, maintain your daily rhythm, and access your cloud-synced study history.</p>
        </div>
        <div className="profile-header-actions">
          {isCloudSynced ? (
            <button
              className={`btn-secondary profile-sync-btn ${isSyncingManual ? 'syncing' : ''}`}
              onClick={handleManualSync}
              disabled={isSyncingManual}
              title="Force sync data with cloud database"
            >
              <RefreshCw size={14} className={isSyncingManual ? 'spin-icon' : ''} />
              <span>{isSyncingManual ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          ) : (
            <button
              className="btn-secondary profile-sync-btn"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <LogIn size={14} />
              <span>Connect Account</span>
            </button>
          )}
          <Link to="/practice" className="btn-primary profile-practice-link">
            <BookOpen size={15} />
            <span>Continue practice</span>
          </Link>
        </div>
      </header>

      {/* Main Profile Info Card */}
      <div className="profile-card">
        <div className="profile-card-toolbar">
          <div className="profile-badge-cluster">
            <span className="profile-card-label">LEARNER IDENTITY</span>
            {provider === 'google' && (
              <span className="oauth-status-pill google">
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Account</span>
              </span>
            )}
            {provider === 'github' && (
              <span className="oauth-status-pill github">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub Account</span>
              </span>
            )}
            {provider === 'email' && (
              <span className="oauth-status-pill email">
                <span>Verified Email</span>
              </span>
            )}
          </div>

          <div className="profile-status-tag">
            {isCloudSynced ? (
              <>
                <ShieldCheck size={13} className="status-icon-synced" />
                <span>
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Cloud Sync Active'}
                  {lastSyncedAt ? ` · ${lastSyncedAt}` : ''}
                </span>
              </>
            ) : (
              <>
                <CloudOff size={13} className="status-icon-guest" />
                <span>Guest Mode · Local storage only</span>
              </>
            )}
          </div>
          {savedNotice && <span className="saved-badge">Changes saved successfully</span>}
        </div>

        <div className="profile-top-row profile-identity-row">
          <div className="avatar-box">
            <img
              src={isEditing ? formData.avatar_url : profile.avatar_url}
              alt={profile.username}
              className="profile-avatar"
            />
          </div>

          <div className="profile-meta">
            <p className="profile-identity-label">STUDENT</p>
            <div className="meta-name-row">
              <h2 className="user-heading">{profile.username}</h2>
              <span className="user-title-tag">{profile.title}</span>
            </div>
            {profile.full_name && <p className="user-fullname-sub">{profile.full_name}</p>}
            <p className="user-campus-tag">
              <Building size={12} />
              <span>{profile.campus || 'Islamabad Campus'}</span>
            </p>
            {profile.bio && <p className="user-bio-text">{profile.bio}</p>}
          </div>

          <div className="profile-edit-trigger">
            {!isEditing ? (
              <button
                className="btn-secondary"
                onClick={handleStartEdit}
              >
                <Edit2 size={14} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSave}>
                <Save size={14} />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Level & XP Bar */}
        <div className="profile-level-card">
          <div className="level-bar-header">
            <div className="level-info-col">
              <span className="level-badge">Level {sessionStats.level}</span>
              <span className="level-xp-text">{sessionStats.xp} Total XP</span>
            </div>
            <span className="level-next-text">{sessionStats.nextLevelXP - sessionStats.xp} XP to Level {sessionStats.level + 1}</span>
          </div>
          <div className="level-progress-track">
            <div
              className="level-progress-fill"
              style={{ width: `${sessionStats.levelProgress || 0}%` }}
            />
          </div>
        </div>

        {/* Quick Top Metrics */}
        <div className="profile-metrics-grid">
          <div className="profile-metric">
            <Flame size={16} />
            <div>
              <strong>{sessionStats.currentStreak} days</strong>
              <span>day streak</span>
            </div>
          </div>
          <div className="profile-metric">
            <CheckCircle size={16} />
            <div>
              <strong>{stats.totalSolvesCount} / {stats.totalQuestionsCount}</strong>
              <span>questions completed</span>
            </div>
          </div>
          <div className="profile-metric">
            <Award size={16} />
            <div>
              <strong>Level {sessionStats.level}</strong>
              <span>{sessionStats.xp} XP earned</span>
            </div>
          </div>
          <div className="profile-metric">
            <CalendarDays size={16} />
            <div>
              <strong>{stats.activeDays} days</strong>
              <span>active days</span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        {isEditing && (
          <form className="edit-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="input-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="e.g. Muhammad Ali"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Academic Degree / Major</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. BS Computer Science (Batch 24)"
                />
              </div>
              <div className="input-group">
                <label>FAST NUCES Campus</label>
                <select
                  value={formData.campus}
                  onChange={(e) =>
                    setFormData({ ...formData, campus: e.target.value })
                  }
                  className="profile-select-input"
                >
                  {FAST_CAMPUSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group full-width">
              <label>Bio</label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Share your learning focus or courses..."
              />
            </div>

            <div className="input-group full-width">
              <div className="avatar-header-row">
                <label>Choose Avatar Preset or Custom Image URL</label>
                {oAuthDetails?.avatarUrl && (
                  <button
                    type="button"
                    className="btn-use-oauth-avatar"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, avatar_url: oAuthDetails.avatarUrl }))
                    }
                  >
                    <Camera size={13} />
                    <span>Use {provider === 'google' ? 'Google' : 'GitHub'} Photo</span>
                  </button>
                )}
              </div>
              <div className="avatar-pick-row">
                {AVATAR_PRESETS.map((pUrl, i) => (
                  <img
                    key={i}
                    src={pUrl}
                    alt="Preset"
                    className={`avatar-thumb ${
                      formData.avatar_url === pUrl ? 'selected' : ''
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, avatar_url: pUrl }))
                    }
                  />
                ))}
              </div>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Profile Section Tabs */}
      <div className="profile-tab-strip">
        <button
          className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={14} />
          <span>Overview</span>
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          <Bookmark size={14} />
          <span>Saved ({bookmarkedQuestions.length})</span>
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={14} />
          <span>Activity ({submissionHistory.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview & Heatmap */}
      {activeTab === 'overview' && (
        <>
          <div className="profile-progress-layout">
            <div className="profile-section-card profile-activity-card">
              <div className="profile-section-heading">
                <div>
                  <p className="eyebrow">STUDY RHYTHM</p>
                  <h2>Your practice activity</h2>
                </div>
              </div>
              <ActivityHeatmap submissions={submissions} />
            </div>

            <aside className="profile-goal-card">
              <div className="goal-card-icon">
                <Target size={17} />
              </div>
              <p className="eyebrow">THIS WEEK</p>
              <h2>Keep a steady pace</h2>
              <p>Complete one problem on five days this week. Consistent practice builds mastery.</p>
              <div className="goal-progress-label">
                <span>{weekProgress} / {weeklyGoal} days</span>
                <span>{Math.round((weekProgress / weeklyGoal) * 100)}%</span>
              </div>
              <div className="goal-progress-track">
                <span style={{ width: `${(weekProgress / weeklyGoal) * 100}%` }} />
              </div>

              <div className="goal-extra-stat">
                <div className="sub-stat-row">
                  <span>Longest Streak</span>
                  <strong>{sessionStats.longestStreak} days</strong>
                </div>
                <div className="sub-stat-row">
                  <span>Average Pace</span>
                  <strong>~{(stats.totalSolvesCount / Math.max(stats.activeDays, 1)).toFixed(1)} solves/active day</strong>
                </div>
              </div>
            </aside>
          </div>

          {/* Subject & Difficulty Progress Breakdown */}
          <div className="progress-breakdown-grid">
            {/* Subject Mastery */}
            <div className="breakdown-card">
              <div className="breakdown-card-header">
                <BookOpen size={16} />
                <h3>Course coverage</h3>
              </div>
              <div className="subject-progress-list">
                <div className="subject-progress-row">
                  <div className="subject-info-col">
                    <span className="subject-title-name">Programming Fundamentals (PF)</span>
                    <span className="subject-count-tag">{stats.pf.solved} / {stats.pf.total}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${stats.pf.pct}%` }} />
                  </div>
                </div>

                <div className="subject-progress-row">
                  <div className="subject-info-col">
                    <span className="subject-title-name">Calculus & Analytical Geometry</span>
                    <span className="subject-count-tag">{stats.calc.solved} / {stats.calc.total}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${stats.calc.pct}%` }} />
                  </div>
                </div>

                <div className="subject-progress-row">
                  <div className="subject-info-col">
                    <span className="subject-title-name">Applied Physics</span>
                    <span className="subject-count-tag">{stats.phy.solved} / {stats.phy.total}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${stats.phy.pct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="breakdown-card">
              <div className="breakdown-card-header">
                <Target size={16} />
                <h3>Practice by difficulty</h3>
              </div>
              <div className="difficulty-tiles-grid">
                <div className="difficulty-tile diff-easy-tile">
                  <span className="diff-label-top">Easy</span>
                  <strong className="diff-count-num">{stats.easy.solved} <span className="diff-total">/ {stats.easy.total}</span></strong>
                  <div className="tile-bar-bg">
                    <div className="tile-bar-fill easy-fill" style={{ width: `${Math.round((stats.easy.solved / stats.easy.total) * 100)}%` }} />
                  </div>
                </div>

                <div className="difficulty-tile diff-med-tile">
                  <span className="diff-label-top">Medium</span>
                  <strong className="diff-count-num">{stats.med.solved} <span className="diff-total">/ {stats.med.total}</span></strong>
                  <div className="tile-bar-bg">
                    <div className="tile-bar-fill med-fill" style={{ width: `${Math.round((stats.med.solved / stats.med.total) * 100)}%` }} />
                  </div>
                </div>

                <div className="difficulty-tile diff-hard-tile">
                  <span className="diff-label-top">Hard</span>
                  <strong className="diff-count-num">{stats.hard.solved} <span className="diff-total">/ {stats.hard.total}</span></strong>
                  <div className="tile-bar-bg">
                    <div className="tile-bar-fill hard-fill" style={{ width: `${Math.round((stats.hard.solved / stats.hard.total) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Bookmarked Problems */}
      {activeTab === 'bookmarks' && (
        <div className="profile-section-card bookmarks-section-card">
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">REVIEW QUEUE</p>
              <h2>Saved for later</h2>
            </div>
            <span className="items-counter-pill">{bookmarkedQuestions.length} saved</span>
          </div>

          {bookmarkedQuestions.length === 0 ? (
            <div className="empty-bookmarks-box">
              <Bookmark size={32} className="empty-icon" />
              <p>Your review queue is empty.</p>
              <span>Save questions while practicing and they will appear here for quick revision.</span>
              <Link to="/practice" className="btn-primary" style={{ marginTop: '16px' }}>
                Browse Practice Questions
              </Link>
            </div>
          ) : (
            <div className="bookmarks-grid">
              {bookmarkedQuestions.map((q) => (
                <div key={q.id} className="bookmark-card">
                  <div className="bookmark-card-top">
                    <span className={`diff-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                    <button
                      className="btn-unbookmark"
                      onClick={() => toggleBookmark(q.id)}
                      title="Remove Bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <h3 className="bookmark-card-title">{q.title}</h3>
                  <div className="bookmark-card-meta">
                    <span className="bookmark-subject-pill">{q.subjectId?.toUpperCase()}</span>
                    <span className="bookmark-category-pill">{q.subcategoryId || q.categoryId}</span>
                  </div>
                  <Link to={`/question/${q.id}`} className="btn-secondary bookmark-link">
                    <span>Solve Problem</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Recent Activity History */}
      {activeTab === 'history' && (
        <div className="profile-section-card history-section-card">
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">SUBMISSION HISTORY</p>
              <h2>Your recent attempts</h2>
            </div>
            <div className="history-filter-strip">
              <button
                className={`history-filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('all')}
              >
                All ({submissionHistory.length})
              </button>
              <button
                className={`history-filter-btn ${historyFilter === 'correct' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('correct')}
              >
                Correct ({submissionHistory.filter((s) => s.isCorrect).length})
              </button>
              <button
                className={`history-filter-btn ${historyFilter === 'incorrect' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('incorrect')}
              >
                Incorrect ({submissionHistory.filter((s) => !s.isCorrect).length})
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty-bookmarks-box">
              <History size={32} className="empty-icon" />
              <p>No attempts match this filter.</p>
              <span>Solve questions in the practice arena to record your learning progress.</span>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Question ID</th>
                    <th>Submitted Answer</th>
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <span className={`sub-status-pill ${sub.isCorrect ? 'correct' : 'wrong'}`}>
                          {sub.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </td>
                      <td className="sub-qid-cell">{sub.questionId}</td>
                      <td className="sub-ans-cell">
                        <code>{String(sub.submittedAnswer || '').slice(0, 35)}</code>
                      </td>
                      <td className="sub-date-cell">
                        {new Date(sub.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <Link to={`/question/${sub.questionId}`} className="btn-table-jump">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal Trigger for Guest users */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
