import MathView from './MathView';
import DiagramView from './DiagramView';

/**
 * Universal Visualization Renderer:
 * Handles:
 * 1. 'mermaid' / 'flowchart' / 'graph' -> Renders Mermaid.js diagrams (memory tables, pointers, execution flow, recursion trees)
 * 2. 'latex' / 'math' / 'tikz' -> Renders KaTeX LaTeX mathematical visualizations
 * 3. 'image' -> Direct SVG or image URL
 */
export default function VisualizationView({ visualization, questionId }) {
  if (!visualization) return null;

  const { type, content, title, caption } = visualization;

  return (
    <div className="visualization-box-card">
      <div className="visualization-header">
        <span className="vis-badge">LIVE VISUALIZATION</span>
        {title && <span className="vis-title">{title}</span>}
      </div>

      <div className="visualization-canvas">
        {/* Mermaid Diagram (Memory Layout / Pointers / Recursion Tree / Flowchart) */}
        {(type === 'mermaid' || type === 'diagram' || type === 'flowchart') && (
          <DiagramView chart={content} id={questionId || 'vis'} />
        )}

        {/* LaTeX Math / Geometric Formulations */}
        {(type === 'latex' || type === 'math' || type === 'tikz') && (
          <div className="latex-vis-container">
            <MathView math={content} displayMode={true} />
          </div>
        )}

        {/* Raw SVG or Web Image */}
        {type === 'image' && (
          <img src={content} alt={title || 'Visualization'} className="vis-img" />
        )}

        {/* Inline Raw SVG */}
        {type === 'svg' && (
          <div
            className="vis-svg-container"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>

      {caption && <p className="vis-caption">{caption}</p>}
    </div>
  );
}
