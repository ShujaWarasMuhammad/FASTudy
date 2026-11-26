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
import { compileAndRunCode } from '../utils/judge0';
import CodeBlock from './CodeBlock';
import MathView from './MathView';
import VisualizationView from './VisualizationView';
import AiTutorDrawer from './AiTutorDrawer';
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

  // UI accordion & auxiliary states
  const [showHints, setShowHints] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('question');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Load question details
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const q = getQuestionById(questionId);
      setQuestion(q);
      setUserAnswer('');
      setResult(null);
      setCompilerOutput(null);
      setShowHints(false);
      setShowExplanation(false);
      setCopied(false);
      setActiveTab('question');
      setIsAiDrawerOpen(false);

      if (q) {
        setUserCode(q.starterCode || '');
      }
      setIsLoading(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [questionId]);

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

  // Compile with Judge0 (for Logic Building)
  const handleCompileRun = async () => {
    setIsCompiling(true);
    setCompilerOutput(null);

    const res = await compileAndRunCode(userCode, 54); // C++ languageId 54
    setIsCompiling(false);
    setCompilerOutput(res);

    // Check if output matches expected
    if (res.success && res.stdout.trim() === question.expectedOutput?.trim()) {
      setResult('correct');
      triggerCelebration();
      markQuestionSolved();
    } else if (res.success) {
      setResult('wrong');
      recordAttempt(question.id, false, userCode);
    } else {
      setResult('compile_error');
    }
  };

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
          {/* Bookmark Button */}
          <button
            className={`btn-secondary ${isSaved ? 'active' : ''}`}
            onClick={handleToggleBookmark}
            title={isSaved ? 'Remove Bookmark' : 'Save Question'}
          >
            <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Copy Statement */}
          <button className="btn-secondary" onClick={handleCopyStatement} title="Copy Statement">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Ask AI */}
          <button
            className="btn-secondary btn-ai"
            onClick={handleAskAI}
          >
            <Bot size={14} />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-strip">
        <button
          className={`tab-item ${activeTab === 'question' ? 'active' : ''}`}
          onClick={() => setActiveTab('question')}
        >
          <span>Problem</span>
        </button>
        <button
          className={`tab-item ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          <span>Discussion ({commentsList.length})</span>
        </button>
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
                <span className="solved-pill">
                  <CheckCircle2 size={13} />
                  <span>Completed</span>
                </span>
              ) : (
                <span className="question-status-pending"><Circle size={13} /> In progress</span>
              )}
            </div>
          </div>


          {/* Live Streamable Visualization (Mermaid Memory Map / KaTeX / Diagram) */}
          {question.visualization && (
            <VisualizationView
              visualization={question.visualization}
              questionId={question.id}
            />
          )}

          {/* ========================================================
              TYPE 1: DRY RUNS (CodeBlock with colored syntax)
             ======================================================== */}
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
                    className={`terminal-input ${
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
                    placeholder="Type the exact output (e.g. 3 2)..."
                    rows={2}
                    autoFocus
                  />
                  <button className="btn-primary" onClick={handleAnswerSubmit}>
                    Submit
                  </button>
                </div>

                {result === 'correct' && (
                  <div className="feedback-badge feedback-correct">
                    <CheckCircle2 size={16} />
                    <span>Exact match verified. Output is correct.</span>
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
                    <span>Output mismatch. Trace line-by-line and try again.</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========================================================
              TYPE 2: LOGIC BUILDING (Compiled code with Judge0)
             ======================================================== */}
          {question.type === 'code_submit' && (
            <div className="logic-building-container">
              <div className="problem-statement-box">
                <p className="statement-text">{question.description}</p>
                <div className="expected-target-row">
                  <span className="target-label">Target Output Required:</span>
                  <pre className="target-code-block">{question.expectedOutput}</pre>
                </div>
              </div>

              {/* Code Editor */}
              <div className="compiler-editor-box">
                <div className="editor-top-bar">
                  <span className="editor-lang-tag">C++ (GCC 9.2.0 via Judge0 Compiler)</span>
                  <button
                    className="btn-primary btn-compile"
                    onClick={handleCompileRun}
                    disabled={isCompiling}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>{isCompiling ? 'Compiling Code...' : 'Compile & Run'}</span>
                  </button>
                </div>

                <textarea
                  className="code-editor-textarea"
                  value={userCode}
                  onChange={(e) => {
                    setUserCode(e.target.value);
                    setResult(null);
                  }}
                  rows={14}
                  spellCheck="false"
                />
              </div>

              {/* Compiler Execution Output Card */}
              {compilerOutput && (
                <div className="compiler-result-card">
                  <div className="compiler-status-header">
                    <span className="compiler-status-badge">
                      Status: {compilerOutput.status}
                    </span>
                    <span className="compiler-stats">
                      Time: {compilerOutput.time}s | Memory: {compilerOutput.memory} KB
                    </span>
                  </div>

                  {compilerOutput.stdout && (
                    <div className="compiler-section">
                      <span className="section-label">Program Standard Output:</span>
                      <pre className="output-terminal stdout">{compilerOutput.stdout}</pre>
                    </div>
                  )}

                  {compilerOutput.stderr && (
                    <div className="compiler-section">
                      <span className="section-label text-error">Standard Error:</span>
                      <pre className="output-terminal stderr">{compilerOutput.stderr}</pre>
                    </div>
                  )}

                  {compilerOutput.compile_output && (
                    <div className="compiler-section">
                      <span className="section-label text-error">Compiler Output:</span>
                      <pre className="output-terminal stderr">{compilerOutput.compile_output}</pre>
                    </div>
                  )}

                  {result === 'correct' && (
                    <div className="feedback-badge feedback-correct">
                      <CheckCircle2 size={16} />
                      <span>Code compiled and generated the exact expected output!</span>
                    </div>
                  )}

                  {result === 'wrong' && (
                    <div className="feedback-badge feedback-wrong">
                      <XCircle size={16} />
                      <span>Compiled successfully, but output did not match target.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
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
    </div>
  );
}
