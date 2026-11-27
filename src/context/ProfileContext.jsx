import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth, getOAuthUserDetails } from './AuthContext';
import { localDateKey, newId } from '../utils/dates'; // activity is bucketed by local calendar day

const ProfileContext = createContext();

const LOCAL_PROGRESS_KEY = 'fastudy_local_progress_v1';


// Identity of an attempt: its id, plus a timestamp key that ignores "Z" vs "+00:00" formatting.
const attemptKeys = (h) => [h.id, `${h.questionId}_${new Date(h.createdAt).getTime()}`].filter(Boolean);

const DEFAULT_PROFILE = {
  id: 'guest_user',
  username: 'FASTian',
  full_name: '',
  title: 'BS Computer Science',
  campus: 'Islamabad Campus',
  avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Fastian_2024',
  bio: '',
  xp: 0,
  level: 1,
  current_streak: 0,
  longest_streak: 0,
};

function loadLocalProgress() {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      profile: parsed.profile || DEFAULT_PROFILE,
      submissions: parsed.submissions || {},
      solvedQuestions: Array.isArray(parsed.solvedQuestions) ? parsed.solvedQuestions : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      submissionHistory: Array.isArray(parsed.submissionHistory) ? parsed.submissionHistory : [],
    };
  } catch (err) {
    console.warn('Failed to load local progress:', err);
    return null;
  }
}

function saveLocalProgress(data) {
  try {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save local progress:', err);
  }
}

function calculateStreaks(submissionsMap) {
  const dates = Object.keys(submissionsMap)
    .filter((d) => submissionsMap[d] > 0)
    .sort();

  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let currentStreak = 0;
  let checkDate = new Date();
  let checkStr = localDateKey(checkDate);

  // If no activity today, verify if active yesterday
  if (!submissionsMap[checkStr]) {
    checkDate.setDate(checkDate.getDate() - 1);
    checkStr = localDateKey(checkDate);
  }

  while (submissionsMap[checkStr] && submissionsMap[checkStr] > 0) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
    checkStr = localDateKey(checkDate);
  }

  let longestStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i > 0) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

