import { useLocation } from 'react-router-dom';
import { useQuestions } from '../context/QuestionsContext';

export default function Footer() {
  const { isLiveConnected, questions } = useQuestions();
  const { pathname } = useLocation();
  if (pathname.startsWith('/question/')) return null; // full-height workspace, no footer
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-left-col">
          <span className="footer-brand-title">FASTudy</span>
          <span className="footer-sep-dash">—</span>
          <span className="footer-summary-text">
            Structured practice for FAST-NUCES first-year courses.
          </span>
        </div>
        <div className="footer-right-col">
          <span className="footer-status-pill">{questions.length} problems · {isLiveConnected ? 'Live question bank' : 'Local question bank'}</span>
        </div>
      </div>
    </footer>
  );
}

