import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  getCommentsByQuestionId,
  questions,
} from '../data/questionBank';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { useQuestions } from '../context/QuestionsContext';
import { supabase } from '../config/supabase';
import { evaluateCodeWithAI } from '../utils/aiEval';
import CodeBlock from './CodeBlock';
import MathView from './MathView';
import VisualizationView from './VisualizationView';
import AiTutorDrawer from './AiTutorDrawer';
import BugsyDrawer from './BugsyDrawer';
import Judge0Modal from './Judge0Modal';
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
  FileText,
} from 'lucide-react';

export default function QuestionPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { profile, solvedQuestions, isBookmarked, toggleBookmark, recordAttempt, recordSolve } = useProfile();
  const { user } = useAuth();
  const { getQuestionById } = useQuestions();

  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState(null);

  // Inputs
  const [userAnswer, setUserAnswer] = useState('');
  const [userCode, setUserCode] = useState('');
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null

  // Compiler Execution States (Judge0)
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState(null);

  // Bugsy Agent & Judge0 Modal states
  const [isBugsyOpen, setIsBugsyOpen] = useState(false);
  const [isJudge0ModalOpen, setIsJudge0ModalOpen] = useState(false);
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

  // Live problem timer
  useEffect(() => {
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [questionId]);

  // Load question details
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const q = getQuestionById(questionId);
      setQuestion(q);
      setUserAnswer('');
      setResult(null);
      setCompilerOutput(null);
      setStyleReport(null);
      setShowHints(false);
      setShowExplanation(false);
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
          setEdgecasesList(cases || []);
          if (cases && cases.length > 0 && cases[0].stdin) {
            setCustomStdin(cases[0].stdin);
          } else {
            setCustomStdin('');
          }
        });
      }
      setIsLoading(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [questionId]);

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
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('question_id', questionId)
          .order('created_at', { ascending: true });

        if (isMounted) {
          if (!error && data && data.length > 0) {
            setCommentsList(data);
          } else {
            setCommentsList(getCommentsByQuestionId(questionId));
          }
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
        if (isMounted) setCommentsList(getCommentsByQuestionId(questionId));
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
  const sameSubcatQuestions = questions.filter(
    (q) =>
      q.subjectId === question.subjectId &&
      q.categoryId === question.categoryId &&
      q.subcategoryId === question.subcategoryId
  );
  const localIndex = sameSubcatQuestions.findIndex((q) => q.id === questionId);
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

  // Submit Answer for Dry Runs & Integer Inputs
  const handleAnswerSubmit = () => {
    const trimmedAnswer = userAnswer.trim();
    const trimmedExpected = question.expectedOutput?.trim();

    if (trimmedAnswer === trimmedExpected) {
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
      setResult('wrong');
    } else {
      setResult('compile_error');
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
      setResult('compile_error');
    }

    recordBugsyEvaluation({
      question,
      userCode,
      timeTakenSeconds: elapsedSeconds,
      testSummary: {
        totalTests: Math.max(1, edgecasesList.length),
        passedTests: isCorrect ? Math.max(1, edgecasesList.length) : 0,
      },
      styleReport: style,
      user,
    });
  };

  // Legacy compile alias for any remaining callbacks
  const handleCompileRun = handleRunCode;

  const handleCopyStatement = () => {
    const textToCopy = `${question.title}\n\n${
      question.statement || question.description || ''
    }\n\n${question.code || question.latexExpression || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleLikeComment = async (commentId) => {
    setCommentsList((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c))
    );
    try {
      const target = commentsList.find((c) => c.id === commentId);
      if (target) {
        await supabase
          .from('comments')
          .update({ likes: (target.likes || 0) + 1 })
          .eq('id', commentId);
      }
    } catch {}
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
    return (
      <div className="lc-page">
        {/* ── Top navigation bar ── */}
        <div className="lc-topbar">
          <div className="lc-topbar-left">
            <Link to="/practice" className="lc-back-link"><ChevronLeft size={14} /><span>Problems</span></Link>
            <div className="question-nav-controls">
              <button className="btn-icon" disabled={!prevQ} onClick={() => prevQ && navigate(`/question/${prevQ.id}`)} title="Previous"><ChevronLeft size={14} /></button>
              <span className="question-nav-index">{localIndex + 1}/{sameSubcatQuestions.length}</span>
              <button className="btn-icon" disabled={!nextQ} onClick={() => nextQ && navigate(`/question/${nextQ.id}`)} title="Next"><ChevronRight size={14} /></button>
            </div>
          </div>

          <div className="lc-topbar-center">
            <span className="lc-problem-title-sm">{question.title}</span>
          </div>

          <div className="lc-topbar-right">
            <div className="live-timer-badge" title="Timer"><Clock size={13} /><span>{formatTimer(elapsedSeconds)}</span></div>
            <button className="btn-secondary btn-sm" onClick={() => setIsJudge0ModalOpen(true)} title="Judge0 Config"><Settings size={13} /></button>
            <button className="btn-bugsy-trigger" onClick={() => setIsBugsyOpen(true)} title="Ask Bugsy"><Bug size={14} /><span>Bugsy</span></button>
            <button className={`btn-secondary ${isSaved ? 'active' : ''}`} onClick={handleToggleBookmark} title={isSaved ? 'Unsave' : 'Save'}><Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} /></button>
            <button className="btn-secondary" onClick={handleCopyStatement} title="Copy">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
            <button className="btn-secondary btn-ai" onClick={handleAskAI}><Bot size={14} /></button>
          </div>
        </div>

        {/* ── Split workspace ── */}
        <div className="lc-split">

          {/* ═══════ LEFT PANEL — Problem Description ═══════ */}
          <div className="lc-left">
            <div className="lc-left-tabs">
              {['description','hints','walkthrough','discussion'].map((t) => (
                <button key={t} className={`lc-left-tab ${leftTab === t ? 'active' : ''}`} onClick={() => setLeftTab(t)}>
                  {t === 'description' ? 'Description' : t === 'hints' ? 'Hints' : t === 'walkthrough' ? 'Walkthrough' : 'Discussion'}
                </button>
              ))}
            </div>

            <div className="lc-left-body">
              {leftTab === 'description' && (
                <>
                  <div className="lc-title-block">
                    <h1 className="lc-title">{question.title}</h1>
                    <div className="lc-meta-row">
                      <span className={`diff-badge diff-${(question.difficulty || 'easy').toLowerCase()}`}>{(question.difficulty || 'Easy').toUpperCase()}</span>
                      <span className="lc-type-pill">{questionTypeLabel}</span>
                      {isSolved && <span className="solved-pill"><CheckCircle2 size={12} /><span>Solved</span></span>}
                    </div>
                  </div>

                  {/* Weak topic alert */}
                  {weakTopicNotice && (
                    <div className="bugsy-inline-alert">
                      <AlertTriangle size={14} color="#d29922" />
                      <div className="alert-content"><strong>Bugsy:</strong> {weakTopicNotice.successRate}% success on <strong>{weakTopicNotice.topic}</strong>. Watch boundaries & edge values!</div>
                    </div>
                  )}

                  {/* Problem statement */}
                  <div className="lc-statement">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {question.statement || question.description || ''}
                    </ReactMarkdown>
                  </div>

                  {/* Expected output */}
                  {question.expectedOutput && (
                    <div className="lc-expected">
                      <span className="lc-expected-label">Expected Sample Output</span>
                      <pre className="lc-expected-pre">{question.expectedOutput}</pre>
                    </div>
                  )}

                  {/* Constraints / FAST lab rules */}
                  <div className="lc-constraints">
                    <h4>Constraints (FAST PF-Lab)</h4>
                    <ul>
                      <li>No STL containers (<code>vector</code>, <code>string</code>, <code>map</code>, etc.)</li>
                      <li>Use only basic I/O: <code>cin</code>, <code>cout</code>, <code>printf</code>, <code>scanf</code></li>
                      <li>Avoid <code>goto</code>, <code>global variables</code> unless specified</li>
                      <li>Input bounds: values fit in <code>int</code> unless stated otherwise</li>
                    </ul>
                  </div>

                  {/* Topic tags */}
                  {question.tags && question.tags.length > 0 && (
                    <div className="lc-tags">
                      {question.tags.map((t, i) => <span key={i} className="concept-tag">{t}</span>)}
                    </div>
                  )}

                  {/* Visualization */}
                  {question.visualization && (
                    <VisualizationView visualization={question.visualization} questionId={question.id} />
                  )}
                </>
              )}

              {leftTab === 'hints' && (
                <div className="lc-hints-body">
                  {question.hints && question.hints.length > 0 ? (
                    question.hints.map((hint, i) => (
                      <div key={i} className="hint-card"><span className="hint-num">Hint {i + 1}:</span><span>{hint}</span></div>
                    ))
                  ) : (
                    <p className="lc-empty-tab">No hints available for this problem.</p>
                  )}
                </div>
              )}

              {leftTab === 'walkthrough' && (
                <div className="lc-walkthrough-body">
                  {question.explanation ? (
                    <>
                      <h4 className="explanation-title">Walkthrough</h4>
                      <p>{question.explanation}</p>
                    </>
                  ) : (
                    <p className="lc-empty-tab">No walkthrough available yet.</p>
                  )}
                </div>
              )}

              {leftTab === 'discussion' && (
                <div className="lc-discussion-body">
                  <div className="comments-flow">
                    {commentsList.length === 0 && <div className="lc-empty-tab">No comments yet. Be the first to discuss!</div>}
                    {commentsList.map((c) => {
                      const isOwner = (user && c.user_id === user.id) || c.username === profile.username;
                      const dateDisplay = c.created_at || c.createdAt;
                      return (
                        <div key={c.id} className="comment-bubble">
                          <div className="comment-top">
                            <span className="comment-author">{c.username}</span>
                            <span className="comment-time">{dateDisplay ? new Date(dateDisplay).toLocaleDateString() : 'Just now'}</span>
                          </div>
                          <p className="comment-text">{c.content}</p>
                          <div className="comment-bottom">
                            <button className="btn-like" onClick={() => handleLikeComment(c.id)}><ThumbsUp size={12} /><span>{c.likes || 0}</span></button>
                            {isOwner && <button className="btn-comment-delete" onClick={() => handleDeleteComment(c.id)} title="Delete"><Trash2 size={12} /></button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="comment-post-box" style={{ marginTop: 12 }}>
                    <textarea className="comment-textarea" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment…" rows={2} />
                    <button className="btn-primary" onClick={handleAddComment} disabled={!newComment.trim()}><Send size={14} /><span>Post</span></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ RIGHT PANEL — Code Editor + Console ═══════ */}
          <div className="lc-right">
            {/* Editor header */}
            <div className="lc-editor-header">
              <span className="editor-lang-tag">C++ (GCC 9.2.0)</span>
              <div className="lc-editor-actions">
                <button className="btn-secondary btn-sm" onClick={handleResetCode} title="Reset to starter code"><RotateCcw size={13} /><span>Reset</span></button>
              </div>
            </div>

            {/* Code textarea */}
            <div className="lc-editor-wrap">
              <textarea
                className="lc-code-textarea"
                value={userCode}
                onChange={(e) => { setUserCode(e.target.value); setResult(null); }}
                onKeyDown={handleCodeKeyDown}
                spellCheck="false"
                placeholder="// Write your C/C++ solution here…"
              />
            </div>

            {/* ── Console drawer ── */}
            <div className={`lc-console ${isConsoleOpen ? 'open' : 'collapsed'}`}>
              <div className="lc-console-tabs-bar">
                <button className="lc-console-toggle" onClick={() => setIsConsoleOpen(!isConsoleOpen)}>
                  {isConsoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  <Terminal size={13} />
                  <span>Console</span>
                </button>
                {isConsoleOpen && (
                  <div className="lc-console-tabs">
                    {[{ key: 'testcase', label: 'Testcase' }, { key: 'result', label: 'Result' }, { key: 'bugsy', label: 'Bugsy Rubric' }].map(({ key, label }) => (
                      <button key={key} className={`lc-console-tab ${consoleTab === key ? 'active' : ''}`} onClick={() => setConsoleTab(key)}>{label}</button>
                    ))}
                  </div>
                )}
              </div>

              {isConsoleOpen && (
                <div className="lc-console-body">
                  {/* ── Testcase / stdin tab ── */}
                  {consoleTab === 'testcase' && (
                    <div className="lc-testcase-panel">
                      <div className="lc-case-pills">
                        {edgecasesList.map((_, i) => (
                          <button key={i} className={`lc-case-pill ${activeTestcaseIdx === i ? 'active' : ''}`} onClick={() => { setActiveTestcaseIdx(i); setCustomStdin(edgecasesList[i]?.stdin || ''); }}>
                            Case {i + 1}
                          </button>
                        ))}
                        <button className={`lc-case-pill ${activeTestcaseIdx === -1 ? 'active' : ''}`} onClick={() => { setActiveTestcaseIdx(-1); setCustomStdin(''); }}>
                          + Custom
                        </button>
                      </div>
                      <label className="lc-stdin-label">stdin</label>
                      <textarea
                        className="lc-stdin-textarea"
                        value={customStdin}
                        onChange={(e) => { setCustomStdin(e.target.value); setActiveTestcaseIdx(-1); }}
                        placeholder="Enter input values here (one per line)…"
                        rows={4}
                      />
                    </div>
                  )}

                  {/* ── Result tab ── */}
                  {consoleTab === 'result' && (
                    <div className="lc-result-panel">
                      {isCompiling && <div className="lc-compiling"><div className="lc-spinner" /><span>Running…</span></div>}

                      {!isCompiling && !compilerOutput && <p className="lc-empty-tab">Run or submit your code to see results.</p>}

                      {!isCompiling && compilerOutput && (
                        <>
                          <div className={`lc-verdict ${result === 'correct' ? 'accepted' : result === 'wrong' ? 'wrong-answer' : result === 'compile_error' ? 'error' : ''}`}>
                            {result === 'correct' && <><CheckCircle2 size={16} /><span>Accepted</span></>}
                            {result === 'wrong' && <><XCircle size={16} /><span>Wrong Answer</span></>}
                            {result === 'compile_error' && <><XCircle size={16} /><span>Compilation Error</span></>}
                            {!result && <span>Executed</span>}
                          </div>

                          <div className="lc-runtime-row">
                            <span>Runtime: <strong>{compilerOutput.time || '—'}s</strong></span>
                            <span>Memory: <strong>{compilerOutput.memory || '—'} KB</strong></span>
                          </div>

                          {compilerOutput.stdout && (
                            <div className="lc-output-section">
                              <span className="lc-output-label">stdout</span>
                              <pre className="lc-output-pre">{compilerOutput.stdout}</pre>
                            </div>
                          )}

                          {compilerOutput.stderr && (
                            <div className="lc-output-section">
                              <span className="lc-output-label lc-label-err">stderr</span>
                              <pre className="lc-output-pre lc-pre-err">{compilerOutput.stderr}</pre>
                            </div>
                          )}

                          {compilerOutput.compile_output && (
                            <div className="lc-output-section">
                              <span className="lc-output-label lc-label-err">Compiler Output</span>
                              <pre className="lc-output-pre lc-pre-err">{compilerOutput.compile_output}</pre>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Bugsy rubric tab ── */}
                  {consoleTab === 'bugsy' && (
                    <div className="lc-bugsy-panel">
                      {styleReport ? (
                        <>
                          <div className="lc-bugsy-score-row">
                            <span>🐛 PF-Lab Score: <strong>{styleReport.score}/100</strong></span>
                            <span className={`style-status-pill ${styleReport.isBeginnerCompliant ? 'pill-compliant' : 'pill-warning'}`}>
                              {styleReport.isBeginnerCompliant ? 'Compliant' : 'Violations'}
                            </span>
                          </div>
                          <p className="lc-bugsy-critique">{styleReport.critique}</p>
                          <button className="btn-secondary btn-xs" onClick={() => setIsBugsyOpen(true)}>Open Full Bugsy Drawer</button>
                        </>
                      ) : (
                        <p className="lc-empty-tab">Run your code first — Bugsy will evaluate PF-lab compliance after execution.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Sticky footer action bar ── */}
            <div className="lc-footer">
              <button className="lc-footer-console-btn" onClick={() => setIsConsoleOpen(!isConsoleOpen)}>
                <Terminal size={14} />
                <span>Console</span>
              </button>
              <div className="lc-footer-actions">
                <button className="btn-secondary lc-run-btn" onClick={handleRunCode} disabled={isCompiling}>
                  <Play size={14} />
                  <span>{isCompiling ? 'Running…' : 'Run Code'}</span>
                </button>
                <button className="btn-primary lc-submit-btn" onClick={handleSubmitCode} disabled={isCompiling}>
                  <span>{isCompiling ? 'Judging…' : 'Submit'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawers & Modals */}
        <AiTutorDrawer question={question} isOpen={isAiDrawerOpen} onClose={() => setIsAiDrawerOpen(false)} />
        <BugsyDrawer isOpen={isBugsyOpen} onClose={() => setIsBugsyOpen(false)} question={question} userCode={userCode} timeSpentSeconds={elapsedSeconds} onEvaluationCompleted={({ testSummary, styleReport: rep }) => { setStyleReport(rep); if (testSummary?.passedTests === testSummary?.totalTests && testSummary?.totalTests > 0) { setResult('correct'); triggerCelebration(); markQuestionSolved(); } }} />
        <Judge0Modal isOpen={isJudge0ModalOpen} onClose={() => setIsJudge0ModalOpen(false)} />
      </div>
    );
  }

  /* ================================================================
     STANDARD SINGLE-COLUMN VIEW — dry_run, math_input, math_study
     ================================================================ */
  return (
    <div className="question-page-container">
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
              <CodeBlock code={question.code.replace(/\\n/g, '\n')} language="c" />
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
              {question.hints.map((hint, i) => (
                <div key={i} className="hint-card">
                  <span className="hint-num">Hint {i + 1}:</span>
                  <span>{hint}</span>
                </div>
              ))}
            </div>
          )}

          {showExplanation && (
            <div className="explanation-card">
              <h4 className="explanation-title">Explanation & Theoretical Walkthrough</h4>
              <p>{question.explanation}</p>
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
              const isOwner = (user && c.user_id === user.id) || c.username === profile.username;
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

      {/* Judge0 Setup Modal */}
      <Judge0Modal
        isOpen={isJudge0ModalOpen}
        onClose={() => setIsJudge0ModalOpen(false)}
      />
    </div>
  );
}
