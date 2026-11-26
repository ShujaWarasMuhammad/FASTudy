import { useState, useEffect } from 'react';
import {
  getBugsyEdgecases,
  evaluatePfLabStyle,
  runJudge0TestMatrix,
  recordBugsyEvaluation,
  getBugsyAnalytics
} from '../utils/bugsy';
import { useAuth } from '../context/AuthContext';
import {
  Bug,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Code2,
  FileText,
  X,
  Sparkles,
  Award
} from 'lucide-react';

export default function BugsyDrawer({
  isOpen,
  onClose,
  question,
  userCode,
  timeSpentSeconds = 0,
  onEvaluationCompleted
}) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('edgecases'); // 'edgecases' | 'style' | 'tests'
  const [edgecases, setEdgecases] = useState([]);
  const [isLoadingEdgecases, setIsLoadingEdgecases] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testSummary, setTestSummary] = useState(null);
  const [styleReport, setStyleReport] = useState(null);
  const [weakTopicNotice, setWeakTopicNotice] = useState(null);

  // Load edge cases and weak topic analytics whenever question changes
  useEffect(() => {
    if (!question || !isOpen) return;

    let isMounted = true;
    setIsLoadingEdgecases(true);

    getBugsyEdgecases(question).then((cases) => {
      if (isMounted) {
        setEdgecases(cases);
        setIsLoadingEdgecases(false);
      }
    });

    // Check if this topic is among the student's weak topics
    const analytics = getBugsyAnalytics();
    const currentTopic = question.tags?.[0] || question.subcategoryId || '';
    const matchedWeak = analytics.weakTopics.find(
      (w) => w.topic?.toLowerCase() === currentTopic.toLowerCase()
    );

    if (matchedWeak) {
      setWeakTopicNotice(matchedWeak);
    } else {
      setWeakTopicNotice(null);
    }

    // Evaluate initial style
    const initialStyle = evaluatePfLabStyle(userCode, question);
    setStyleReport(initialStyle);

    return () => {
      isMounted = false;
    };
  }, [question?.id, isOpen]);

  if (!isOpen || !question) return null;

  // Format timer into MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Run full evaluation: tests + style + logging
  const handleRunFullEvaluation = async () => {
    setIsRunningTests(true);
    setActiveTab('tests');

    // 1. Prepare test suite: sample case + Bugsy edge cases
    const testSuite = [];
    if (question.expectedOutput) {
      testSuite.push({
        name: 'Sample Output (Problem Spec)',
        stdin: '',
        expected: question.expectedOutput,
        edgeType: 'standard',
        rationale: 'Baseline check against expected sample output.'
      });
    }

    edgecases.forEach((ec) => {
      testSuite.push({
        name: ec.name,
        stdin: ec.stdin,
        expected: ec.expectedBehavior,
        edgeType: ec.edgeType,
        rationale: ec.rationale
      });
    });

    // 2. Execute on Judge0
    const summary = await runJudge0TestMatrix(userCode, testSuite);
    setTestSummary(summary);

    // 3. Evaluate style
    const style = evaluatePfLabStyle(userCode, question);
    setStyleReport(style);

    // 4. Record evaluation & update weak topic memory
    const evalRecord = await recordBugsyEvaluation({
      question,
      userCode,
      timeTakenSeconds: timeSpentSeconds,
      testSummary: summary,
      styleReport: style,
      user
    });

    setIsRunningTests(false);

    if (onEvaluationCompleted) {
      onEvaluationCompleted({
        testSummary: summary,
        styleReport: style,
        evalRecord
      });
    }
  };

  const handleRefreshEdgecases = async () => {
    setIsLoadingEdgecases(true);
    // Clear local cache for this question to force regeneration
    try {
      const raw = localStorage.getItem('fastudy_bugsy_edgecases_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed[question.id];
        localStorage.setItem('fastudy_bugsy_edgecases_v1', JSON.stringify(parsed));
      }
    } catch (e) {}

    const newCases = await getBugsyEdgecases(question);
    setEdgecases(newCases);
    setIsLoadingEdgecases(false);
  };

  return (
    <div className="bugsy-drawer-backdrop" onClick={onClose}>
      <div className="bugsy-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bugsy-header">
          <div className="bugsy-identity">
            <div className="bugsy-avatar">🐛</div>
            <div>
              <div className="bugsy-title-row">
                <h3>Bugsy</h3>
                <span className="bugsy-badge">FAST PF Lab TA Agent</span>
              </div>
              <p className="bugsy-subtitle">Automated Edgecase Engine & PF Lab Verifier</p>
            </div>
          </div>
          <button className="bugsy-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Live Timer & Problem Topic Pill */}
        <div className="bugsy-meta-bar">
          <div className="bugsy-timer-pill">
            <Clock size={14} />
            <span>Time on Problem: <strong>{formatTime(timeSpentSeconds)}</strong></span>
          </div>
          <span className="bugsy-topic-pill">
            Topic: {question.tags?.[0] || question.subcategoryId || 'General PF'}
          </span>
        </div>

        {/* Weak Topic Alert Notice */}
        {weakTopicNotice && (
          <div className="bugsy-weak-topic-alert">
            <AlertTriangle size={18} className="alert-icon" />
            <div>
              <strong>Bugsy Heads-Up: Weak Topic Detected</strong>
              <p>
                You have a <strong>{weakTopicNotice.successRate}%</strong> success rate on{' '}
                <strong>{weakTopicNotice.topic}</strong> (avg time {Math.round(weakTopicNotice.avgTime / 60)}m).
                Watch out for edge cases, off-by-one errors, and boundary limits on this question!
              </p>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="bugsy-actions-row">
          <button
            className="btn-primary bugsy-run-btn"
            onClick={handleRunFullEvaluation}
            disabled={isRunningTests}
          >
            <Play size={14} fill="currentColor" />
            <span>{isRunningTests ? 'Running on Judge0...' : 'Run Full Evaluation with Bugsy'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bugsy-tabs-nav">
          <button
            className={`bugsy-tab-btn ${activeTab === 'edgecases' ? 'active' : ''}`}
            onClick={() => setActiveTab('edgecases')}
          >
            <Sparkles size={14} />
            <span>Edge Cases ({edgecases.length})</span>
          </button>
          <button
            className={`bugsy-tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <CheckCircle2 size={14} />
            <span>Judge0 Test Matrix {testSummary ? `(${testSummary.passedTests}/${testSummary.totalTests})` : ''}</span>
          </button>
          <button
            className={`bugsy-tab-btn ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            <Award size={14} />
            <span>PF-Lab Rubric {styleReport ? `(${styleReport.score}%)` : ''}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="bugsy-drawer-body">
          {/* TAB 1: EDGECASES */}
          {activeTab === 'edgecases' && (
            <div className="bugsy-edgecases-tab">
              <div className="tab-lead-row">
                <p>
                  Bugsy automatically synthesizes edge cases for each problem to expose common student bugs (boundary inputs, zeros, negative numbers, overflow). These cases are persistently stored against this problem.
                </p>
                <button
                  className="btn-secondary btn-sm"
                  onClick={handleRefreshEdgecases}
                  disabled={isLoadingEdgecases}
                >
                  <RotateCw size={12} className={isLoadingEdgecases ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingEdgecases ? (
                <div className="bugsy-loading-state">
                  <RotateCw size={24} className="spin text-accent" />
                  <p>Bugsy is synthesizing edge cases for this problem...</p>
                </div>
              ) : edgecases.length === 0 ? (
                <p className="text-secondary">No edge cases generated yet.</p>
              ) : (
                <div className="edgecases-list">
                  {edgecases.map((ec, idx) => (
                    <div key={idx} className="edgecase-card">
                      <div className="edgecase-card-header">
                        <span className="edgecase-title">Case {idx + 1}: {ec.name}</span>
                        <span className={`edgecase-tag tag-${ec.edgeType || 'boundary'}`}>
                          {ec.edgeType || 'edgecase'}
                        </span>
                      </div>
                      <div className="edgecase-details">
                        {ec.stdin && (
                          <div className="edgecase-field">
                            <span className="field-label">Standard Input (stdin):</span>
                            <pre className="edgecase-pre">{ec.stdin}</pre>
                          </div>
                        )}
                        <div className="edgecase-field">
                          <span className="field-label">Expected Behavior / Output:</span>
                          <p className="field-desc">{ec.expectedBehavior}</p>
                        </div>
                        {ec.rationale && (
                          <div className="edgecase-field">
                            <span className="field-label">Why Bugsy tests this:</span>
                            <p className="field-rationale">{ec.rationale}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: JUDGE0 TEST MATRIX */}
          {activeTab === 'tests' && (
            <div className="bugsy-tests-tab">
              {!testSummary ? (
                <div className="bugsy-empty-tests">
                  <Play size={28} className="text-muted" />
                  <h4>No test run yet</h4>
                  <p>Click "Run Full Evaluation with Bugsy" above to compile your code and execute it against Judge0.</p>
                </div>
              ) : (
                <div className="test-matrix-container">
                  <div className={`test-summary-banner ${testSummary.passedTests === testSummary.totalTests ? 'banner-pass' : 'banner-fail'}`}>
                    <div className="summary-score">
                      <strong>{testSummary.passedTests} / {testSummary.totalTests}</strong>
                      <span>Tests Passed</span>
                    </div>
                    <div className="summary-message">
                      {testSummary.passedTests === testSummary.totalTests
                        ? '🎉 All test cases and edge cases passed!'
                        : '⚠️ Some test cases or edge cases failed. Inspect the outputs below.'}
                    </div>
                  </div>

                  <div className="test-cases-results">
                    {testSummary.results.map((tr, idx) => (
                      <div key={idx} className={`test-result-row ${tr.passed ? 'row-pass' : 'row-fail'}`}>
                        <div className="test-row-header">
                          <div className="test-row-title">
                            {tr.passed ? (
                              <CheckCircle2 size={16} color="#3fb950" />
                            ) : (
                              <XCircle size={16} color="#f85149" />
                            )}
                            <span>{tr.name}</span>
                          </div>
                          <div className="test-row-meta">
                            <span>Status: {tr.status}</span>
                            <span>Time: {tr.time}s</span>
                          </div>
                        </div>

                        {tr.stdin && (
                          <div className="test-detail-section">
                            <span className="detail-label">Input:</span>
                            <pre className="test-pre">{tr.stdin}</pre>
                          </div>
                        )}

                        <div className="test-detail-section">
                          <span className="detail-label">Expected:</span>
                          <pre className="test-pre">{tr.expected}</pre>
                        </div>

                        <div className="test-detail-section">
                          <span className="detail-label">Program Output:</span>
                          <pre className={`test-pre ${tr.passed ? 'text-success' : 'text-danger'}`}>
                            {tr.actual}
                          </pre>
                        </div>

                        {tr.error && (
                          <div className="test-detail-section">
                            <span className="detail-label text-danger">Error:</span>
                            <pre className="test-pre text-danger">{tr.error}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PF-LAB RUBRIC */}
          {activeTab === 'style' && (
            <div className="bugsy-style-tab">
              {styleReport && (
                <>
                  <div className="style-score-card">
                    <div className="score-ring">
                      <span className="score-number">{styleReport.score}</span>
                      <span className="score-denom">/ 100</span>
                    </div>
                    <div className="score-meta">
                      <h4>Beginner PF-Lab Compliance</h4>
                      <p className="score-narrative">{styleReport.critique}</p>
                    </div>
                  </div>

                  {styleReport.violations.length > 0 ? (
                    <div className="rubric-violations-section">
                      <div className="section-title">
                        <ShieldAlert size={16} color="#f85149" />
                        <span>Lab Convention Violations ({styleReport.violations.length})</span>
                      </div>
                      <div className="violations-list">
                        {styleReport.violations.map((v, i) => (
                          <div key={i} className={`violation-item severity-${v.severity}`}>
                            <div className="violation-header">
                              <span className="violation-rule">{v.rule}</span>
                              <span className="violation-penalty">-{v.penalty} pts</span>
                            </div>
                            <p className="violation-msg">{v.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rubric-clean-badge">
                      <ShieldCheck size={20} color="#3fb950" />
                      <div>
                        <strong>100% Beginner Compliant!</strong>
                        <p>No banned STL algorithms, containers, or modern keywords detected.</p>
                      </div>
                    </div>
                  )}

                  {styleReport.strengths.length > 0 && (
                    <div className="rubric-strengths-section">
                      <div className="section-title">
                        <CheckCircle2 size={16} color="#3fb950" />
                        <span>Good PF-Lab Practices Noticed</span>
                      </div>
                      <ul className="strengths-list">
                        {styleReport.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
