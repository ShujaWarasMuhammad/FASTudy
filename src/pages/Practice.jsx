import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import QuestionList from '../components/QuestionList';
import SubjectPicker from '../components/SubjectPicker';

export default function Practice() {
  const { subjectId } = useParams();

  if (!subjectId) {
    return (
      <div className="practice-page">
        <SubjectPicker />
      </div>
    );
  }

  return (
    <div className="practice-page with-sidebar">
      <Sidebar subjectId={subjectId} />
      <div className="practice-content">
        <QuestionList />
      </div>
    </div>
  );
}