export function ProfileProvider({ children }) {
  const { user, isGuest } = useAuth();

  // Initialize from local cache for instant UI rendering
  const initialLocal = useMemo(() => loadLocalProgress(), []);

  const [profile, setProfile] = useState(initialLocal?.profile || DEFAULT_PROFILE);
  const [submissions, setSubmissions] = useState(initialLocal?.submissions || {});
  const [solvedQuestions, setSolvedQuestions] = useState(initialLocal?.solvedQuestions || []);
  const [bookmarks, setBookmarks] = useState(initialLocal?.bookmarks || []);
  const [submissionHistory, setSubmissionHistory] = useState(initialLocal?.submissionHistory || []);

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  // Latest history for realtime de-duplication (read inside subscription callbacks).
  const historyRef = useRef(submissionHistory);
  useEffect(() => { historyRef.current = submissionHistory; }, [submissionHistory]);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'offline'
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncNotice, setSyncNotice] = useState(null);

  // Sync to local storage whenever progress changes
  const persistCurrentToLocal = useCallback(
    (customProfile, customSubs, customSolved, customBm, customHist) => {
      saveLocalProgress({
        profile: customProfile || profile,
        submissions: customSubs || submissions,
        solvedQuestions: customSolved || solvedQuestions,
        bookmarks: customBm || bookmarks,
        submissionHistory: customHist || submissionHistory,
      });
    },
    [profile, submissions, solvedQuestions, bookmarks, submissionHistory]
  );

  // Master synchronization function: loads from Supabase, merges any local unsaved data, and updates remote
  const performSync = useCallback(async () => {
    if (!user || isGuest || user.id.startsWith('guest_')) {
      // Guest mode: rely on local storage
      const local = loadLocalProgress();
      if (local) {
        const guestName = user?.user_metadata?.user_name || local.profile?.username || 'FASTian_Guest';
        const mergedProf = {
          ...DEFAULT_PROFILE,
          ...local.profile,
          id: user?.id || 'guest_user',
          username: guestName,
          avatar_url: user?.user_metadata?.avatar_url || local.profile?.avatar_url || DEFAULT_PROFILE.avatar_url,
        };
        setProfile(mergedProf);
        setSubmissions(local.submissions);
        setSolvedQuestions(local.solvedQuestions);
        setBookmarks(local.bookmarks);
        setSubmissionHistory(local.submissionHistory);
      }
      setSyncStatus('guest');
      setIsProfileLoading(false);
      return;
    }

    setSyncStatus('syncing');
    const local = loadLocalProgress();
    const oAuthMeta = getOAuthUserDetails(user);

    try {
      // 1. Fetch remote profile
      let userProfile = null;
      const { data: dbProfile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (dbProfile && !pError) {
        userProfile = dbProfile;
      } else {
        // Initialize new profile in Supabase
        const sanitizedUsername = (oAuthMeta?.username || user.email?.split('@')[0] || 'fastian')
          .replace(/[^a-zA-Z0-9_]/g, '_');

        let newProf = {
          id: user.id,
          username: sanitizedUsername,
          full_name: oAuthMeta?.fullName || '',
          title: 'BS Computer Science',
          campus: 'Islamabad Campus',
          avatar_url: oAuthMeta?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
          bio: '',
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(newProf)
          .select()
          .maybeSingle();

        if (insertError && insertError.code === '23505') {
          // Username taken - append short UID
          newProf.username = `${sanitizedUsername}_${user.id.slice(0, 5)}`;
          const { data: retryData } = await supabase
            .from('profiles')
            .insert(newProf)
            .select()
            .maybeSingle();
          userProfile = retryData || newProf;
        } else {
          userProfile = inserted || newProf;
        }
      }

      // If user signed in via OAuth and has an OAuth avatar, keep it handy
      if (userProfile && oAuthMeta?.avatarUrl && (!userProfile.avatar_url || userProfile.avatar_url.includes('dicebear'))) {
        userProfile.avatar_url = oAuthMeta.avatarUrl;
        // Query builders are lazy: they only run when awaited/then'd.
        supabase.from('profiles').update({ avatar_url: oAuthMeta.avatarUrl }).eq('id', user.id)
          .then(({ error }) => { if (error) console.warn('Avatar sync failed:', error); });
      }

      setProfile(userProfile);

      // 2. Fetch remote bookmarks
      const { data: dbBookmarks, error: bmError } = await supabase
        .from('bookmarks')
        .select('question_id')
        .eq('user_id', user.id);

      let remoteBookmarks = [];
      if (dbBookmarks && !bmError) {
        remoteBookmarks = dbBookmarks.map((b) => b.question_id);
      }

      // Check for local bookmarks made before signing in to merge
      const remoteBmSet = new Set(remoteBookmarks);
      const unsyncedLocalBookmarks = (local?.bookmarks || []).filter((id) => !remoteBmSet.has(id));

      if (unsyncedLocalBookmarks.length > 0) {
        try {
          await supabase.from('bookmarks').insert(
            unsyncedLocalBookmarks.map((qid) => ({
              user_id: user.id,
              question_id: qid,
            }))
          );
          remoteBookmarks = Array.from(new Set([...remoteBookmarks, ...unsyncedLocalBookmarks]));
        } catch (err) {
          console.warn('Bookmarks merge push error:', err);
        }
      }
      setBookmarks(remoteBookmarks);

      // 3. Fetch remote submissions
      const { data: dbSubs, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let mergedSubsMap = {};
      let mergedSolvedSet = new Set();
      let mergedHistoryList = [];

      if (dbSubs && !subError) {
        dbSubs.forEach((s) => {
          const dateStr = localDateKey(s.created_at);
          mergedSubsMap[dateStr] = (mergedSubsMap[dateStr] || 0) + 1;
          if (s.is_correct) {
            mergedSolvedSet.add(s.question_id);
          }
          mergedHistoryList.push({
            id: s.id,
            questionId: s.question_id,
            submittedAnswer: s.submitted_answer,
            isCorrect: s.is_correct,
            createdAt: s.created_at,
          });
        });
      }

      // Check for local guest attempts to merge into Supabase
      const remoteAttemptIds = new Set(mergedHistoryList.flatMap(attemptKeys));
      const unsyncedAttempts = (local?.submissionHistory || []).filter(
        (h) => h.questionId && !attemptKeys(h).some((k) => remoteAttemptIds.has(k))
      );

      if (unsyncedAttempts.length > 0) {
        try {
          const payloads = unsyncedAttempts.map((h) => ({
            ...(/^[0-9a-f-]{36}$/i.test(h.id || '') ? { id: h.id } : {}),
            user_id: user.id,
            question_id: h.questionId,
            submitted_answer: String(h.submittedAnswer || ''),
            is_correct: !!h.isCorrect,
            created_at: h.createdAt || new Date().toISOString(),
          }));

          const { error: pushError } = await supabase.from('submissions').insert(payloads);
          if (pushError) throw pushError;

          // Update merged structures
          unsyncedAttempts.forEach((h) => {
            const dateStr = localDateKey(h.createdAt || new Date());
            mergedSubsMap[dateStr] = (mergedSubsMap[dateStr] || 0) + 1;
            if (h.isCorrect) {
              mergedSolvedSet.add(h.questionId);
            }
            mergedHistoryList.push(h);
          });

          setSyncNotice(`Synced ${unsyncedAttempts.length} previous offline practice session(s) to cloud!`);
          setTimeout(() => setSyncNotice(null), 4000);
        } catch (err) {
          console.warn('Submissions merge push error:', err);
        }
      }

      const mergedSolvedArray = Array.from(mergedSolvedSet);
      setSubmissions(mergedSubsMap);
      setSolvedQuestions(mergedSolvedArray);
      setSubmissionHistory(mergedHistoryList);

      // 4. Calculate Streak & XP and update public.profiles
      const { currentStreak, longestStreak } = calculateStreaks(mergedSubsMap);
      const computedXP = mergedSolvedArray.length * 75 + currentStreak * 25;
      const computedLevel = Math.floor(computedXP / 300) + 1;

      await supabase
        .from('profiles')
        .update({
          xp: computedXP,
          level: computedLevel,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Save merged copy locally
      saveLocalProgress({
        profile: userProfile,
        submissions: mergedSubsMap,
        solvedQuestions: mergedSolvedArray,
        bookmarks: remoteBookmarks,
        submissionHistory: mergedHistoryList,
      });

      setSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Sync error:', err);
      setSyncStatus('offline');
    } finally {
      setIsProfileLoading(false);
    }
  }, [user, isGuest]);

  // Run synchronization on user change
  useEffect(() => {
    performSync();

    // Setup Realtime listeners for authenticated user
    if (!user || isGuest || user.id.startsWith('guest_')) return;

    const channelName = `user_data_sync_${user.id}_${Date.now()}`;
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => Array.from(new Set([...prev, payload.new.question_id])));
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((id) => id !== payload.old.question_id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions', filter: `user_id=eq.${user.id}` },
        ({ new: s }) => {
          // Attempts made on another device/tab. Our own inserts carry a client id and are skipped.
          if (historyRef.current.some((h) => h.id === s.id)) return;
          const entry = { id: s.id, questionId: s.question_id, submittedAnswer: s.submitted_answer, isCorrect: s.is_correct, createdAt: s.created_at };
          historyRef.current = [entry, ...historyRef.current];
          const dateKey = localDateKey(s.created_at);
          setSubmissionHistory((prev) => (prev.some((h) => h.id === s.id) ? prev : [entry, ...prev].slice(0, 200)));
          setSubmissions((m) => ({ ...m, [dateKey]: (m[dateKey] || 0) + 1 }));
          if (s.is_correct) setSolvedQuestions((q) => (q.includes(s.question_id) ? q : [...q, s.question_id]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [user, isGuest, performSync]);

  // Keep multiple open tabs in sync (local progress is the shared cache for guests and signed-in users).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== LOCAL_PROGRESS_KEY || !e.newValue) return;
      const next = loadLocalProgress();
      if (!next) return;
      setSubmissions(next.submissions);
      setSolvedQuestions(next.solvedQuestions);
      setBookmarks(next.bookmarks);
      setSubmissionHistory(next.submissionHistory);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Update Profile (CRUD)
  const updateProfile = async (updatedFields) => {
    const updated = { ...profile, ...updatedFields };
    setProfile(updated);
    persistCurrentToLocal(updated, submissions, solvedQuestions, bookmarks, submissionHistory);

    if (user && !isGuest && !user.id.startsWith('guest_')) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            ...updated,
            id: user.id,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error('Remote profile update error:', err);
      }
    }
  };

  // Record every evaluated attempt
  const recordAttempt = async (questionId, isCorrect, answer = '') => {
    const todayKey = localDateKey();
    const newCount = (submissions[todayKey] || 0) + 1;
    const nextSubs = { ...submissions, [todayKey]: newCount };
    setSubmissions(nextSubs);

    let nextSolved = solvedQuestions;
    if (isCorrect && !solvedQuestions.includes(questionId)) {
      nextSolved = [...solvedQuestions, questionId];
      setSolvedQuestions(nextSolved);
    }

    const newHistoryEntry = {
      id: newId(),
      questionId,
      submittedAnswer: answer,
      isCorrect,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [newHistoryEntry, ...submissionHistory.slice(0, 199)];
    setSubmissionHistory(nextHistory);

    // Persist locally
    persistCurrentToLocal(profile, nextSubs, nextSolved, bookmarks, nextHistory);

    // Sync to Supabase if authenticated
    if (user && !isGuest && !user.id.startsWith('guest_')) {
      try {
        const { error: insertError } = await supabase.from('submissions').insert({
          id: newHistoryEntry.id,
          user_id: user.id,
          question_id: questionId,
          submitted_answer: answer,
          is_correct: isCorrect,
          created_at: newHistoryEntry.createdAt,
        });
        if (insertError) throw insertError;

        // Update streaks and XP in profiles
        const { currentStreak, longestStreak } = calculateStreaks(nextSubs);
        const xp = nextSolved.length * 75 + currentStreak * 25;
        const level = Math.floor(xp / 300) + 1;

        await supabase
          .from('profiles')
          .update({
            xp,
            level,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error('Remote submission error:', err);
        setSyncStatus('offline');
      }
    }
  };

  const recordSolve = (questionId, answer = 'correct') =>
    recordAttempt(questionId, true, answer);

  // Toggle Bookmark
  const toggleBookmark = async (questionId) => {
    const isCurrentlyBookmarked = bookmarks.includes(questionId);
    const nextBookmarks = isCurrentlyBookmarked
      ? bookmarks.filter((id) => id !== questionId)
      : [...bookmarks, questionId];

    setBookmarks(nextBookmarks);
    persistCurrentToLocal(profile, submissions, solvedQuestions, nextBookmarks, submissionHistory);

    if (user && !isGuest && !user.id.startsWith('guest_')) {
      try {
        if (isCurrentlyBookmarked) {
          await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('question_id', questionId);
        } else {
          await supabase.from('bookmarks').insert({
            user_id: user.id,
            question_id: questionId,
          });
        }
        setSyncStatus('synced');
      } catch (err) {
        console.error('Remote bookmark toggle error:', err);
      }
    }
  };

  const isBookmarked = (questionId) => bookmarks.includes(questionId);

  // Computed Streaks & Stats
  const sessionStats = useMemo(() => {
    const { currentStreak, longestStreak } = calculateStreaks(submissions);
    const totalSolves = solvedQuestions.length;
    const xp = totalSolves * 75 + currentStreak * 25;
    const level = Math.floor(xp / 300) + 1;
    const nextLevelXP = level * 300;
    // Distinct active days in the current Mon–Sun week
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const activeDaysThisWeek = Object.keys(submissions).filter(
      (d) => submissions[d] > 0 && new Date(`${d}T00:00:00`) >= weekStart
    ).length;
    const currentLevelBaseXP = (level - 1) * 300;
    const levelProgress = Math.min(
      100,
      Math.round(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100)
    );

    return {
      currentStreak,
      longestStreak,
      totalSolves,
      xp,
      level,
      nextLevelXP,
      levelProgress,
      activeDaysThisWeek,
    };
  }, [submissions, solvedQuestions]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        submissions,
        solvedQuestions,
        bookmarks,
        isBookmarked,
        toggleBookmark,
        recordAttempt,
        recordSolve,
        sessionStats,
        submissionHistory,
        isProfileLoading,
        syncStatus,
        lastSyncedAt,
        syncNotice,
        syncNow: performSync,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
};
