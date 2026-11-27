import { useState, useEffect } from 'react';
import { Bug, X, CheckCircle2, XCircle, ChevronDown, Loader2, Play } from 'lucide-react';
import { getBugsyEdgecases, evaluatePfLabStyle, runJudge0TestMatrix, recordBugsyEvaluation } from '../utils/bugsy';
import { useAuth } from '../context/AuthContext';

export default function BugsyDrawer({ isOpen, onClose, question, userCode, timeSpentSeconds = 0, onEvaluationCompleted }) {
  const { user } = useAuth();
  const [edgecases, setEdgecases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState(null);
  const [style, setStyle] = useState(null);
  const [openRow, setOpenRow] = useState(null);

  useEffect(() => {
    if (!question || !isOpen) return;
    let alive = true;
    setIsLoadingCases(true);
    getBugsyEdgecases(question).then((cases) => {
      if (alive) { setEdgecases(cases || []); setIsLoadingCases(false); }
    });
    return () => { alive = false; };
  }, [question?.id, isOpen]);

  useEffect(() => { setSummary(null); setStyle(null); setOpenRow(null); }, [question?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !question) return null;

  const runReview = async () => {
    setIsRunning(true);
    setOpenRow(null);
    const suite = [
      ...(question.expectedOutput ? [{ name: 'Sample output', stdin: '', expected: question.expectedOutput }] : []),
      ...edgecases.map((ec) => ({ name: ec.name, stdin: ec.stdin, expectedBehavior: ec.expectedBehavior })),
    ];
    const result = await runJudge0TestMatrix(userCode, suite, question);
    const styleReport = evaluatePfLabStyle(userCode, question);
    setSummary(result);
    setStyle(styleReport);
    setIsRunning(false);
    await recordBugsyEvaluation({ question, userCode, timeTakenSeconds: timeSpentSeconds, testSummary: result, styleReport, user });
    onEvaluationCompleted?.({ testSummary: result, styleReport });
  };

  const allPassed = summary && summary.passedTests === summary.totalTests;

  return (
    <div className="ag-backdrop" onMouseDown={onClose}>
      <aside className="ag-panel" onMouseDown={(e) => e.stopPropagation()} aria-label="Bugsy code review">
        <header className="ag-head">
          <span className="ag-icon ag-icon-bug"><Bug size={15} /></span>
          <div className="ag-titles">
            <h2>Bugsy review</h2>
            <p>Tests your code and checks PF-lab style</p>
          </div>
          <button className="ag-btn-icon" onClick={onClose} title="Close (Esc)" aria-label="Close"><X size={16} /></button>
        </header>

        <div className="ag-body ag-pad">
          <button className="ag-primary" onClick={runReview} disabled={isRunning || isLoadingCases || !userCode?.trim()}>
            {isRunning ? <><Loader2 size={15} className="ag-spin" /> Reviewing…</> : <><Play size={14} /> {summary ? 'Run again' : 'Run review'}</>}
          </button>

          {summary && (
            <div className={`ag-summary ${allPassed ? 'is-pass' : 'is-fail'}`}>
              {allPassed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <div>
                <strong>{summary.passedTests} of {summary.totalTests} tests passed</strong>
                <span>{allPassed ? 'Nice — every case behaves correctly.' : 'Open a failed test to see what went wrong.'}</span>
              </div>
            </div>
          )}

          <section className="ag-section">
            <h3>Tests</h3>
            {isLoadingCases ? (
              <p className="ag-muted">Preparing edge cases…</p>
            ) : (
              <ul className="ag-tests">
                {(summary?.results || [
                  ...(question.expectedOutput ? [{ name: 'Sample output', stdin: '' }] : []),
                  ...edgecases.map((ec) => ({ name: ec.name, stdin: ec.stdin, expected: ec.expectedBehavior })),
                ]).map((t, i) => {
                  const ran = Boolean(summary);
                  const open = openRow === i;
                  return (
                    <li key={i} className={ran ? (t.passed ? 'pass' : 'fail') : ''}>
                      <button className="ag-test-row" onClick={() => setOpenRow(open ? null : i)} aria-expanded={open}>
                        <span className="ag-test-dot" />
                        <span className="ag-test-name">{t.name}</span>
                        <ChevronDown size={14} className={`ag-chev${open ? ' open' : ''}`} />
                      </button>
                      {open && (
                        <div className="ag-test-detail">
                          <label>Input</label>
                          <pre>{t.stdin?.trim() || '(none)'}</pre>
                          {t.expected && <><label>Expected</label><pre>{t.expected}</pre></>}
                          {ran && <><label>Your output</label><pre>{t.actual || '(no output)'}</pre></>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {style && (
            <section className="ag-section">
              <h3>Style <span className="ag-score">{style.score}/100</span></h3>
              {style.violations.length === 0 ? (
                <p className="ag-muted">Follows FAST PF-lab conventions.</p>
              ) : (
                <ul className="ag-issues">
                  {style.violations.map((v, i) => (
                    <li key={i}><strong>{v.rule}</strong><span>{v.message}</span></li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
