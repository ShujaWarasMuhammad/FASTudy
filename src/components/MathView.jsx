import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * MathView component renders mathematical LaTeX formulas
 * Can handle inline math ($...$) or block display ($$...$$)
 */
export default function MathView({ math, displayMode = false, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !math) return;
    try {
      // Clean string
      let cleanMath = math.trim();
      // Strip outer delimiters if present
      let renderDisplayMode = displayMode;
      if (cleanMath.startsWith('$$') && cleanMath.endsWith('$$')) {
        cleanMath = cleanMath.slice(2, -2).trim();
        renderDisplayMode = true;
      } else if (cleanMath.startsWith('$') && cleanMath.endsWith('$')) {
        cleanMath = cleanMath.slice(1, -1).trim();
      }

      katex.render(cleanMath, containerRef.current, {
        displayMode: renderDisplayMode,
        throwOnError: false,
      });
    } catch {
      if (containerRef.current) {
        containerRef.current.innerText = math;
      }
    }
  }, [math, displayMode]);

  return <span ref={containerRef} className={`math-renderer ${className}`} />;
}
