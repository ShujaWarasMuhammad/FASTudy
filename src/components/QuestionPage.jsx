import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { useQuestions } from '../context/QuestionsContext';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { evaluateCodeWithAI } from '../utils/aiEval';
import CodeBlock from './CodeBlock';
import MathView from './MathView';
import VisualizationView from './VisualizationView';
import AiTutorDrawer from './AiTutorDrawer';
import BugsyDrawer from './BugsyDrawer';

import { getBugsyAnalytics, getBugsyEdgecases, evaluatePfLabStyle, recordBugsyEvaluation } from '../utils/bugsy';
import { QuestionPageSkeleton } from './SkeletonLoaders';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ThumbsUp,
  Send,
  Bot,
  HelpCircle,
  Play,
  Bookmark,
  CheckCircle2,
  Circle,
  XCircle,
  SquareCheck,
  Square,
  Trash2,
  Settings,
  Bug,
  Clock,
  AlertTriangle,
  RotateCcw,
  Terminal,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export default function QuestionPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { profile, solvedQuestions, isBookmarked, toggleBookmark, recordAttempt, recordSolve } = useProfile();
  const { user } = useAuth();
  const { getQuestionById, getQuestionsByFilter, isLoading: isBankLoading, subjects } = useQuestions();
  const question = getQuestionById(questionId) || null;
  const isLoading = !question && isBankLoading;

  // Inputs
  const [userAnswer, setUserAnswer] = useState('');
  const [userCode, setUserCode] = useState('');
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null

  // AI evaluator states
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState(null);

  // Bugsy agent states
  const [isBugsyOpen, setIsBugsyOpen] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [weakTopicNotice, setWeakTopicNotice] = useState(null);
  const [styleReport, setStyleReport] = useState(null);

  // UI accordion & auxiliary states
  const [showHints, setShowHints] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('question');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // LeetCode-style state
  const [customStdin, setCustomStdin] = useState('');
  const [activeTestcaseIdx, setActiveTestcaseIdx] = useState(0);
  const [consoleTab, setConsoleTab] = useState('testcase'); // 'testcase' | 'result' | 'bugsy'
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [leftTab, setLeftTab] = useState('description'); // 'description' | 'hints' | 'walkthrough' | 'discussion'
  const [edgecasesList, setEdgecasesList] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [showSolution, setShowSolution] = useState(false);
  const gutterRef = useRef(null);

  // Live problem timer
  useEffect(() => {
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [questionId]);

  // Reset workspace whenever the question changes (or arrives after the bank loads)
  useEffect(() => {
    let cancelled = false;
    {
      const q = question;
      setUserAnswer('');
      setResult(null);
      setCompilerOutput(null);
      setStyleReport(null);
      setShowHints(false);
      setShowExplanation(false);
      setShowSolution(false);
      setCopied(false);
      setActiveTab('question');
      setLeftTab('description');
      setConsoleTab('testcase');
      setIsConsoleOpen(true);
      setActiveTestcaseIdx(0);
      setIsAiDrawerOpen(false);
      setIsBugsyOpen(false);

      if (q) {
        setUserCode(q.starterCode || '');
        // Check for weak topic match in Bugsy analytics
        const analytics = getBugsyAnalytics();
        const currentTopic = q.tags?.[0] || q.subcategoryId || '';
        const match = analytics.weakTopics?.find(
          (w) => w.topic?.toLowerCase() === currentTopic.toLowerCase()
        );
        setWeakTopicNotice(match || null);

        // Fetch Bugsy edgecases to populate testcase tabs
        getBugsyEdgecases(q).then((cases) => {
          if (cancelled) return;
          setEdgecasesList(cases || []);
          if (cases && cases.length > 0 && cases[0].stdin) {
            setCustomStdin(cases[0].stdin);
          } else {
            setCustomStdin('');
          }
        });
      }
    }
    return () => { cancelled = true; };
  }, [questionId, question?.id]);

  useEffect(() => {
    if (question?.title) document.title = `${question.title} · FASTudy`;
  }, [question?.title]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Load & Stream Realtime Comments from Supabase
  useEffect(() => {
    let isMounted = true;
    let commentChannel = null;

    async function loadQuestionComments() {
      if (!isSupabaseConfigured) { setCommentsList([]); return; }
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('question_id', questionId)
          .order('created_at', { ascending: true });

        if (isMounted) {
          setCommentsList(!error && data ? data : []);
        }

        const channelName = `comments_stream_${questionId}_${Date.now()}`;
        commentChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'comments', filter: `question_id=eq.${questionId}` },
            (payload) => {
              if (!isMounted) return;
              if (payload.eventType === 'INSERT') {
                setCommentsList((prev) => {
                  if (prev.some((c) => c.id === payload.new.id)) return prev;
                  return [...prev, payload.new];
                });
              } else if (payload.eventType === 'UPDATE') {
                setCommentsList((prev) =>
                  prev.map((c) => (c.id === payload.new.id ? payload.new : c))
                );
              } else if (payload.eventType === 'DELETE') {
                setCommentsList((prev) => prev.filter((c) => c.id !== payload.old.id));
              }
            }
          );

        commentChannel.subscribe();
      } catch (err) {
        if (isMounted) setCommentsList([]);
      }
    }

    loadQuestionComments();

    return () => {
      isMounted = false;
      if (commentChannel) supabase.removeChannel(commentChannel);
    };
  }, [questionId]);

  if (isLoading) {
    return (
      <div className="question-page-container">
        <QuestionPageSkeleton />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="question-page-container">
        <div className="question-empty-state">
          <h1>This question is not available.</h1>
          <p>It may have been removed or its link is incomplete. Choose another question from the practice library.</p>
          <Link to="/practice" className="btn-primary">Open practice library</Link>
        </div>
      </div>
    );
  }

  const isSolved = solvedQuestions.includes(question.id);
  const isSaved = isBookmarked(question.id);

  // Navigation
  const sameSubcatQuestions = getQuestionsByFilter(question.subjectId, question.categoryId, question.subcategoryId);
  const localIndex = sameSubcatQuestions.findIndex((q) => q.id === questionId);
  const subjectObj = subjects.find((s) => s.id === question.subjectId);
  const subjectName = subjectObj?.shortName;
  const topicName = subjectObj?.categories
    .find((c) => c.id === question.categoryId)
    ?.subcategories.find((s) => s.id === question.subcategoryId)?.name;
  const prevQ = sameSubcatQuestions[localIndex - 1];
  const nextQ = sameSubcatQuestions[localIndex + 1];
  const questionTypeLabel = {
    dry_run: 'Code trace',
    code_submit: 'Code exercise',
    math_input: 'Answer check',
    math_study: 'Study checkpoint',
  }[question.type] || 'Practice question';

  const triggerCelebration = () => {
    confetti({
      disableForReducedMotion: true,
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#3fb950', '#2f81f7', '#d29922', '#a371f7'],
    });
  };

  const markQuestionSolved = () => {
    if (!solvedQuestions.includes(question.id)) {
      recordSolve(question.id, userAnswer.trim() || 'correct');
    }
  };

  const handleToggleBookmark = () => {
    toggleBookmark(question.id);
  };

  const toggleDoneStatus = () => {
    if (!isSolved) {
      markQuestionSolved();
      triggerCelebration();
    }
  };

  // Submit Answer for Dry Runs & Integer Inputs (whitespace-insensitive per line; numeric-aware)
  const normalizeAnswer = (value = '') =>
    value.replace(/\r\n/g, '\n').split('\n').map((line) => line.trim().replace(/\s+/g, ' ')).join('\n').trim();
  const handleAnswerSubmit = () => {
    const trimmedAnswer = normalizeAnswer(userAnswer);
    const trimmedExpected = normalizeAnswer(question.expectedOutput || '');
    const numericMatch =
      question.type === 'math_input' && trimmedAnswer !== '' && !Number.isNaN(Number(trimmedAnswer)) &&
      Number(trimmedAnswer) === Number(trimmedExpected);

    if (!trimmedAnswer) return;
    if (trimmedAnswer === trimmedExpected || numericMatch) {
      setResult('correct');
      triggerCelebration();
      markQuestionSolved();
    } else {
      setResult('wrong');
      recordAttempt(question.id, false, trimmedAnswer);
    }
  };

  const handleCodeKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const updated = val.substring(0, start) + '    ' + val.substring(end);
      setUserCode(updated);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleResetCode = () => {
    if (question?.starterCode) {
      setUserCode(question.starterCode);
      setResult(null);
      setCompilerOutput(null);
    }
  };

  // Run Code against active custom input stream (stdin)
  const handleRunCode = async () => {
    setIsCompiling(true);
    setConsoleTab('result');
    setIsConsoleOpen(true);
    setCompilerOutput(null);

    const res = await evaluateCodeWithAI(userCode, question, customStdin);
    setIsCompiling(false);
    setCompilerOutput(res);

    const style = evaluatePfLabStyle(userCode, question);
    setStyleReport(style);

    const expectedTrimmed = question.expectedOutput?.trim();
    const isCorrect = res.success && Boolean(expectedTrimmed) && (
      res.stdout.trim() === expectedTrimmed ||
      res.stdout.includes(expectedTrimmed)
    );

    if (isCorrect) {
      setResult('correct');
    } else if (res.success) {
      // Without a sample output there is nothing to compare a plain run against.
      setResult(expectedTrimmed ? 'wrong' : null);
    } else {
      setResult(res.compile_output || /compil/i.test(res.status) ? 'compile_error' : 'error');
    }
  };

  // Submit Code against all testcases + Bugsy edge cases
  const handleSubmitCode = async () => {
    setIsCompiling(true);
    setConsoleTab('result');
    setIsConsoleOpen(true);
    setCompilerOutput(null);

    const res = await evaluateCodeWithAI(userCode, question, customStdin);
    setIsCompiling(false);
    setCompilerOutput(res);

    const style = evaluatePfLabStyle(userCode, question);
    setStyleReport(style);

    const expectedTrimmed = question.expectedOutput?.trim();
    const isCorrect = res.success && (
      !expectedTrimmed ||
      res.stdout.trim() === expectedTrimmed ||
      res.stdout.includes(expectedTrimmed)
    );

    if (isCorrect) {
      setResult('correct');
      triggerCelebration();
      markQuestionSolved();
    } else if (res.success) {
      setResult('wrong');
      recordAttempt(question.id, false, userCode);
    } else {
      setResult(res.compile_output || /compil/i.test(res.status) ? 'compile_error' : 'error');
      if (res.status === 'Evaluator Offline' || res.status === 'Evaluation Unavailable') return;
      recordAttempt(question.id, false, userCode);
    }

    // Submit evaluates one verdict; the full edge-case matrix runs from the Bugsy drawer.
    recordBugsyEvaluation({
      question,
      userCode,
      timeTakenSeconds: elapsedSeconds,
      testSummary: { totalTests: 1, passedTests: isCorrect ? 1 : 0 },
      styleReport: style,
      user,
    });
  };


  const handleCopyStatement = () => {
    const textToCopy = `${question.title}\n\n${
      question.statement || question.description || ''
    }\n\n${question.code || question.latexExpression || ''}`;
    navigator.clipboard?.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };


  const handleAskAI = () => {
    setIsAiDrawerOpen(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const authorName = user?.user_metadata?.user_name || user?.user_metadata?.full_name || profile.username || 'Fastian';
    const tempId = `c_${Date.now()}`;
    const commentObj = {
      id: tempId,
      question_id: question.id,
      user_id: user?.id && !user.id.startsWith('guest_') ? user.id : null,
      username: authorName,
      content: newComment.trim(),
      likes: 0,
      created_at: new Date().toISOString(),
    };

    setCommentsList((prev) => [...prev, commentObj]);
    setNewComment('');

    try {
      const { data, error } = await supabase.from('comments').insert({
        question_id: question.id,
        user_id: commentObj.user_id,
        username: commentObj.username,
        content: commentObj.content,
        likes: 0,
      }).select().single();

      if (data && !error) {
        setCommentsList((prev) => prev.map((c) => (c.id === tempId ? data : c)));
      }
    } catch (err) {
      console.warn('Comment insert locally preserved:', err);
    }
  };

  // One like per comment per browser session; prevents inflating counts by repeat clicks.
  const handleLikeComment = async (commentId) => {
    if (likedIds.has(commentId)) return;
    const target = commentsList.find((c) => c.id === commentId);
    if (!target) return;
    const nextLikes = (target.likes || 0) + 1;
    setLikedIds((prev) => new Set(prev).add(commentId));
    setCommentsList((prev) => prev.map((c) => (c.id === commentId ? { ...c, likes: nextLikes } : c)));
    if (!isSupabaseConfigured || String(commentId).startsWith('c_')) return;
    const { error } = await supabase.from('comments').update({ likes: nextLikes }).eq('id', commentId);
    if (error) console.warn('Like not saved:', error.message);
  };

  const handleDeleteComment = async (commentId) => {
    setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await supabase.from('comments').delete().eq('id', commentId);
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnswerSubmit();
    }
  };

  /* ================================================================
     LEETCODE-STYLE SPLIT VIEW — code_submit questions only
     ================================================================ */
  if (question.type === 'code_submit') {
    const backTo = `/practice/${question.subjectId}/${question.categoryId}/${question.subcategoryId}`;
    const lineCount = Math.max(1, userCode.split('\n').length);
    const verdict = {
      correct: { cls: 'ok', icon: <CheckCircle2 size={16} />, text: 'Accepted' },
      wrong: { cls: 'bad', icon: <XCircle size={16} />, text: 'Wrong answer' },
      compile_error: { cls: 'bad', icon: <XCircle size={16} />, text: 'Compilation error' },
      error: { cls: 'warn', icon: <AlertTriangle size={16} />, text: compilerOutput?.status || 'Not evaluated' },
    }[result] || { cls: 'neutral', icon: <Terminal size={16} />, text: 'Ran successfully' };
    const tabs = [
      { key: 'description', label: 'Problem' },
      { key: 'hints', label: 'Hints', count: question.hints?.length || 0 },
      { key: 'walkthrough', label: 'Solution' },
      { key: 'discussion', label: 'Discussion', count: commentsList.length },
    ];

    return (
      <div className="cw">
        <header className="cw-bar">
          <div className="cw-bar-left">
            <Link to={backTo} className="cw-back" title="Back to problem list"><ChevronLeft size={16} /><span>{topicName || 'Problems'}</span></Link>
            <div className="cw-pager">
              <button disabled={!prevQ} onClick={() => prevQ && navigate(`/question/${prevQ.id}`)} aria-label="Previous problem"><ChevronLeft size={15} /></button>
              <span>{localIndex + 1} / {sameSubcatQuestions.length}</span>
              <button disabled={!nextQ} onClick={() => nextQ && navigate(`/question/${nextQ.id}`)} aria-label="Next problem"><ChevronRight size={15} /></button>
            </div>
          </div>
          <div className="cw-bar-right">
            <span className="cw-timer" title="Time on this problem"><Clock size={13} />{formatTimer(elapsedSeconds)}</span>
            <button className={`cw-icon-btn${isSaved ? ' on' : ''}`} onClick={handleToggleBookmark} title={isSaved ? 'Saved' : 'Save for later'} aria-label="Bookmark">
              <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button className="cw-ghost" onClick={handleAskAI}><Bot size={15} /><span>Ask AI</span></button>
          </div>
        </header>

        <div className="cw-split">
          <section className="cw-left">
            <nav className="cw-tabs" role="tablist">
              {tabs.map((t) => (
                <button key={t.key} role="tab" aria-selected={leftTab === t.key} className={leftTab === t.key ? 'active' : ''} onClick={() => setLeftTab(t.key)}>
                  {t.label}{t.count ? <span className="cw-count">{t.count}</span> : null}
                </button>
              ))}
            </nav>

            <div className="cw-left-body">
              {leftTab === 'description' && (
                <article className="cw-problem">
                  <h1>{question.title}</h1>
                  <div className="cw-meta">
                    <span className={`diff-badge diff-${(question.difficulty || 'easy').toLowerCase()}`}>{question.difficulty || 'easy'}</span>
                    {isSolved && <span className="cw-solved"><CheckCircle2 size={13} /> Solved</span>}
                  </div>
                  {weakTopicNotice && (
                    <p className="cw-note"><AlertTriangle size={13} /> You’ve found <strong>{weakTopicNotice.topic}</strong> tricky before ({weakTopicNotice.successRate}% success). Watch the edge cases.</p>
                  )}
                  <div className="cw-statement">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{question.statement || question.description || ''}</ReactMarkdown>
                  </div>
                  {question.expectedOutput && (
                    <>
                      <h3 className="cw-h3">Example output</h3>
                      <pre className="cw-pre">{question.expectedOutput}</pre>
                    </>
                  )}
                  <p className="cw-rules">PF-lab rules: no STL containers or <code>&lt;algorithm&gt;</code>, no <code>auto</code>, lambdas or classes. Use <code>cin</code>/<code>cout</code> or <code>printf</code>/<code>scanf</code>.</p>
                  {question.visualization && <VisualizationView visualization={question.visualization} questionId={question.id} />}
                </article>
              )}

              {leftTab === 'hints' && (
                <div className="cw-list">
                  {question.hints?.length ? question.hints.map((hint, i) => (
                    <details key={i} className="cw-hint">
                      <summary>Hint {i + 1}</summary>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{hint}</ReactMarkdown>
                    </details>
                  )) : <p className="cw-empty">No hints for this problem. Try <b>Ask AI</b> for a nudge.</p>}
                </div>
              )}

              {leftTab === 'walkthrough' && (
                <div className="cw-list">
                  {question.explanation && (
                    <div className="cw-statement"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{question.explanation}</ReactMarkdown></div>
                  )}
                  {question.solutionCode ? (
                    showSolution ? (
                      <>
                        <CodeBlock code={question.solutionCode} language="cpp" />
                        <button className="cw-ghost cw-mt" onClick={() => setShowSolution(false)}><EyeOff size={14} /> Hide solution</button>
                      </>
                    ) : (
                      <div className="cw-reveal">
                        <p>Try it yourself first. Reveal the reference solution when you’re stuck or want to compare.</p>
                        <button className="cw-ghost" onClick={() => setShowSolution(true)}><Eye size={14} /> Reveal solution</button>
                      </div>
                    )
                  ) : !question.explanation && <p className="cw-empty">No solution available yet.</p>}
                </div>
              )}

              {leftTab === 'discussion' && (
                <div className="cw-list">
                  {commentsList.length === 0 && <p className="cw-empty">No comments yet. Start the discussion.</p>}
                  {commentsList.map((c) => {
                    const isOwner = Boolean(user && c.user_id ? c.user_id === user.id : String(c.id).startsWith('c_'));
                    const when = c.created_at || c.createdAt;
                    return (
                      <div key={c.id} className="cw-comment">
                        <div className="cw-comment-top"><strong>{c.username}</strong><span>{when ? new Date(when).toLocaleDateString() : 'Just now'}</span></div>
                        <p>{c.content}</p>
                        <div className="cw-comment-actions">
                          <button onClick={() => handleLikeComment(c.id)} className={likedIds.has(c.id) ? 'on' : ''}><ThumbsUp size={12} /> {c.likes || 0}</button>
                          {isOwner && <button onClick={() => handleDeleteComment(c.id)} aria-label="Delete comment"><Trash2 size={12} /></button>}
                        </div>
                      </div>
                    );
                  })}
                  <div className="cw-comment-box">
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment…" rows={2} />
                    <button className="cw-primary" onClick={handleAddComment} disabled={!newComment.trim()}><Send size={13} /> Post</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="cw-right">
            <div className="cw-editor-head">
              <span>C++</span>
              <button className="cw-icon-btn" onClick={handleResetCode} title="Reset to starter code" aria-label="Reset code"><RotateCcw size={14} /></button>
            </div>

            <div className="cw-editor">
              <div className="cw-gutter" ref={gutterRef} aria-hidden="true">
                {Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}
              </div>
              <textarea
                value={userCode}
                onChange={(e) => { setUserCode(e.target.value); setResult(null); }}
                onKeyDown={handleCodeKeyDown}
                onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop; }}
                spellCheck="false"
                aria-label="Code editor"
                placeholder="// Write your C++ solution here"
              />
            </div>

            <div className={`cw-console${isConsoleOpen ? '' : ' closed'}`}>
              <div className="cw-console-head">
                {[{ key: 'testcase', label: 'Input' }, { key: 'result', label: 'Result' }].map((t) => (
                  <button key={t.key} className={consoleTab === t.key && isConsoleOpen ? 'active' : ''} onClick={() => { setConsoleTab(t.key); setIsConsoleOpen(true); }}>
                    {t.label}
                    {t.key === 'result' && result && <span className={`cw-dot ${verdict.cls}`} />}
                  </button>
                ))}
                <button className="cw-console-toggle" onClick={() => setIsConsoleOpen((v) => !v)} aria-label={isConsoleOpen ? 'Collapse console' : 'Expand console'}>
                  {isConsoleOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                </button>
              </div>

              {isConsoleOpen && (
                <div className="cw-console-body">
                  {consoleTab === 'testcase' && (
                    <>
                      <div className="cw-cases">
                        {edgecasesList.map((_, i) => (
                          <button key={i} className={activeTestcaseIdx === i ? 'active' : ''} onClick={() => { setActiveTestcaseIdx(i); setCustomStdin(edgecasesList[i]?.stdin || ''); }}>Case {i + 1}</button>
                        ))}
                        <button className={activeTestcaseIdx === -1 ? 'active' : ''} onClick={() => { setActiveTestcaseIdx(-1); setCustomStdin(''); }}>Custom</button>
                      </div>
                      <textarea
                        className="cw-stdin"
                        value={customStdin}
                        onChange={(e) => { setCustomStdin(e.target.value); setActiveTestcaseIdx(-1); }}
                        placeholder="Program input (stdin), one value per line"
                        rows={3}
                      />
                    </>
                  )}

                  {consoleTab === 'result' && (
                    isCompiling ? (
                      <div className="cw-running"><span className="cw-spinner" /> Evaluating your code…</div>
                    ) : !compilerOutput ? (
                      <p className="cw-empty">Press <b>Run</b> to test with the input, or <b>Submit</b> to check your answer.</p>
                    ) : (
                      <div className="cw-result">
                        <div className={`cw-verdict ${verdict.cls}`}>{verdict.icon}<span>{verdict.text}</span></div>
                        {compilerOutput.aiFeedback?.feedback && <p className="cw-feedback">{compilerOutput.aiFeedback.feedback}</p>}
                        {compilerOutput.stdout && <><label>Output</label><pre className="cw-pre">{compilerOutput.stdout}</pre></>}
                        {(compilerOutput.compile_output || compilerOutput.stderr) && (
                          <><label>Errors</label><pre className="cw-pre cw-pre-err">{compilerOutput.compile_output || compilerOutput.stderr}</pre></>
                        )}
                        {styleReport && (
                          <p className="cw-style">
                            PF-lab style <strong>{styleReport.score}/100</strong>
                            {styleReport.violations.length > 0 && <> · {styleReport.violations.map((v) => v.rule).join(', ')}</>}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <footer className="cw-actions">
              <button className="cw-ghost" onClick={() => setIsBugsyOpen(true)} title="Run all edge-case tests and a style review"><Bug size={15} /><span>Review with Bugsy</span></button>
              <div className="cw-actions-main">
                <button className="cw-secondary" onClick={handleRunCode} disabled={isCompiling}><Play size={14} /> Run</button>
                <button className="cw-primary" onClick={handleSubmitCode} disabled={isCompiling}>{isCompiling ? 'Checking…' : 'Submit'}</button>
              </div>
            </footer>
          </section>
        </div>

        <AiTutorDrawer question={question} isOpen={isAiDrawerOpen} onClose={() => setIsAiDrawerOpen(false)} />
        <BugsyDrawer
          isOpen={isBugsyOpen}
          onClose={() => setIsBugsyOpen(false)}
          question={question}
          userCode={userCode}
          timeSpentSeconds={elapsedSeconds}
          onEvaluationCompleted={({ testSummary, styleReport: rep }) => {
            setStyleReport(rep);
            if (testSummary?.totalTests > 0 && testSummary.passedTests === testSummary.totalTests) {
              setResult('correct');
              triggerCelebration();
              markQuestionSolved();
            }
          }}
        />
      </div>
    );
  }

  /* ================================================================
     STANDARD SINGLE-COLUMN VIEW — dry_run, math_input, math_study
     ================================================================ */
  return (
    <div className="question-page-container">
      <Link to={`/practice/${question.subjectId}/${question.categoryId}/${question.subcategoryId}`} className="question-back-link">
        <ChevronLeft size={14} /><span>{subjectName ? `${subjectName} · ` : ''}{topicName || 'Problems'}</span>
      </Link>
      {/* Top Bar Navigation */}
      <div className="question-header">
        <div className="question-nav-controls">
          <button
            className="btn-icon"
            disabled={!prevQ}
            onClick={() => prevQ && navigate(`/question/${prevQ.id}`)}
            title="Previous question"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="question-nav-index">
            {localIndex + 1} / {sameSubcatQuestions.length}
          </span>
          <button
            className="btn-icon"
            disabled={!nextQ}
            onClick={() => nextQ && navigate(`/question/${nextQ.id}`)}
            title="Next question"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="question-action-buttons">
          <button
            className={`btn-secondary ${isSaved ? 'active' : ''}`}
            onClick={handleToggleBookmark}
            title={isSaved ? 'Remove Bookmark' : 'Save Question'}
          >
            <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button className="btn-secondary" onClick={handleCopyStatement} title="Copy Statement">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button className="btn-secondary btn-ai" onClick={handleAskAI}>
            <Bot size={14} />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-strip">
        <button className={`tab-item ${activeTab === 'question' ? 'active' : ''}`} onClick={() => setActiveTab('question')}><span>Problem</span></button>
        <button className={`tab-item ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}><span>Discussion ({commentsList.length})</span></button>
      </div>

      {activeTab === 'question' ? (
        <div className="question-content-body">
          <div className="problem-title-row">
            <div>
              <p className="question-type-label">{questionTypeLabel} · {question.categoryId?.replace(/-/g, ' ')}</p>
              <h1 className="problem-title-lg">{question.title}</h1>
            </div>
            <div className="question-completion-state">
              {isSolved ? (
                <span className="solved-pill"><CheckCircle2 size={13} /><span>Completed</span></span>
              ) : (
                <span className="question-status-pending"><Circle size={13} /> In progress</span>
              )}
            </div>
          </div>

          {question.visualization && (
            <VisualizationView visualization={question.visualization} questionId={question.id} />
          )}

          {/* TYPE 1: DRY RUNS */}
          {question.type === 'dry_run' && (
            <>
              <CodeBlock code={(question.code || '').replace(/\\n/g, '\n')} language="c" />
              <div className="answer-box">
                <div className="answer-header-row">
                  <label className="answer-label">Expected Output (Exact Match)</label>
                  <span className="submit-hint">Press Enter to submit</span>
                </div>
                <div className="input-submit-flex">
                  <textarea
                    className={`terminal-input ${result === 'correct' ? 'input-correct' : result === 'wrong' ? 'input-wrong' : ''}`}
                    value={userAnswer}
                    onChange={(e) => { setUserAnswer(e.target.value); setResult(null); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type the exact output (e.g. 3 2)..."
                    rows={2}
                    autoFocus
                  />
                  <button className="btn-primary" onClick={handleAnswerSubmit}>Submit</button>
                </div>
                {result === 'correct' && (
                  <div className="feedback-badge feedback-correct">
                    <CheckCircle2 size={16} /><span>Exact match verified. Output is correct.</span>
                    {nextQ && <button className="btn-next-inline" onClick={() => navigate(`/question/${nextQ.id}`)}>Next Question</button>}
                  </div>
                )}
                {result === 'wrong' && (
                  <div className="feedback-badge feedback-wrong"><XCircle size={16} /><span>Output mismatch. Trace line-by-line and try again.</span></div>
                )}
              </div>
            </>
          )}

          {/* ========================================================
              TYPE 3: MATHEMATICS INTEGER INPUT (KaTeX rendering)
             ======================================================== */}
          {question.type === 'math_input' && (
            <div className="math-question-container">
              <div className="math-statement-card">
                <p className="statement-lead">{question.statement}</p>
                <div className="latex-display-center">
                  <MathView math={question.latexExpression} displayMode={true} />
                </div>
              </div>

              <div className="answer-box">
                <div className="answer-header-row">
                  <label className="answer-label">Your Integer Answer</label>
                  <span className="submit-hint">Enter single integer value (e.g., 14, 4, -2)</span>
                </div>

                <div className="input-submit-flex">
                  <input
                    type="text"
                    className={`terminal-input integer-input ${
                      result === 'correct'
                        ? 'input-correct'
                        : result === 'wrong'
                        ? 'input-wrong'
                        : ''
                    }`}
                    value={userAnswer}
                    onChange={(e) => {
                      setUserAnswer(e.target.value);
                      setResult(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter integer..."
                    autoFocus
                  />
                  <button className="btn-primary" onClick={handleAnswerSubmit}>
                    Check Answer
                  </button>
                </div>

                {result === 'correct' && (
                  <div className="feedback-badge feedback-correct">
                    <CheckCircle2 size={16} />
                    <span>Correct integer solution! Answer verified.</span>
                    {nextQ && (
                      <button
                        className="btn-next-inline"
                        onClick={() => navigate(`/question/${nextQ.id}`)}
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                )}

                {result === 'wrong' && (
                  <div className="feedback-badge feedback-wrong">
                    <XCircle size={16} />
                    <span>Incorrect value. Check signs and substitutions.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TYPE 4: MATHEMATICS STUDY CHECKPOINT (Look, tick done, copy, ask AI)
             ======================================================== */}
          {question.type === 'math_study' && (
            <div className="math-study-card">
<div className="statement-lead">
  <ReactMarkdown
    remarkPlugins={[remarkMath]}
    rehypePlugins={[rehypeKatex]}
  >
    {question.statement || ''}
  </ReactMarkdown>
</div>
              <div className="latex-display-center study-latex-box">
                <MathView math={question.latexExpression} displayMode={true} />
              </div>



              {/* Study Action Bar */}
              <div className="study-action-bar">
                <button
                  className={`btn-toggle-done ${isSolved ? 'done' : ''}`}
                  onClick={toggleDoneStatus}
                >
                  {isSolved ? (
                    <SquareCheck size={18} className="text-success" />
                  ) : (
                    <Square size={18} />
                  )}
                  <span>{isSolved ? 'Completed & Marked Done' : 'Mark as Done'}</span>
                </button>

                <div className="study-secondary-actions">
                
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Hints & Explanation Walkthrough */}
          <div className="helpers-strip">
            {question.hints && question.hints.length > 0 && (
              <button
                className="btn-secondary"
                onClick={() => setShowHints(!showHints)}
              >
                <HelpCircle size={14} />
                <span>{showHints ? 'Hide Hints' : `Show Hints (${question.hints.length})`}</span>
              </button>
            )}

            <button
              className="btn-secondary"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showExplanation ? 'Hide Walkthrough' : 'Show Walkthrough'}</span>
            </button>
          </div>

          {showHints && (
            <div className="hint-card-list">
              {(question.hints || []).map((hint, i) => (
                <div key={i} className="hint-card">
                  <span className="hint-num">Hint {i + 1}:</span>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{hint}</ReactMarkdown>
                </div>
              ))}
            </div>
          )}

          {showExplanation && (
            <div className="explanation-card">
              <h4 className="explanation-title">Explanation & Theoretical Walkthrough</h4>
              {question.explanation
                ? <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{question.explanation}</ReactMarkdown>
                : <p>No walkthrough available yet.</p>}
            </div>
          )}
        </div>
      ) : (
        /* Discussion Tab */
        <div className="comments-pane">
          <div className="comments-flow">
            {commentsList.length === 0 && (
              <div className="empty-state">No comments yet. Share your evaluation logic!</div>
            )}
            {commentsList.map((c) => {
              const isOwner = Boolean(user && c.user_id ? c.user_id === user.id : String(c.id).startsWith('c_'));
              const dateDisplay = c.created_at || c.createdAt;
              return (
                <div key={c.id} className="comment-bubble">
                  <div className="comment-top">
                    <span className="comment-author">{c.username}</span>
                    <span className="comment-time">
                      {dateDisplay ? new Date(dateDisplay).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <p className="comment-text">{c.content}</p>
                  <div className="comment-bottom">
                    <button
                      className="btn-like"
                      onClick={() => handleLikeComment(c.id)}
                      title="Helpful comment"
                    >
                      <ThumbsUp size={12} />
                      <span>{c.likes || 0}</span>
                    </button>
                    {isOwner && (
                      <button
                        className="btn-comment-delete"
                        onClick={() => handleDeleteComment(c.id)}
                        title="Delete comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="comment-post-box">
            <textarea
              className="comment-textarea"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Post a note or inquiry about this problem..."
              rows={2}
            />
            <button
              className="btn-primary"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Send size={14} />
              <span>Post</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Gemini AI Tutor Drawer */}
      <AiTutorDrawer
        question={question}
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />

      {/* Bugsy QA & Edgecases Drawer */}
      <BugsyDrawer
        isOpen={isBugsyOpen}
        onClose={() => setIsBugsyOpen(false)}
        question={question}
        userCode={userCode}
        timeSpentSeconds={elapsedSeconds}
        onEvaluationCompleted={({ testSummary, styleReport: rep }) => {
          setStyleReport(rep);
          if (testSummary?.passedTests === testSummary?.totalTests && testSummary?.totalTests > 0) {
            setResult('correct');
            triggerCelebration();
            markQuestionSolved();
          }
        }}
      />

    </div>
  );
}
