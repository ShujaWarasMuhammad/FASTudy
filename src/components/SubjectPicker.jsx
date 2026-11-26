import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Layers3 } from 'lucide-react';
import { subjects, questions } from '../data/questionBank';
import { useProfile } from '../context/ProfileContext';

export default function SubjectPicker() {
  const { solvedQuestions } = useProfile();

  return (
    <div className="page-container course-directory-page">
      <header className="directory-header">
        <div>
          <p className="dashboard-breadcrumb">Practice / Course directory</p>
          <h1>Choose a course to practice.</h1>
          <p>Every course is organised by syllabus topic, so you can revise a chapter or work through the full bank.</p>
        </div>
        <div className="directory-summary" aria-label="Practice library summary">
          <span><BookOpen size={15} /> {subjects.length} courses</span>
          <span><Layers3 size={15} /> {questions.length} problems</span>
          <span><CheckCircle2 size={15} /> {solvedQuestions.length} solved</span>
        </div>
      </header>

      <section className="directory-grid" aria-label="Available courses">
        {subjects.map((subject) => {
          const courseQuestions = questions.filter((question) => question.subjectId === subject.id);
          const solved = courseQuestions.filter((question) => solvedQuestions.includes(question.id)).length;
          const percentage = courseQuestions.length ? Math.round((solved / courseQuestions.length) * 100) : 0;

          return (
            <Link key={subject.id} to={`/practice/${subject.id}`} className="directory-course-card">
              <div className="directory-course-topline">
                <span className="directory-course-code">{subject.shortName}</span>
                <ArrowRight size={17} />
              </div>
              <h2>{subject.name}</h2>
              <p>{subject.description}</p>
              <div className="directory-topic-list">
                {subject.categories.slice(0, 3).map((category) => (
                  <span key={category.id}>{category.name}</span>
                ))}
                {subject.categories.length > 3 && <span>+{subject.categories.length - 3} more</span>}
              </div>
              <div className="directory-course-footer">
                <div>
                  <span>{solved} of {courseQuestions.length} completed</span>
                  <div className="course-progress-track"><span style={{ width: `${percentage}%` }} /></div>
                </div>
                <strong>{percentage}%</strong>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
