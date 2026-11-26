import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuestions } from '../context/QuestionsContext';
import { QUESTION_TYPES, QUESTION_TYPE_SCHEMAS } from '../data/questionSchemas';
import {
  Plus,
  Copy,
  Check,
  Send,
  Edit2,
  Trash2,
  Code2,
  Search,
  FileJson,
  Download,
  RotateCcw,
  Layers,
  HelpCircle,
  X,
  Eye,
} from 'lucide-react';

export default function Cms() {
  const {
    questions,
    subjects,
    isLiveConnected,
    localCustomCount,
    saveQuestionLocally,
    deleteQuestionLocally,
    streamQuestionToSupabase,
    resetLocalCms,
  } = useQuestions();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');

  // Modals / Drawers State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [questionToStream, setQuestionToStream] = useState(null);
  const [activeSchemaTab, setActiveSchemaTab] = useState('dry_run');
  const [editorTab, setEditorTab] = useState('form'); // 'form' | 'json'

  // Clipboard Copied State
  const [copiedId, setCopiedId] = useState(null);
  const [streamStatus, setStreamStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [streamError, setStreamError] = useState(null);

  // Form State
  const [formType, setFormType] = useState('dry_run');
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'loops',
    difficulty: 'easy',
    statement: '',
    code: '',
    starterCode: '',
    expectedOutput: '',
    latexExpression: '',
    explanation: '',
    hintsText: '',
    tagsText: '',
  });

  // Filtered Questions List
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        searchTerm === '' ||
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.tags && q.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchSubject = subjectFilter === 'all' || q.subjectId === subjectFilter;
      const matchType = typeFilter === 'all' || q.type === typeFilter;
      const matchDiff = diffFilter === 'all' || q.difficulty === diffFilter;

      return matchSearch && matchSubject && matchType && matchDiff;
    });
  }, [questions, searchTerm, subjectFilter, typeFilter, diffFilter]);

  // Handle open editor for new question
  const handleOpenNewQuestion = () => {
    const template = QUESTION_TYPE_SCHEMAS[formType] || QUESTION_TYPE_SCHEMAS.dry_run;
    const generatedId = `${template.subjectId}-${template.subcategoryId}-${Date.now().toString().slice(-4)}`;
    setEditingQuestion(null);
    setFormData({
      id: generatedId,
      title: '',
      subjectId: template.subjectId,
      categoryId: template.categoryId,
      subcategoryId: template.subcategoryId,
      difficulty: 'easy',
      statement: template.statement || '',
      code: template.code || '',
      starterCode: template.starterCode || '',
      expectedOutput: template.expectedOutput || '',
      latexExpression: template.latexExpression || '',
      explanation: template.explanation || '',
      hintsText: (template.hints || []).join('\n'),
      tagsText: (template.tags || []).join(', '),
    });
    setFormType(template.type || 'dry_run');
    setEditorTab('form');
    setEditorOpen(true);
  };

  // Handle open editor for existing question
  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setFormType(q.type || 'dry_run');
    setFormData({
      id: q.id,
      title: q.title || '',
      subjectId: q.subjectId || 'pf',
      categoryId: q.categoryId || 'dry-runs',
      subcategoryId: q.subcategoryId || 'loops',
      difficulty: q.difficulty || 'easy',
      statement: q.statement || '',
      code: q.code || '',
      starterCode: q.starterCode || q.code || '',
      expectedOutput: q.expectedOutput || '',
      latexExpression: q.latexExpression || '',
      explanation: q.explanation || '',
      hintsText: (q.hints || []).join('\n'),
      tagsText: (q.tags || []).join(', '),
    });
    setEditorTab('form');
    setEditorOpen(true);
  };

  // When form type changes in editor, optionally load template fields if empty
  const handleTypeChange = (newType) => {
    setFormType(newType);
    const tmpl = QUESTION_TYPE_SCHEMAS[newType];
    if (tmpl && !editingQuestion) {
      setFormData((prev) => ({
        ...prev,
        statement: prev.statement || tmpl.statement || '',
        code: prev.code || tmpl.code || '',
        starterCode: prev.starterCode || tmpl.starterCode || '',
        expectedOutput: prev.expectedOutput || tmpl.expectedOutput || '',
        latexExpression: prev.latexExpression || tmpl.latexExpression || '',
        explanation: prev.explanation || tmpl.explanation || '',
      }));
    }
  };

  // Compute live JSON object from the active form data
  const currentFormJSON = useMemo(() => {
    return {
      id: formData.id || 'unassigned-id',
      type: formType,
      subjectId: formData.subjectId,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      title: formData.title || 'Untitled Question',
      difficulty: formData.difficulty,
      statement: formData.statement || '',
      code: formType === 'dry_run' || formType === 'code_submit' ? formData.code : undefined,
      starterCode: formType === 'code_submit' ? formData.starterCode : undefined,
      expectedOutput: formData.expectedOutput || '',
      latexExpression:
        formType === 'math_input' || formType === 'math_study' ? formData.latexExpression : undefined,
      explanation: formData.explanation || '',
      hints: formData.hintsText
        ? formData.hintsText
            .split('\n')
            .map((h) => h.trim())
            .filter(Boolean)
        : [],
      tags: formData.tagsText
        ? formData.tagsText
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
  }, [formData, formType]);

  // Copy helper
  const copyToClipboard = (text, idKey = 'generic') => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save question locally
  const handleSaveLocally = (e) => {
    if (e) e.preventDefault();
    if (!formData.id.trim() || !formData.title.trim()) {
      alert('Question ID and Title are required.');
      return;
    }
    saveQuestionLocally(currentFormJSON);
    setEditorOpen(false);
  };

  // Open stream review modal
  const handleOpenStreamModal = (q) => {
    setQuestionToStream(q);
    setStreamStatus(null);
    setStreamError(null);
    setStreamModalOpen(true);
  };

  // Execute Supabase streaming
  const handleExecuteStream = async () => {
    if (!questionToStream) return;
    setStreamStatus('loading');
    setStreamError(null);

    const res = await streamQuestionToSupabase(questionToStream);
    if (res.success) {
      setStreamStatus('success');
      setTimeout(() => {
        setStreamModalOpen(false);
        setStreamStatus(null);
      }, 1800);
    } else {
      setStreamStatus('error');
      setStreamError(res.error?.message || 'Streaming to Supabase failed');
    }
  };

  // Export full question bank as JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fastudy_questions_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const currentSubjectObj = subjects.find((s) => s.id === formData.subjectId);

  return (
    <div className="page-container cms-page">
      {/* CMS Header */}
      <header className="page-intro cms-intro">
        <div>
          <div className="cms-badge-row">
            <span className="cms-badge">LOCAL CONTENT MANAGER</span>
            {isLiveConnected ? (
              <span className="cms-status-pill live">
                <span className="status-dot green" />
                <span>Supabase Live Stream</span>
              </span>
            ) : (
              <span className="cms-status-pill local">
                <span className="status-dot amber" />
                <span>Local Dataset Only</span>
              </span>
            )}
            {localCustomCount > 0 && (
              <span className="cms-status-pill custom">
                <span>{localCustomCount} custom override(s)</span>
              </span>
            )}
          </div>
          <h1>Question Bank & Schema CMS</h1>
          <p>
            Create and edit questions locally, inspect copy-pastable JSON schemas for each problem type, and
            stream questions directly to the database.
          </p>
        </div>

        <div className="cms-header-actions">
          <button className="btn-secondary" onClick={() => setSchemaModalOpen(true)} title="View schema templates">
            <FileJson size={14} />
            <span>Schema Blueprints</span>
          </button>
          <button className="btn-secondary" onClick={handleExportJSON} title="Download questions as JSON">
            <Download size={14} />
            <span>Export Bank</span>
          </button>
          <button className="btn-primary" onClick={handleOpenNewQuestion}>
            <Plus size={15} />
            <span>New Question</span>
          </button>
        </div>
      </header>

      {/* Quick Type Template Cards Banner */}
      <div className="schema-types-banner">
        <div className="schema-banner-header">
          <Layers size={14} />
          <span>SUPPORTED PROBLEM TYPES & COPY-PASTABLE SCHEMAS</span>
        </div>
        <div className="schema-types-grid">
          {QUESTION_TYPES.map((t) => {
            const tmpl = QUESTION_TYPE_SCHEMAS[t.id];
            return (
              <div key={t.id} className="schema-type-card">
                <div className="schema-type-card-top">
                  <span className="schema-type-name">{t.name}</span>
                  <button
                    className="btn-copy-schema-pill"
                    onClick={() => copyToClipboard(tmpl, `type_${t.id}`)}
                    title="Copy this type's complete JSON schema"
                  >
                    {copiedId === `type_${t.id}` ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId === `type_${t.id}` ? 'Copied' : 'Copy Schema'}</span>
                  </button>
                </div>
                <p className="schema-type-desc">{t.description}</p>
                <div className="schema-type-meta">
                  <code>type: "{t.id}"</code>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="cms-toolbar-card">
        <div className="cms-search-box">
          <Search size={15} className="cms-search-icon" />
          <input
            type="text"
            placeholder="Search by ID, title, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn-clear-search" onClick={() => setSearchTerm('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="cms-filters-group">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="cms-filter-select"
          >
            <option value="all">All Subjects</option>
            <option value="pf">Programming Fundamentals (PF)</option>
            <option value="calculus">Calculus & Geometry</option>
            <option value="physics">Applied Physics</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="cms-filter-select"
          >
            <option value="all">All Problem Types</option>
            <option value="dry_run">Dry Run (Code Trace)</option>
            <option value="code_submit">Logic Building (Judge0)</option>
            <option value="math_input">Math / Calculus Input</option>
            <option value="math_study">Math Derivation / Study</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            className="cms-filter-select"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {localCustomCount > 0 && (
            <button
              className="btn-secondary cms-btn-reset"
              onClick={() => {
                if (confirm('Reset all locally created and modified questions back to default?')) {
                  resetLocalCms();
                }
              }}
              title="Reset local changes"
            >
              <RotateCcw size={13} />
              <span>Reset Local</span>
            </button>
          )}
        </div>
      </div>

      {/* Questions Data Table */}
      <div className="cms-table-card">
        <div className="cms-table-header">
          <div>
            <h3>Questions Repository</h3>
            <span className="cms-counter-text">
              Showing {filteredQuestions.length} of {questions.length} total questions
            </span>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="cms-empty-state">
            <HelpCircle size={32} />
            <p>No questions matched your filter criteria.</p>
            <button className="btn-secondary" onClick={() => { setSearchTerm(''); setSubjectFilter('all'); setTypeFilter('all'); setDiffFilter('all'); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="cms-table-wrapper">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Question ID</th>
                  <th>Title & Classification</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Source</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr key={q.id}>
                    <td className="cms-cell-id">
                      <code>{q.id}</code>
                    </td>
                    <td className="cms-cell-title">
                      <strong>{q.title}</strong>
                      <div className="cms-row-subtext">
                        <span>{q.subjectId?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{q.categoryId}</span>
                        {q.subcategoryId && (
                          <>
                            <span>/</span>
                            <span>{q.subcategoryId}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`cms-type-tag type-${q.type || 'dry_run'}`}>
                        {q.type || 'dry_run'}
                      </span>
                    </td>
                    <td>
                      <span className={`diff-tag diff-${q.difficulty || 'easy'}`}>
                        {q.difficulty || 'easy'}
                      </span>
                    </td>
                    <td>
                      {q._isLocal ? (
                        <span className="cms-source-tag local">Local CMS</span>
                      ) : (
                        <span className="cms-source-tag bank">Bundled Bank</span>
                      )}
                    </td>
                    <td>
                      <div className="cms-actions-cell">
                        {/* Copy Schema Button */}
                        <button
                          className="cms-icon-btn"
                          onClick={() => copyToClipboard(q, q.id)}
                          title="Copy full JSON schema of this question"
                        >
                          {copiedId === q.id ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                        </button>

                        {/* Stream to Supabase */}
                        <button
                          className="cms-icon-btn stream"
                          onClick={() => handleOpenStreamModal(q)}
                          title="Review schema & stream to Supabase"
                        >
                          <Send size={13} />
                        </button>

                        {/* Edit */}
                        <button
                          className="cms-icon-btn"
                          onClick={() => handleOpenEditQuestion(q)}
                          title="Edit Question"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Preview / Solve */}
                        <Link
                          to={`/question/${q.id}`}
                          className="cms-icon-btn"
                          title="Open in Question Viewer"
                        >
                          <Eye size={13} />
                        </Link>

                        {/* Delete */}
                        <button
                          className="cms-icon-btn delete"
                          onClick={() => {
                            if (confirm(`Delete question "${q.id}" from local bank?`)) {
                              deleteQuestionLocally(q.id);
                            }
                          }}
                          title="Delete locally"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================================
          1. QUESTION EDITOR MODAL / DRAWER
          ===================================================================== */}
      {editorOpen && (
        <div className="modal-backdrop" onClick={() => setEditorOpen(false)}>
          <div className="modal-dialog cms-editor-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="auth-brand-badge">
                  <Code2 size={12} />
                  <span>{editingQuestion ? 'EDIT QUESTION' : 'NEW QUESTION'}</span>
                </span>
                <h3 className="modal-title">
                  {editingQuestion ? `Edit: ${editingQuestion.id}` : 'Create New Practice Problem'}
                </h3>
              </div>
              <button className="modal-close" onClick={() => setEditorOpen(false)}>
                <X size={17} />
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="cms-type-selector-strip">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`cms-type-select-btn ${formType === t.id ? 'active' : ''}`}
                  onClick={() => handleTypeChange(t.id)}
                >
                  <span>{t.name}</span>
                </button>
              ))}
            </div>

            {/* View Mode Switcher: Form vs Copy-Pastable Schema */}
            <div className="cms-editor-tab-strip">
              <button
                type="button"
                className={`cms-editor-tab-btn ${editorTab === 'form' ? 'active' : ''}`}
                onClick={() => setEditorTab('form')}
              >
                <span>Visual Editor</span>
              </button>
              <button
                type="button"
                className={`cms-editor-tab-btn ${editorTab === 'json' ? 'active' : ''}`}
                onClick={() => setEditorTab('json')}
              >
                <FileJson size={13} />
                <span>Copy-Pastable Schema (JSON)</span>
              </button>
            </div>

            {/* Form Mode */}
            {editorTab === 'form' ? (
              <form onSubmit={handleSaveLocally} className="cms-form-scroll">
                <div className="form-row">
                  <div className="input-group">
                    <label>Question ID *</label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="e.g. pf-loops-101"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Tracing Nested While Loop Accumulator"
                    required
                  />
                </div>

                <div className="form-row three-col">
                  <div className="input-group">
                    <label>Subject</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => {
                        const newSub = e.target.value;
                        const subObj = subjects.find((s) => s.id === newSub);
                        const firstCat = subObj?.categories?.[0]?.id || '';
                        const firstSubCat = subObj?.categories?.[0]?.subcategories?.[0]?.id || '';
                        setFormData({
                          ...formData,
                          subjectId: newSub,
                          categoryId: firstCat,
                          subcategoryId: firstSubCat,
                        });
                      }}
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      placeholder="e.g. dry-runs"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Subcategory</label>
                    <input
                      type="text"
                      value={formData.subcategoryId}
                      onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                      placeholder="e.g. loops"
                      required
                    />
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Problem Statement / Prompt</label>
                  <textarea
                    rows={2}
                    value={formData.statement}
                    onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                    placeholder="Instructions shown to the student..."
                  />
                </div>

                {/* Conditional Code Field for dry_run / code_submit */}
                {(formType === 'dry_run' || formType === 'code_submit') && (
                  <div className="input-group full-width">
                    <label>C / C++ Source Code to Trace</label>
                    <textarea
                      rows={6}
                      className="code-textarea"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="#include <stdio.h>&#10;&#10;int main() {&#10;    ...&#10;}"
                    />
                  </div>
                )}

                {/* Conditional Starter Code for code_submit */}
                {formType === 'code_submit' && (
                  <div className="input-group full-width">
                    <label>Starter Code for Student Editor (Judge0)</label>
                    <textarea
                      rows={4}
                      className="code-textarea"
                      value={formData.starterCode}
                      onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                      placeholder="// Starter template..."
                    />
                  </div>
                )}

                {/* Conditional LaTeX Formula for math types */}
                {(formType === 'math_input' || formType === 'math_study') && (
                  <div className="input-group full-width">
                    <label>KaTeX Math Expression</label>
                    <input
                      type="text"
                      value={formData.latexExpression}
                      onChange={(e) => setFormData({ ...formData, latexExpression: e.target.value })}
                      placeholder="e.g. \lim_{x \to 0} \frac{\sin x}{x}"
                    />
                  </div>
                )}

                <div className="input-group full-width">
                  <label>Expected Answer / Evaluation Output *</label>
                  <input
                    type="text"
                    value={formData.expectedOutput}
                    onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                    placeholder="Exact correct answer string..."
                    required
                  />
                </div>

                <div className="input-group full-width">
                  <label>Explanation / Walkthrough</label>
                  <textarea
                    rows={3}
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Step-by-step reasoning shown after solving..."
                  />
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Hints (One per line)</label>
                    <textarea
                      rows={2}
                      value={formData.hintsText}
                      onChange={(e) => setFormData({ ...formData, hintsText: e.target.value })}
                      placeholder="Hint 1&#10;Hint 2"
                    />
                  </div>
                  <div className="input-group">
                    <label>Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tagsText}
                      onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })}
                      placeholder="c, pointers, memory"
                    />
                  </div>
                </div>

                <div className="modal-actions-bar">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => copyToClipboard(currentFormJSON, 'editor_form')}
                  >
                    {copiedId === 'editor_form' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === 'editor_form' ? 'Copied JSON!' : 'Copy Schema'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleOpenStreamModal(currentFormJSON)}
                  >
                    <Send size={14} />
                    <span>Review & Stream to Cloud</span>
                  </button>
                  <button type="submit" className="btn-primary">
                    <span>Save Locally</span>
                  </button>
                </div>
              </form>
            ) : (
              /* JSON Schema Preview Mode */
              <div className="cms-json-preview-container">
                <div className="cms-json-toolbar">
                  <span>Exact schema for this question:</span>
                  <button
                    className="btn-primary"
                    onClick={() => copyToClipboard(currentFormJSON, 'editor_json')}
                  >
                    {copiedId === 'editor_json' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === 'editor_json' ? 'Copied to Clipboard!' : 'Copy JSON Schema'}</span>
                  </button>
                </div>
                <pre className="cms-json-codeblock">
                  <code>{JSON.stringify(currentFormJSON, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          2. PRE-STREAM SCHEMA REVIEW MODAL
          (Crucial requirement: shows copy-pastable schema before streaming!)
          ===================================================================== */}
      {streamModalOpen && questionToStream && (
        <div className="modal-backdrop" onClick={() => setStreamModalOpen(false)}>
          <div className="modal-dialog cms-stream-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="auth-brand-badge">
                  <Send size={12} />
                  <span>PRE-STREAM SCHEMA REVIEW</span>
                </span>
                <h3 className="modal-title">Review Schema Before Streaming</h3>
                <p className="modal-subtitle">
                  Verify the exact payload that will be upserted to Supabase <code>public.questions</code>:
                </p>
              </div>
              <button className="modal-close" onClick={() => setStreamModalOpen(false)}>
                <X size={17} />
              </button>
            </div>

            {streamStatus === 'success' && (
              <div className="auth-alert success">
                <Check size={16} />
                <span>Question streamed successfully to Supabase! Live sync is updated.</span>
              </div>
            )}

            {streamStatus === 'error' && (
              <div className="auth-alert error">
                <X size={16} />
                <span>{streamError || 'Failed to stream question to Supabase.'}</span>
              </div>
            )}

            <div className="cms-stream-schema-box">
              <div className="cms-json-toolbar">
                <span className="cms-payload-label">Copy-pastable Database Schema Payload:</span>
                <button
                  type="button"
                  className="btn-secondary cms-btn-copy-small"
                  onClick={() => copyToClipboard(questionToStream, 'stream_schema')}
                >
                  {copiedId === 'stream_schema' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedId === 'stream_schema' ? 'Copied!' : 'Copy Payload'}</span>
                </button>
              </div>
              <pre className="cms-json-codeblock stream-codeblock">
                <code>{JSON.stringify(questionToStream, null, 2)}</code>
              </pre>
            </div>

            <div className="cms-stream-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStreamModalOpen(false)}
                disabled={streamStatus === 'loading'}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleExecuteStream}
                disabled={streamStatus === 'loading'}
              >
                <Send size={14} />
                <span>{streamStatus === 'loading' ? 'Streaming...' : 'Confirm & Stream to Cloud'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. TYPE SCHEMAS BLUEPRINT MODAL
          ===================================================================== */}
      {schemaModalOpen && (
        <div className="modal-backdrop" onClick={() => setSchemaModalOpen(false)}>
          <div className="modal-dialog cms-schema-blueprint-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="auth-brand-badge">
                  <FileJson size={12} />
                  <span>SCHEMA SPECIFICATION</span>
                </span>
                <h3 className="modal-title">Problem Types & JSON Blueprints</h3>
                <p className="modal-subtitle">
                  Select any question type below to copy its standard schema template:
                </p>
              </div>
              <button className="modal-close" onClick={() => setSchemaModalOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div className="cms-blueprint-tabs">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  className={`cms-blueprint-tab-btn ${activeSchemaTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveSchemaTab(t.id)}
                >
                  <span>{t.name}</span>
                </button>
              ))}
            </div>

            <div className="cms-blueprint-content">
              <div className="cms-json-toolbar">
                <span>{QUESTION_TYPES.find((t) => t.id === activeSchemaTab)?.description}</span>
                <button
                  className="btn-primary"
                  onClick={() =>
                    copyToClipboard(
                      QUESTION_TYPE_SCHEMAS[activeSchemaTab],
                      `blueprint_${activeSchemaTab}`
                    )
                  }
                >
                  {copiedId === `blueprint_${activeSchemaTab}` ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === `blueprint_${activeSchemaTab}` ? 'Copied Template!' : 'Copy Schema Template'}</span>
                </button>
              </div>
              <pre className="cms-json-codeblock">
                <code>{JSON.stringify(QUESTION_TYPE_SCHEMAS[activeSchemaTab], null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
