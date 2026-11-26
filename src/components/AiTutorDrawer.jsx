import { useState, useRef, useEffect } from 'react';
import { askGeminiTutor } from '../utils/gemini';
import {
  Bot,
  User,
  Send,
  X,
  Lightbulb,
  ListOrdered,
  HelpCircle,
  Minimize2,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import AiResponseContent from './AiResponseContent';

export default function AiTutorDrawer({ question, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // When drawer opens on a question, greet if empty
  useEffect(() => {
    if (isOpen && messages.length === 0 && question) {
      setMessages([
        {
          role: 'ai',
          text: `### Ready when you are\nI can help you trace or understand **${question.title}**. Choose a prompt above, or ask a focused question.`,
        },
      ]);
    }
  }, [isOpen, question]);

  if (!isOpen) return null;

  const handleSendQuery = async (customPrompt = null, mode = 'chat') => {
    const textToSend = customPrompt || inputQuery.trim();
    if (!textToSend && mode === 'chat') return;

    if (textToSend) {
      setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    }
    setInputQuery('');
    setIsLoading(true);

    const historyForApi = messages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    const result = await askGeminiTutor({
      question,
      userQuery: textToSend,
      conversationHistory: historyForApi,
      mode: mode,
    });

    setIsLoading(false);

    if (result.success) {
      setMessages((prev) => [...prev, { role: 'ai', text: result.text }]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `⚠️ **AI Tutor Error**: ${result.error}`,
        },
      ]);
    }
  };

  const handleQuickAction = (mode) => {
    handleSendQuery(null, mode);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'ai',
        text: `Chat cleared. Ask me anything about **"${question.title}"**!`,
      },
    ]);
  };

  return (
    <div className={`ai-drawer-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="ai-drawer-header">
        <div className="ai-drawer-brand">
          <Bot size={18} className="ai-brand-icon" />
          <div>
            <h4 className="ai-drawer-title">FASTudy AI Tutor</h4>
            <span className="ai-model-tag">Gemini 2.5 Flash</span>
          </div>
        </div>

        <div className="ai-drawer-controls">
          <button
            className="ai-header-btn"
            onClick={handleClearHistory}
            title="Reset Chat"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="ai-header-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button className="ai-header-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="ai-quick-bar">
        <button
          className="ai-quick-chip"
          onClick={() => handleQuickAction('explain')}
          disabled={isLoading}
        >
          <Lightbulb size={13} />
          <span>Explain Concept</span>
        </button>
        <button
          className="ai-quick-chip"
          onClick={() => handleQuickAction('trace')}
          disabled={isLoading}
        >
          <ListOrdered size={13} />
          <span>Step-by-Step Trace</span>
        </button>
        <button
          className="ai-quick-chip"
          onClick={() => handleQuickAction('hint')}
          disabled={isLoading}
        >
          <HelpCircle size={13} />
          <span>Get Subtle Hint</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="ai-messages-flow">
        {messages.map((m, i) => (
          <div key={i} className={`ai-message-bubble ${m.role}`}>
            <div className="message-sender-tag">
              {m.role === 'ai' ? (
                <>
                  <Bot size={12} className="sender-icon" />
                  <span>AI Tutor</span>
                </>
              ) : (
                <>
                  <User size={12} className="sender-icon" />
                  <span>You</span>
                </>
              )}
            </div>
            <div className="message-body-text">
              {m.role === 'ai' ? <AiResponseContent text={m.text} /> : m.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="ai-message-bubble ai loading">
            <div className="message-sender-tag">
              <Bot size={12} className="sender-icon" />
              <span>AI Tutor</span>
            </div>
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="ai-input-bar">
        <textarea
          className="ai-query-textarea"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendQuery();
            }
          }}
          placeholder="Ask a question about this problem (Enter to send)..."
          rows={1}
        />
        <button
          className="ai-send-btn"
          onClick={() => handleSendQuery()}
          disabled={isLoading || !inputQuery.trim()}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
