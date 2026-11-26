import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, ArrowLeft, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { subjects, questions } from '../data/questionBank';
import { useProfile } from '../context/ProfileContext';

export default function Sidebar({ subjectId }) {
  const params = useParams();
  const { solvedQuestions } = useProfile();
  const subject = subjects.find((item) => item.id === subjectId);
  const [expanded, setExpanded] = useState({
    'dry-runs': true,
    'logic-building': true,
    'bug-hunting': true,
    limits: true,
    mechanics: true,
  });

  if (!subject) return null;

  const subjectQuestions = questions.filter((question) => question.subjectId === subject.id);
  const solved = subjectQuestions.filter((question) => solvedQuestions.includes(question.id)).length;
  const coverage = subjectQuestions.length ? Math.round((solved / subjectQuestions.length) * 100) : 0;

  const toggle = (id) => {
    setExpanded((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  return (
    <aside className="sidebar" aria-label={`${subject.name} navigation`}>
      <Link to="/practice" className="sidebar-back-link"><ArrowLeft size={14} /> All courses</Link>

      <div className="sidebar-header">
        <BookOpen size={16} className="sidebar-header-icon" />
        <div>
          <span className="sidebar-eyebrow">COURSE</span>
          <span className="sidebar-title">{subject.name}</span>
        </div>
      </div>

      <Link to={`/practice/${subjectId}`} className={`sidebar-overview-link ${!params.categoryId ? 'active' : ''}`}>
        <span>All practice</span>
        <span>{subjectQuestions.length}</span>
      </Link>

      <div className="sidebar-coverage">
        <div><span>Your progress</span><strong>{coverage}%</strong></div>
        <div className="course-progress-track"><span style={{ width: `${coverage}%` }} /></div>
        <p>{solved} of {subjectQuestions.length} questions completed</p>
      </div>

      <p className="sidebar-section-label">SYLLABUS</p>
      <div className="sidebar-nav">
        {subject.categories.map((category) => (
          <div key={category.id} className="sidebar-group">
            <button
              className={`sidebar-category-btn ${params.categoryId === category.id ? 'active' : ''}`}
              onClick={() => toggle(category.id)}
              aria-expanded={Boolean(expanded[category.id])}
            >
              <Folder size={15} className="folder-icon" />
              <span className="cat-name">{category.name}</span>
              {expanded[category.id] ? <ChevronDown size={14} className="chevron" /> : <ChevronRight size={14} className="chevron" />}
            </button>

            {expanded[category.id] && (
              <div className="sidebar-sub-list">
                {category.subcategories.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    to={`/practice/${subjectId}/${category.id}/${subcategory.id}`}
                    className={`sidebar-sub-link ${params.subcategoryId === subcategory.id ? 'active' : ''}`}
                  >
                    <span className="sub-bullet">•</span>
                    <span>{subcategory.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
