import { Link } from 'react-router-dom';
import { subjects, questions } from '../data/questionBank';
import { useProfile } from '../context/ProfileContext';
import { ArrowRight } from 'lucide-react';

function subjectProgress(subject, solvedQuestions) {
  const subjectQuestions = questions.filter((question) => question.subjectId === subject.id);
  const solved = subjectQuestions.filter((question) => solvedQuestions.includes(question.id)).length;

  return {
    total: subjectQuestions.length,
    solved,
    percentage: subjectQuestions.length ? Math.round((solved / subjectQuestions.length) * 100) : 0,
  };
}

export default function Home() {
  const { solvedQuestions } = useProfile();

  return (
    <div className="page-container edtech-dashboard">
      <section className="dashboard-courses-section" aria-labelledby="courses-heading">
        <div className="dashboard-section-heading">
          <div>
            <p className="card-overline">Course spaces</p>
            <h2 id="courses-heading">Continue by subject</h2>
          </div>
          <Link to="/practice" className="text-action">View course directory <ArrowRight size={14} /></Link>
        </div>

        <div className="course-space-grid">
          {subjects.map((subject) => {
            const progress = subjectProgress(subject, solvedQuestions);
            return (
              <Link key={subject.id} to={`/practice/${subject.id}`} className="course-space-card">
                <div className="course-space-card-top">
                  <span className="course-code">{subject.shortName}</span>
                  <ArrowRight size={16} />
                </div>
                <h3>{subject.name}</h3>
                <p>{subject.description}</p>
                <div className="course-progress-label"><span>{progress.solved} of {progress.total} solved</span><span>{progress.percentage}%</span></div>
                <div className="course-progress-track"><span style={{ width: `${progress.percentage}%` }} /></div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
