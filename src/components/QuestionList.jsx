import { Link, useParams } from 'react-router-dom';
import { useQuestions } from '../context/QuestionsContext';
import { useProfile } from '../context/ProfileContext';
import { CheckCircle2, Circle, ChevronRight, Terminal, ArrowUpRight } from 'lucide-react';

export default function QuestionList() {
  const { subjectId, categoryId, subcategoryId } = useParams();
  const { getQuestionsByFilter, subjects } = useQuestions();
  const { solvedQuestions } = useProfile();

  const questions = getQuestionsByFilter(subjectId, categoryId, subcategoryId);

  const subject = subjects.find((s) => s.id === subjectId);
  const category = subject?.categories.find((c) => c.id === categoryId);
  const subcategory = category?.subcategories.find(
    (s) => s.id === subcategoryId
  );

  const solvedCount = solvedQuestions.filter((id) =>
    questions.some((q) => q.id === id)
  ).length;
  const unsolvedQuestion = questions.find((question) => !solvedQuestions.includes(question.id));
  const completedPercent = questions.length ? Math.round((solvedCount / questions.length) * 100) : 0;
  const activeTitle = subcategory?.name || category?.name || subject?.name || 'Practice library';

  return (
    <div className="ledger-container">
      {/* Practice context and progress */}
      <div className="ledger-top-bar">
        <div className="ledger-meta-group">
          <nav className="ledger-breadcrumbs" aria-label="Breadcrumbs">
            <Link to="/practice" className="breadcrumb-step">Practice</Link>
            <ChevronRight size={13} className="breadcrumb-divider" />
            {subject && (
              <Link to={`/practice/${subjectId}`} className="breadcrumb-step">
                {subject.shortName}
              </Link>
            )}
            {category && (
              <>
                <ChevronRight size={13} className="breadcrumb-divider" />
                <span className="breadcrumb-current">{category.name}</span>
              </>
            )}
            {subcategory && (
              <>
                <ChevronRight size={13} className="breadcrumb-divider" />
                <span className="breadcrumb-current">{subcategory.name}</span>
              </>
            )}
          </nav>
          <h1 className="ledger-title">{activeTitle}</h1>
          <p className="ledger-description">
            {subcategory
              ? `Work through ${questions.length} questions in this topic at your own pace.`
              : 'Choose a question to start practicing.'}
          </p>
        </div>

        <div className="ledger-progress-summary">
          <div className="ledger-stat-counter">
            <span className="stat-counter-val">{solvedCount} / {questions.length}</span>
            <span className="stat-counter-lbl">Completed</span>
          </div>
          <div className="ledger-progress-track"><span style={{ width: `${completedPercent}%` }} /></div>
          {unsolvedQuestion && (
            <Link to={`/question/${unsolvedQuestion.id}`} className="ledger-next-link">
              Continue <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Engineering Problem Ledger Table */}
      <div className="ledger-table-wrapper">
        <table className="ledger-table">
          <thead>
            <tr>
              <th className="col-status-cell">Status</th>
              <th className="col-title-cell">Question</th>
              <th className="col-difficulty-cell">Difficulty</th>
              <th className="col-tags-cell">Concepts</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const isSolved = solvedQuestions.includes(q.id);
              return (
                <tr key={q.id} className={`ledger-row ${isSolved ? 'row-solved' : ''}`}>
                  <td className="col-status-cell">
                    {isSolved ? (
                      <CheckCircle2 size={15} className="status-icon-solved" title="Solved" />
                    ) : (
                      <Circle size={14} className="status-icon-unsolved" title="Unsolved" />
                    )}
                  </td>
                  <td className="col-title-cell">
                    <Link to={`/question/${q.id}`} className="problem-link-anchor">
                      <span>{q.title}</span>
                      <ArrowUpRight size={13} className="problem-link-arrow" />
                    </Link>
                  </td>
                  <td className="col-difficulty-cell">
                    <span className={`diff-badge diff-${q.difficulty}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="col-tags-cell">
                    <div className="concept-tags-group">
                      {(q.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="concept-tag">
                          {tag}
                        </span>
                      ))}
                      {(q.tags || []).length > 2 && <span className="concept-tag">+{q.tags.length - 2}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {questions.length === 0 && (
              <tr>
                <td colSpan={4} className="ledger-empty-cell">
                  <div className="empty-message-wrap">
                    <Terminal size={18} />
                    <span>{subject ? 'No problems in this topic yet. Pick another topic from the sidebar.' : 'This course doesn’t exist. Go back to the course directory.'}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

