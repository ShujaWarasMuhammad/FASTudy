import { useEffect, useRef } from 'react';

/**
 * Lightweight, robust Diagram renderer that uses Mermaid via official CDN script
 * Avoids heavy npm bundle overhead, network timeouts, and works in both online and offline states!
 */
export default function DiagramView({ chart, id = 'diag' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!chart || !containerRef.current) return;

    let isMounted = true;

    // Load mermaid from CDN if not already loaded globally
    const renderChart = () => {
      if (window.mermaid) {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
        });

        const uniqueId = `mermaid_${id.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        try {
          window.mermaid.render(uniqueId, chart.trim()).then(({ svg }) => {
            if (isMounted && containerRef.current) {
              containerRef.current.innerHTML = svg;
            }
          }).catch((err) => {
            console.warn('Diagram render issue:', err);
            if (isMounted && containerRef.current) {
              containerRef.current.innerHTML = `<pre class="diagram-raw-pre">${chart}</pre>`;
            }
          });
        } catch (e) {
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = `<pre class="diagram-raw-pre">${chart}</pre>`;
          }
        }
      } else {
        // Fallback display while script loads or if offline
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="diagram-raw-pre">${chart}</pre>`;
        }
      }
    };

    if (window.mermaid) {
      renderChart();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        renderChart();
      };
      script.onerror = () => {
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="diagram-raw-pre">${chart}</pre>`;
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  return (
    <div
      ref={containerRef}
      className="diagram-rendered-wrapper"
    />
  );
}
