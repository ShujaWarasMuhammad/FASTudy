import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import {
  questions as defaultQuestions,
  subjects as defaultSubjects,
} from '../data/questionBank';

const QuestionsContext = createContext();

const LOCAL_CMS_KEY = 'fastudy_local_cms_questions_v1';

function getLocalCmsQuestions() {
  try {
    const raw = localStorage.getItem(LOCAL_CMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCmsQuestions(list) {
  try {
    localStorage.setItem(LOCAL_CMS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save local CMS questions:', err);
  }
}

function mergeWithLocalCms(baseList, localList) {
  if (!localList || localList.length === 0) return baseList;

  const localMap = new Map();
  localList.forEach((q) => {
    localMap.set(q.id, q);
  });

  // 1. Filter out deleted or update modified from base
  const result = baseList
    .map((q) => {
      if (localMap.has(q.id)) {
        const localOverride = localMap.get(q.id);
        localMap.delete(q.id);
        return localOverride._deleted ? null : localOverride;
      }
      return q;
    })
    .filter(Boolean);

  // 2. Append new additions from local
  localMap.forEach((q) => {
    if (!q._deleted) {
      result.unshift(q);
    }
  });

  return result;
}

export function QuestionsProvider({ children }) {
  const [localCmsList, setLocalCmsList] = useState(getLocalCmsQuestions);
  const [rawQuestions, setRawQuestions] = useState(defaultQuestions);
  const [subjects, setSubjects] = useState(defaultSubjects);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Computed unified questions list (merged with local CMS additions/modifications)
  const questions = useMemo(() => {
    return mergeWithLocalCms(rawQuestions, localCmsList);
  }, [rawQuestions, localCmsList]);

  useEffect(() => {
    let isMounted = true;
    let realtimeChannel = null;
    const channelName = `questions_stream_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    async function loadAndStreamQuestions() {
      if (!isSupabaseConfigured) { setIsLoading(false); return; }
      try {
        // 1. Fetch initial questions from Supabase
        const { data: dbQuestions, error: qError } = await supabase
          .from('questions')
          .select('*')
          .order('created_at', { ascending: true });

        if (!isMounted) return;

        if (!qError && dbQuestions && dbQuestions.length > 0) {
          const formattedQuestions = dbQuestions.map((q) => ({
            id: q.id,
            type: q.type || 'dry_run',
            subjectId: q.subject_id,
            categoryId: q.category_id,
            subcategoryId: q.subcategory_id,
            title: q.title,
            difficulty: q.difficulty || 'easy',
            code: q.code || '',
            starterCode: q.starter_code || q.code || '',
            expectedOutput: q.expected_output || '',
            statement: q.statement || '',
            description: q.description || '',
            latexExpression: q.latex_expression || '',
            explanation: q.explanation || '',
            hints: q.hints || [],
            tags: q.tags || [],
            visualization: q.visualization || null,
          }));

          setRawQuestions(formattedQuestions);
          setIsLiveConnected(true);
        } else {
          setRawQuestions(defaultQuestions);
        }

        // 2. Fetch subjects/categories from Supabase if present
        const { data: dbSubjects } = await supabase
          .from('subjects')
          .select('*, categories(*, subcategories(*))')
          .order('sort_order', { ascending: true });

        if (!isMounted) return;

        if (dbSubjects && dbSubjects.length > 0) {
          const formattedSubs = dbSubjects.map((s) => ({
            id: s.id,
            name: s.name,
            shortName: s.short_name,
            description: s.description,
            categories: (s.categories || []).map((c) => ({
              id: c.id,
              name: c.name,
              subcategories: (c.subcategories || []).map((sub) => ({
                id: sub.id,
                name: sub.name,
              })),
            })),
          }));
          setSubjects(formattedSubs);
        }

        setIsLoading(false);

        if (!isMounted) return;

        // 3. Setup real-time PostgreSQL replication stream safely
        realtimeChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'questions' },
            (payload) => {
              if (!isMounted) return;
              if (payload.eventType === 'INSERT') {
                const newQ = {
                  id: payload.new.id,
                  type: payload.new.type || 'dry_run',
                  subjectId: payload.new.subject_id,
                  categoryId: payload.new.category_id,
                  subcategoryId: payload.new.subcategory_id,
                  title: payload.new.title,
                  difficulty: payload.new.difficulty || 'easy',
                  code: payload.new.code || '',
                  starterCode: payload.new.starter_code || payload.new.code || '',
                  expectedOutput: payload.new.expected_output || '',
                  statement: payload.new.statement || '',
                  description: payload.new.description || '',
                  latexExpression: payload.new.latex_expression || '',
                  explanation: payload.new.explanation || '',
                  hints: payload.new.hints || [],
                  tags: payload.new.tags || [],
                  visualization: payload.new.visualization || null,
                };
                setRawQuestions((prev) => [...prev, newQ]);
              } else if (payload.eventType === 'UPDATE') {
                setRawQuestions((prev) =>
                  prev.map((q) =>
                    q.id === payload.new.id
                      ? {
                          ...q,
                          type: payload.new.type || q.type,
                          title: payload.new.title || q.title,
                          code: payload.new.code || q.code,
                          starterCode: payload.new.starter_code || q.starterCode,
                          expectedOutput: payload.new.expected_output || q.expectedOutput,
                          statement: payload.new.statement || q.statement,
                          latexExpression: payload.new.latex_expression || q.latexExpression,
                          explanation: payload.new.explanation || q.explanation,
                          visualization: payload.new.visualization || q.visualization,
                        }
                      : q
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setRawQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
              }
            }
          );

        realtimeChannel.subscribe();
      } catch (err) {
        if (isMounted) {
          console.warn('Real-time questions stream fallback to local dataset:', err);
          setIsLoading(false);
        }
      }
    }

    loadAndStreamQuestions();

    return () => {
      isMounted = false;
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  // Save question locally in CMS
  const saveQuestionLocally = useCallback((questionData) => {
    const cleaned = {
      ...questionData,
      _updatedAt: new Date().toISOString(),
      _isLocal: true,
    };

    setLocalCmsList((prev) => {
      const filtered = prev.filter((q) => q.id !== cleaned.id);
      const next = [cleaned, ...filtered];
      saveLocalCmsQuestions(next);
      return next;
    });

    return { success: true, question: cleaned };
  }, []);

  // Delete question locally in CMS
  const deleteQuestionLocally = useCallback((questionId) => {
    setLocalCmsList((prev) => {
      const existing = prev.find((q) => q.id === questionId);
      let next;
      if (existing) {
        next = prev.map((q) => (q.id === questionId ? { ...q, _deleted: true } : q));
      } else {
        next = [...prev, { id: questionId, _deleted: true }];
      }
      saveLocalCmsQuestions(next);
      return next;
    });
    return { success: true };
  }, []);

  // Stream / Push question to Supabase cloud
  const streamQuestionToSupabase = useCallback(async (questionData) => {
    try {
      const payload = {
        id: questionData.id,
        type: questionData.type || 'dry_run',
        subject_id: questionData.subjectId,
        category_id: questionData.categoryId,
        subcategory_id: questionData.subcategoryId,
        title: questionData.title,
        difficulty: questionData.difficulty || 'easy',
        code: questionData.code || null,
        starter_code: questionData.starterCode || questionData.code || null,
        expected_output: questionData.expectedOutput || null,
        statement: questionData.statement || null,
        description: questionData.description || null,
        latex_expression: questionData.latexExpression || null,
        explanation: questionData.explanation || null,
        hints: Array.isArray(questionData.hints) ? questionData.hints : [],
        tags: Array.isArray(questionData.tags) ? questionData.tags : [],
        visualization: questionData.visualization || null,
      };

      const { data, error } = await supabase.from('questions').upsert(payload).select().single();

      if (error) throw error;
      return { success: true, data, error: null };
    } catch (err) {
      console.error('Failed to stream question to Supabase:', err);
      return { success: false, data: null, error: err };
    }
  }, []);

  // Reset local CMS customizations
  const resetLocalCms = useCallback(() => {
    localStorage.removeItem(LOCAL_CMS_KEY);
    setLocalCmsList([]);
  }, []);

  const getQuestionsByFilter = useCallback(
    (subjectId, categoryId, subcategoryId) => {
      return questions.filter(
        (q) =>
          (!subjectId || q.subjectId === subjectId) &&
          (!categoryId || q.categoryId === categoryId) &&
          (!subcategoryId || q.subcategoryId === subcategoryId)
      );
    },
    [questions]
  );

  const getQuestionById = useCallback(
    (id) => {
      return questions.find((q) => q.id === id);
    },
    [questions]
  );

  return (
    <QuestionsContext.Provider
      value={{
        questions,
        subjects,
        isLoading,
        isLiveConnected,
        localCustomCount: localCmsList.filter((q) => !q._deleted).length,
        saveQuestionLocally,
        deleteQuestionLocally,
        streamQuestionToSupabase,
        resetLocalCms,
        getQuestionsByFilter,
        getQuestionById,
      }}
    >
      {children}
    </QuestionsContext.Provider>
  );
}

export const useQuestions = () => {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error('useQuestions must be used within QuestionsProvider');
  return ctx;
};
