import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Layers, Target, Clock } from 'lucide-react';
import { questions } from '../data/questionBank';

export default function SessionGenerator() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState('15');
  const [mode, setMode] = useState('mix');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const getMatchingQuestions = () => {
    let filtered = [...questions];
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(
        (q) => q.subcategoryId === selectedTopic || q.categoryId === selectedTopic
      );
    }
    if (mode === 'speed') {
      filtered = filtered.filter((q) => q.difficulty === 'easy');
    } else if (mode === 'hardcore') {
      filtered = filtered.filter((q) => q.difficulty === 'hard' || q.difficulty === 'medium');
    } else if (mode === 'bug_hunt') {
      filtered = filtered.filter((q) => q.categoryId === 'bug-hunting');
    }

    return filtered.length > 0 ? filtered : questions;
  };

  const matchingQuestions = getMatchingQuestions();

  const handleStartSession = () => {
    const targetList = matchingQuestions;
    const randomQ = targetList[Math.floor(Math.random() * targetList.length)];
    navigate(`/question/${randomQ.id}?session=true&duration=${duration}&mode=${mode}`);
  };

  return (
    <div className="sprint-workbench-card">
      <div className="sprint-card-header">
        <div>
          <span className="sprint-kicker-tag">PRACTICE SESSION</span>
          <h2 className="sprint-heading">Create a focused study block</h2>
          <p className="sprint-subtext">
            Choose the time you have and the kind of practice you want. We will start you on a suitable question.
          </p>
        </div>
      </div>

      <div className="sprint-form-matrix">
        {/* Sprint Duration */}
        <div className="sprint-matrix-col">
          <label className="sprint-field-label">
            <Clock size={13} />
            <span>Available time</span>
          </label>
          <div className="sprint-selector-row">
            {[
              { val: '5', label: '5 min' },
              { val: '15', label: '15 min' },
              { val: '25', label: '25 min' },
              { val: '45', label: '45 min' },
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`sprint-toggle-btn ${duration === item.val ? 'active' : ''}`}
                onClick={() => setDuration(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tracing Mode */}
        <div className="sprint-matrix-col">
          <label className="sprint-field-label">
            <Target size={13} />
            <span>Practice focus</span>
          </label>
          <div className="sprint-selector-row">
            {[
              { id: 'mix', label: 'Mixed practice' },
              { id: 'speed', label: 'Quick wins' },
              { id: 'hardcore', label: 'Challenge me' },
              { id: 'bug_hunt', label: 'Find bugs' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                className={`sprint-toggle-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Syllabus Topic */}
        <div className="sprint-matrix-col span-2">
          <label className="sprint-field-label">
            <Layers size={13} />
            <span>Topic</span>
          </label>
          <div className="sprint-chips-grid">
            {[
              { id: 'all', label: 'Full Syllabus' },
              { id: 'bitwise', label: 'Bitwise Logic' },
              { id: 'loops', label: 'Nested Loops' },
              { id: 'pointers', label: 'Pointer Arithmetic' },
              { id: 'recursion', label: 'Recursion Trees' },
              { id: 'limits', label: 'Calculus Limits' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`sprint-topic-chip ${selectedTopic === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTopic(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sprint-card-actions">
        <button
          type="button"
          onClick={handleStartSession}
          className="btn-start-sprint"
        >
          <Play size={14} fill="currentColor" />
          <span>Start {duration}-minute session</span>
          <ArrowRight size={15} />
        </button>
        <span className="sprint-disclaimer">
          {matchingQuestions.length} matching {matchingQuestions.length === 1 ? 'question' : 'questions'} available.
        </span>
      </div>
    </div>
  );
}

