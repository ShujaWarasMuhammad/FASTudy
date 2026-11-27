import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, RotateCcw } from 'lucide-react';
import { askGeminiTutor } from '../utils/gemini';
import AiResponseContent from './AiResponseContent';

const SUGGESTIONS = [
  { label: 'Give me a hint', mode: 'hint' },
  { label: 'Explain the idea', mode: 'explain' },
  { label: 'Trace it step by step', mode: 'trace' },
];

export default function AiTutorDrawer({ question, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setMessages([]); }, [question?.id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !question) return null;

  const send = async (text, mode = 'chat') => {
    const content = text.trim();
    if (!content || isLoading) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text: content }]);
    setInput('');
    setIsLoading(true);
    const res = await askGeminiTutor({ question, userQuery: content, conversationHistory: history, mode });
    setIsLoading(false);
    setMessages((prev) => [...prev, { role: 'ai', text: res.success ? res.text : `Sorry, I couldn’t answer that. ${res.error}`, error: !res.success }]);
  };

  return (
    <div className="ag-backdrop" onMouseDown={onClose}>
      <aside className="ag-panel" onMouseDown={(e) => e.stopPropagation()} aria-label="AI tutor">
        <header className="ag-head">
          <span className="ag-icon ag-icon-ai"><Sparkles size={15} /></span>
          <div className="ag-titles">
            <h2>AI Tutor</h2>
            <p>{question.title}</p>
          </div>
          {messages.length > 0 && (
            <button className="ag-btn-icon" onClick={() => setMessages([])} title="New conversation" aria-label="New conversation"><RotateCcw size={15} /></button>
          )}
          <button className="ag-btn-icon" onClick={onClose} title="Close (Esc)" aria-label="Close"><X size={16} /></button>
        </header>

        <div className="ag-body">
          {messages.length === 0 ? (
            <div className="ag-empty">
              <p className="ag-empty-title">How can I help?</p>
              <p className="ag-empty-sub">I’ll guide you without giving away the answer.</p>
              <div className="ag-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s.mode} className="ag-suggestion" onClick={() => send(s.label, s.mode)}>{s.label}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ag-messages">
              {messages.map((m, i) => (
                <div key={i} className={`ag-msg ag-msg-${m.role}${m.error ? ' ag-msg-error' : ''}`}>
                  {m.role === 'ai' ? <AiResponseContent text={m.text} /> : m.text}
                </div>
              ))}
              {isLoading && <div className="ag-msg ag-msg-ai ag-typing"><span /><span /><span /></div>}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form className="ag-compose" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask about this problem…"
            disabled={isLoading}
          />
          <button type="submit" className="ag-send" disabled={!input.trim() || isLoading} aria-label="Send"><Send size={15} /></button>
        </form>
      </aside>
    </div>
  );
}
