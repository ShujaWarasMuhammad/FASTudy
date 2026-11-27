import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../context/ThemeContext';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

// Clean GitHub light theme style for SyntaxHighlighter
const customLightStyle = {
  'code[class*="language-"]': {
    color: '#24292e',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '1.6',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#24292e',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '1.6',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 4,
    hyphens: 'none',
    padding: '16px',
    margin: 0,
    overflow: 'auto',
    background: '#f6f8fa',
  },
  comment: { color: '#6a737d', fontStyle: 'italic' },
  string: { color: '#032f62' },
  number: { color: '#005cc5' },
  keyword: { color: '#d73a49', fontWeight: 'bold' },
  operator: { color: '#d73a49' },
  function: { color: '#6f42c1' },
  punctuation: { color: '#24292e' },
  boolean: { color: '#005cc5' },
  directive: { color: '#d73a49' },
};

export default function CodeBlock({ code, language = 'cpp', showCopy = true, fileName = '' }) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-viewer-card">
      <div className="code-viewer-header">
        <span className="code-lang-tag">
          {fileName || { c: 'C', cpp: 'C / C++ Source', python: 'Python', java: 'Java', javascript: 'JavaScript' }[language] || language.toUpperCase()}
        </span>
        {showCopy && (
          <button
            className="code-copy-btn"
            onClick={handleCopy}
            title="Copy code to clipboard"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>

      <div className="code-syntax-wrapper">
        <SyntaxHighlighter
          language={language}
          style={isDark ? vscDarkPlus : customLightStyle}
          customStyle={{
            margin: 0,
            padding: '16px',
            fontSize: '13px',
            lineHeight: '1.6',
            background: isDark ? '#090d13' : '#f6f8fa',
            fontFamily: 'var(--font-mono)',
            border: 'none',
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: isDark ? '#484f58' : '#8c959f',
            userSelect: 'none',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
