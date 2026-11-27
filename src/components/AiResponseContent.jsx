import { marked } from 'marked';
import CodeBlock from './CodeBlock';
import MathView from './MathView';

/**
 * Parses LaTeX formulas inside inline text segments.
 * Matches display formulas ($$...$$) and inline formulas ($...$).
 */
function renderTextWithMath(text, keyPrefix = 'txt') {
  if (!text) return null;
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g;
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2).trim();
      return (
        <span key={`${keyPrefix}-disp-${index}`} className="ai-inline-display-math">
          <MathView math={math} displayMode={true} />
        </span>
      );
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1).trim();
      return (
        <MathView key={`${keyPrefix}-inline-${index}`} math={math} displayMode={false} />
      );
    }
    return part;
  });
}

/**
 * Recursively renders inline Markdown tokens (bold, italics, links, inline code, math).
 */
function renderInlineTokens(tokens, keyPrefix = 'in') {
  if (!tokens || !tokens.length) return null;

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${token.type}-${index}`;
    switch (token.type) {
      case 'text':
        return renderTextWithMath(token.text, key);

      case 'strong':
        return (
          <strong key={key} className="markdown-strong">
            {token.tokens ? renderInlineTokens(token.tokens, key) : renderTextWithMath(token.text, key)}
          </strong>
        );

      case 'em':
        return (
          <em key={key} className="markdown-em">
            {token.tokens ? renderInlineTokens(token.tokens, key) : renderTextWithMath(token.text, key)}
          </em>
        );

      case 'codespan':
        return (
          <code key={key} className="markdown-inline-code">
            {token.text}
          </code>
        );

      case 'link':
        return (
          <a
            key={key}
            href={token.href}
            title={token.title || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="markdown-link"
          >
            {token.tokens ? renderInlineTokens(token.tokens, key) : token.text}
          </a>
        );

      case 'del':
        return (
          <del key={key} className="markdown-del">
            {token.tokens ? renderInlineTokens(token.tokens, key) : token.text}
          </del>
        );

      case 'br':
        return <br key={key} />;

      case 'escape':
        return renderTextWithMath(token.text, key);

      default:
        if (token.tokens) return renderInlineTokens(token.tokens, key);
        return renderTextWithMath(token.text || token.raw || '', key);
    }
  });
}

/**
 * Renders tokens inside a list item cleanly without stray block spacing.
 */
function renderListItemTokens(tokens, keyPrefix = 'li') {
  if (!tokens || !tokens.length) return null;

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${token.type}-${index}`;
    if (token.type === 'text' || token.type === 'paragraph') {
      return (
        <span key={key} className="markdown-list-text">
          {token.tokens ? renderInlineTokens(token.tokens, key) : renderTextWithMath(token.text, key)}
        </span>
      );
    }
    if (token.type === 'list') {
      return renderBlockTokens([token], key);
    }
    if (token.type === 'code') {
      return (
        <div key={key} className="ai-markdown-code">
          <CodeBlock code={token.text} language={token.lang || 'c'} />
        </div>
      );
    }
    return renderBlockTokens([token], key);
  });
}

/**
 * Recursively renders top-level block Markdown tokens (headings, lists, code, tables, quotes).
 */
function renderBlockTokens(tokens, keyPrefix = 'blk') {
  if (!tokens || !tokens.length) return null;

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${token.type}-${index}`;
    switch (token.type) {
      case 'heading': {
        const depth = Math.min(Math.max(token.depth || 1, 1), 6);
        const HeadingTag = `h${depth}`;
        return (
          <HeadingTag key={key} className={`markdown-heading markdown-h${depth}`}>
            {token.tokens ? renderInlineTokens(token.tokens, key) : renderTextWithMath(token.text, key)}
          </HeadingTag>
        );
      }

      case 'paragraph': {
        const trimmed = (token.text || '').trim();
        // Check if paragraph is purely a standalone block math formula ($$...$$)
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          const math = trimmed.slice(2, -2).trim();
          return (
            <div key={key} className="ai-math-block">
              <MathView math={math} displayMode={true} />
            </div>
          );
        }
        return (
          <p key={key} className="markdown-p">
            {token.tokens ? renderInlineTokens(token.tokens, key) : renderTextWithMath(token.text, key)}
          </p>
        );
      }

      case 'code':
        return (
          <div key={key} className="ai-markdown-code">
            <CodeBlock code={token.text} language={token.lang || 'c'} />
          </div>
        );

      case 'list': {
        const ListTag = token.ordered ? 'ol' : 'ul';
        return (
          <ListTag
            key={key}
            start={token.ordered && token.start ? token.start : undefined}
            className={`markdown-list ${token.ordered ? 'markdown-ol' : 'markdown-ul'}`}
          >
            {token.items.map((item, itemIdx) => {
              const itemKey = `${key}-item-${itemIdx}`;
              return (
                <li key={itemKey} className="markdown-li">
                  {item.tokens ? renderListItemTokens(item.tokens, itemKey) : renderTextWithMath(item.text, itemKey)}
                </li>
              );
            })}
          </ListTag>
        );
      }

      case 'blockquote':
        return (
          <blockquote key={key} className="markdown-blockquote">
            {token.tokens ? renderBlockTokens(token.tokens, key) : renderTextWithMath(token.text, key)}
          </blockquote>
        );

      case 'table':
        return (
          <div key={key} className="markdown-table-wrapper">
            <table className="markdown-table">
              <thead>
                <tr>
                  {token.header.map((cell, cIdx) => (
                    <th key={cIdx} style={{ textAlign: token.align[cIdx] || 'left' }}>
                      {cell.tokens ? renderInlineTokens(cell.tokens, `${key}-th-${cIdx}`) : renderTextWithMath(cell.text, `${key}-th-${cIdx}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {token.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ textAlign: token.align[cIdx] || 'left' }}>
                        {cell.tokens ? renderInlineTokens(cell.tokens, `${key}-td-${rIdx}-${cIdx}`) : renderTextWithMath(cell.text, `${key}-td-${rIdx}-${cIdx}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'hr':
        return <hr key={key} className="markdown-hr" />;

      case 'space':
        return null;

      default:
        if (token.tokens) return renderBlockTokens(token.tokens, key);
        return (
          <div key={key}>
            {renderTextWithMath(token.text || token.raw || '', key)}
          </div>
        );
    }
  });
}

/**
 * Complete, safe Markdown & KaTeX renderer for FASTudy AI Tutor responses.
 * Uses marked lexer AST to render proper headings, syntax-highlighted code blocks,
 * LaTeX formulas, lists, blockquotes, tables, and inline typography.
 */
export default function AiResponseContent({ text }) {
  if (!text) return null;

  let tokens = null;
  try {
    tokens = marked.lexer(text);
  } catch (err) {
    console.warn('AiResponseContent markdown lexer fallback:', err);
  }
  if (!tokens) {
    return (
      <div className="ai-response-content fallback-raw" style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    );
  }
  return <div className="ai-response-content">{renderBlockTokens(tokens)}</div>;
}
