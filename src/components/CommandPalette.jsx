import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, FileCode2, Sun } from 'lucide-react';
import { NAV_ITEMS } from '../config/navigation';
import { useQuestions } from '../context/QuestionsContext';
import { useTheme } from '../context/ThemeContext';

/** Ctrl/⌘+K launcher: jump to any page, course, topic or problem. */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { questions, subjects } = useQuestions();
  const { toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const items = useMemo(() => {
    const pages = NAV_ITEMS.map((n) => ({ group: 'Pages', label: n.label, sub: n.hint, icon: n.icon, to: n.to }));
    const topics = subjects.flatMap((s) => [
      { group: 'Courses', label: s.name, sub: `${s.shortName} · all topics`, icon: NAV_ITEMS[1].icon, to: `/practice/${s.id}` },
      ...s.categories.flatMap((c) =>
        c.subcategories.map((sc) => ({
          group: 'Topics', label: `${c.name} · ${sc.name}`, sub: s.name, icon: NAV_ITEMS[1].icon,
          to: `/practice/${s.id}/${c.id}/${sc.id}`,
        }))
      ),
    ]);
    const problems = questions.map((q) => ({
      group: 'Problems', label: q.title, sub: `${q.subjectId.toUpperCase()} · ${q.difficulty}`, icon: FileCode2, to: `/question/${q.id}`,
      keywords: `${q.id} ${(q.tags || []).join(' ')}`,
    }));
    const actions = [{ group: 'Actions', label: 'Toggle light / dark theme', sub: 'Appearance', icon: Sun, run: toggleTheme }];
    const all = [...pages, ...actions, ...topics, ...problems];
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [...pages, ...actions, ...topics.filter((t) => t.group === 'Courses')];
    return all
      .filter((i) => {
        const hay = `${i.label} ${i.sub} ${i.keywords || ''}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 40);
  }, [query, questions, subjects, toggleTheme]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const choose = (item) => {
    if (!item) return;
    onClose();
    if (item.run) item.run();
    else navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(items[active]); }
    else if (e.key === 'Escape') onClose();
  };

  let lastGroup = null;
  return (
    <div className="cmdk-backdrop" onMouseDown={onClose}>
      <div className="cmdk" role="dialog" aria-label="Search FASTudy" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, topics or problems…"
            aria-label="Search"
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="cmdk-list" ref={listRef} role="listbox">
          {items.length === 0 && <li className="cmdk-empty">No matches for “{query}”.</li>}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <li key={`${item.group}-${item.to || item.label}`}>
                {header && <div className="cmdk-group">{header}</div>}
                <button
                  type="button"
                  className="cmdk-item"
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(item)}
                  role="option"
                  aria-selected={i === active}
                >
                  <span className="cmdk-icon"><Icon size={15} /></span>
                  <span className="cmdk-text">
                    <span className="cmdk-label">{item.label}</span>
                    <span className="cmdk-sub">{item.sub}</span>
                  </span>
                  {i === active && <CornerDownLeft size={14} className="cmdk-enter" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Ctrl</kbd><kbd>K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
